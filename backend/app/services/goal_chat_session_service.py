import asyncio
import json as _json
import logging
import time
import uuid
from typing import Any, Dict, List

from app.core.config import settings
from app.core.redis_config import redis_client
from app.services.goal_chat.conversation_manager import ConversationManager
from app.services.goal_chat.plan_validator import PlanValidator
from app.services.goal_chat.profile_engine import ProfileEngine
from app.services.goal_chat.slot_tracker import SlotTracker
from redis.exceptions import RedisError

logger = logging.getLogger(__name__)


class GoalChatSessionService:
    def __init__(self, ttl_seconds: int | None = None) -> None:
        self._ttl_seconds = int(ttl_seconds or settings.GOAL_CHAT_SESSION_TTL_SECONDS)
        self._sessions: Dict[str, Dict[str, Any]] = {}
        self._lock = asyncio.Lock()
        self._redis = redis_client
        self._key_prefix = "goal_chat_session"

        slot_tracker = SlotTracker()
        profile_engine = ProfileEngine()
        self._conversation_manager = ConversationManager(slot_tracker=slot_tracker, profile_engine=profile_engine)
        self._profile_engine = profile_engine
        self._plan_validator = PlanValidator(slot_tracker=slot_tracker)

    def _key(self, session_id: str) -> str:
        return f"{self._key_prefix}:{session_id}"

    async def _redis_get_session(self, session_id: str) -> Dict[str, Any] | None:
        try:
            raw = await self._redis.get(self._key(session_id))
        except RedisError as exc:
            logger.warning("Goal chat Redis read failed for session %s: %s", session_id, exc)
            return None

        if not raw:
            return None

        try:
            return _json.loads(raw)
        except Exception:
            logger.warning("Goal chat Redis payload is invalid JSON for session %s", session_id)
            return None

    async def _redis_set_session(self, session_id: str, session: Dict[str, Any]) -> None:
        ttl = max(1, int(float(session["expires_at"]) - time.monotonic()))
        try:
            await self._redis.setex(self._key(session_id), ttl, _json.dumps(session))
        except RedisError as exc:
            logger.warning("Goal chat Redis write failed for session %s: %s", session_id, exc)

    async def _redis_delete_session(self, session_id: str) -> None:
        try:
            await self._redis.delete(self._key(session_id))
        except RedisError as exc:
            logger.warning("Goal chat Redis delete failed for session %s: %s", session_id, exc)

    async def create_session(self, user_id: str | None, behavioral_summary: str | None) -> Dict[str, Any]:
        session_id = str(uuid.uuid4())
        profile = self._profile_engine.build_initial_profile(behavioral_summary=behavioral_summary)
        now = time.monotonic()
        session_data = {
            "session_id": session_id,
            "user_id": user_id,
            "slots": {},
            "profile": profile.model_dump(),
            "history": [],
            "status": "collecting",
            "expires_at": now + self._ttl_seconds,
        }
        async with self._lock:
            self._sessions[session_id] = session_data
            await self._redis_set_session(session_id, session_data)
        return session_data

    async def get_session(self, session_id: str) -> Dict[str, Any]:
        async with self._lock:
            session = self._sessions.get(session_id)
            if session is None:
                session = await self._redis_get_session(session_id)
                if session is not None:
                    self._sessions[session_id] = session
            if session is None or float(session["expires_at"]) <= time.monotonic():
                self._sessions.pop(session_id, None)
                await self._redis_delete_session(session_id)
                raise KeyError("Goal chat session not found or expired.")
            return dict(session)

    async def apply_turn(
        self,
        session_id: str,
        message: str,
        slot_updates: Dict[str, Any],
        profile_answers: Dict[str, str],
    ) -> Dict[str, Any]:
        async with self._lock:
            session = self._sessions.get(session_id)
            if session is None:
                session = await self._redis_get_session(session_id)
                if session is not None:
                    self._sessions[session_id] = session
            if session is None or float(session["expires_at"]) <= time.monotonic():
                self._sessions.pop(session_id, None)
                await self._redis_delete_session(session_id)
                raise KeyError("Goal chat session not found or expired.")

            use_ai = (
                bool(getattr(settings, "GOAL_CHAT_AI_ENABLED", True))
                and str(getattr(settings, "ENVIRONMENT", "")).lower() not in {"test"}
            )

            # Add user message to history FIRST so AI sees it
            history = list(session.get("history", []))
            history.append({"role": "user", "message": message})

            if use_ai:
                t0 = time.monotonic()
                ai_result = await self._chat_turn(
                    user_message=message,
                    conversation_history=history,
                )
                logger.info("chat_turn completed in %.1fs", time.monotonic() - t0)
            else:
                ai_result = {
                    "next_prompt": "Tell me more about your goal.",
                    "quick_reply_chips": [],
                    "conversation_complete": False,
                }

            next_prompt = ai_result.get("next_prompt", "Tell me more about your goal.")
            conversation_complete = ai_result.get("conversation_complete", False)
            quick_reply_chips = ai_result.get("quick_reply_chips", [])

            # Add AI response to history
            history.append({"role": "assistant", "message": next_prompt})

            # Update session
            session["history"] = history
            session["status"] = "ready" if conversation_complete else "collecting"
            session["expires_at"] = time.monotonic() + self._ttl_seconds
            self._sessions[session_id] = session
            await self._redis_set_session(session_id, session)

            # Also run the old slot-based system for backward compat
            merged_slot_updates = self._conversation_manager._slot_tracker.merge_slots(
                ai_result.get("extracted_slots", {}),
                slot_updates,
            )
            session["slots"] = self._conversation_manager._slot_tracker.merge_slots(
                session.get("slots", {}), merged_slot_updates
            )
            self._sessions[session_id] = session
            await self._redis_set_session(session_id, session)

            missing = self._conversation_manager._slot_tracker.missing_slots(session.get("slots", {}))

            chips = [str(c) for c in quick_reply_chips[:4]] if isinstance(quick_reply_chips, list) else []
            if conversation_complete and "Review my plan" not in chips:
                chips = ["Review my plan"]

            response = {
                "missing_slots": missing,
                "captured_slots": session.get("slots", {}),
                "next_prompt": next_prompt,
                "is_ready_to_finalize": conversation_complete,
                "profile": session["profile"],
                "quick_reply_chips": chips,
            }
            return response

    async def _chat_turn(
        self,
        user_message: str,
        conversation_history: List[Dict[str, str]],
    ) -> Dict[str, Any]:
        """Conversational AI turn — no structured slot extraction.
        The AI just has a natural conversation and signals when it has enough info."""

        history_lines = []
        for entry in conversation_history:
            role = entry.get("role", "user")
            history_lines.append(f"  {role}: {entry.get('message', '')}")
        history_text = "\n".join(history_lines)

        user_turn_count = sum(1 for e in conversation_history if e.get("role") == "user")

        prompt = (
            "You are DuoTrak's friendly goal coach. DuoTrak is an app where people achieve goals "
            "with a REAL accountability partner (a friend, not AI). Your job is to have a short, "
            "natural conversation to understand what the user wants to achieve, then signal when "
            "you have enough information for the plan generator to create their plan.\n\n"
            "THINGS YOU WANT TO UNDERSTAND (through natural conversation, NOT interrogation):\n"
            "1. What is their goal?\n"
            "2. When/how often do they want to work on it? (schedule)\n"
            "3. What does success look like for them?\n"
            "4. Any specific focus areas or preferences?\n\n"
            "ACCOUNTABILITY TYPES (mention the best one naturally):\n"
            "- Photo proof: gym, cooking, cleaning, art\n"
            "- Video proof: music, dance, workouts, sports\n"
            "- Voice notes: reading, studying, programming, journaling\n"
            "- Check-in: waking up, medication, daily habits\n"
            "- Task completion: project milestones, general tasks\n\n"
            f"CONVERSATION SO FAR:\n{history_text}\n\n"
            f"THIS IS USER TURN #{user_turn_count}\n\n"
            "CONVERSATION PACING:\n"
            "- Turn 1: Acknowledge the goal, suggest how accountability works for it, "
            "ask about their schedule/availability.\n"
            "- Turn 2: Ask about what success looks like, or what areas to focus on.\n"
            "- Turn 3+: If you feel you understand the goal well enough, set conversation_complete "
            "to true and tell them you will generate their plan.\n"
            "- If the user says 'yeah', 'yes', 'sure', 'let's go', 'sounds good' as a confirmation, "
            "set conversation_complete to true.\n\n"
            "RULES:\n"
            "1. Be warm and friendly. Max 2-3 sentences.\n"
            "2. Ask ONE question at a time.\n"
            "3. Never repeat a question already answered.\n"
            "4. Don't list tasks or create plans — that's the plan generator's job.\n"
            "5. When setting conversation_complete to true, say something like: "
            "'I have a great picture of your goal now! Let me build your personalized plan.'\n\n"
            "Return ONLY valid JSON:\n"
            "{\n"
            '  "next_prompt": "your conversational message",\n'
            '  "quick_reply_chips": ["suggestion 1", "suggestion 2"],\n'
            '  "conversation_complete": false\n'
            "}\n"
        )

        try:
            from google import genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)

            response = await client.aio.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents=prompt,
                config=genai.types.GenerateContentConfig(
                    temperature=0.5,
                    top_p=0.9,
                    response_mime_type="application/json",
                ),
            )
            raw = response.text.strip().replace("```json", "").replace("```", "").strip()
            result = _json.loads(raw)
            return {
                "next_prompt": result.get("next_prompt", "Tell me more about your goal."),
                "quick_reply_chips": result.get("quick_reply_chips", []),
                "conversation_complete": bool(result.get("conversation_complete", False)),
                "extracted_slots": result.get("extracted_slots", {}),
            }
        except Exception as exc:
            logger.warning("_chat_turn fallback: %s", exc)
            return {
                "next_prompt": "Tell me more about your goal.",
                "quick_reply_chips": [],
                "conversation_complete": False,
                "extracted_slots": {},
            }

    async def generate_plan(self, session_id: str) -> Dict[str, Any]:
        """Call the AI planner to generate a rich structured plan from chat context."""
        from app.services.goal_chat.plan_generator import generate_plan as _generate

        session = await self.get_session(session_id)
        slots = session.get("slots", {})
        history = session.get("history", [])

        plan = await _generate(slots=slots, conversation_history=history)

        # Cache generated plan in session
        async with self._lock:
            if session_id in self._sessions:
                self._sessions[session_id]["generated_plan"] = plan
                self._sessions[session_id]["expires_at"] = time.monotonic() + self._ttl_seconds
                await self._redis_set_session(session_id, self._sessions[session_id])

        return {"session_id": session_id, "plan": plan}

    async def get_summary(self, session_id: str) -> Dict[str, Any]:
        session = await self.get_session(session_id)
        slots = dict(session.get("slots", {}))
        tasks = slots.get("tasks") or []
        normalized_tasks = []
        for task in tasks:
            if isinstance(task, dict):
                normalized_tasks.append(
                    {
                        "name": task.get("name", ""),
                        "description": task.get("description", ""),
                    }
                )
        slots["tasks"] = normalized_tasks
        return {
            "session_id": session_id,
            "ready_for_summary": len(self.missing_slots(slots)) == 0,
            "summary": slots,
        }

    async def patch_summary(self, session_id: str, summary_patch: Dict[str, Any]) -> Dict[str, Any]:
        async with self._lock:
            session = self._sessions.get(session_id)
            if session is None:
                session = await self._redis_get_session(session_id)
                if session is not None:
                    self._sessions[session_id] = session
            if session is None or float(session["expires_at"]) <= time.monotonic():
                self._sessions.pop(session_id, None)
                await self._redis_delete_session(session_id)
                raise KeyError("Goal chat session not found or expired.")

            session["slots"] = self._conversation_manager._slot_tracker.merge_slots(session.get("slots", {}), summary_patch)
            session["expires_at"] = time.monotonic() + self._ttl_seconds
            self._sessions[session_id] = session
            await self._redis_set_session(session_id, session)

        return await self.get_summary(session_id)

    async def finalize(self, session_id: str, has_partner: bool) -> Dict[str, Any]:
        session = await self.get_session(session_id)
        slots = session.get("slots", {})
        errors = self._plan_validator.validate_finalize(slots=slots, has_partner=has_partner)
        if errors:
            return {
                "session_id": session_id,
                "finalized": False,
                "goal_plan": None,
                "validation_errors": errors,
            }

        goal_plan = {
            "intent": slots.get("intent"),
            "success_definition": slots.get("success_definition"),
            "accountability_type": slots.get("accountability_type"),
            "deadline": slots.get("deadline"),
            "review_cycle": slots.get("review_cycle"),
            "tasks": slots.get("tasks", []),
            "user_summary": slots.get("user_summary", ""),
            "profile_summary": session["profile"]["merged_summary"],
        }
        async with self._lock:
            if session_id in self._sessions:
                self._sessions[session_id]["status"] = "finalized"
                self._sessions[session_id]["expires_at"] = time.monotonic() + self._ttl_seconds
                await self._redis_set_session(session_id, self._sessions[session_id])

        return {
            "session_id": session_id,
            "finalized": True,
            "goal_plan": goal_plan,
            "validation_errors": [],
        }

    def initial_missing_slots(self) -> list[str]:
        return self._conversation_manager.initial_missing_slots()

    def required_slots(self) -> list[str]:
        return self._conversation_manager.required_slots()

    def missing_slots(self, slots: Dict[str, Any]) -> list[str]:
        return self._conversation_manager._slot_tracker.missing_slots(slots)
