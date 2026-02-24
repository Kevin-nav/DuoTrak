import asyncio
import time
import uuid
from typing import Any, Dict

from app.core.config import settings
from app.services.goal_chat.conversation_manager import ConversationManager
from app.services.goal_chat.plan_validator import PlanValidator
from app.services.goal_chat.profile_engine import ProfileEngine
from app.services.goal_chat.slot_tracker import SlotTracker


class GoalChatSessionService:
    def __init__(self, ttl_seconds: int | None = None) -> None:
        self._ttl_seconds = int(ttl_seconds or settings.GOAL_CHAT_SESSION_TTL_SECONDS)
        self._sessions: Dict[str, Dict[str, Any]] = {}
        self._lock = asyncio.Lock()

        slot_tracker = SlotTracker()
        profile_engine = ProfileEngine()
        self._conversation_manager = ConversationManager(slot_tracker=slot_tracker, profile_engine=profile_engine)
        self._profile_engine = profile_engine
        self._plan_validator = PlanValidator(slot_tracker=slot_tracker)

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
        return session_data

    async def get_session(self, session_id: str) -> Dict[str, Any]:
        async with self._lock:
            session = self._sessions.get(session_id)
            if session is None or float(session["expires_at"]) <= time.monotonic():
                self._sessions.pop(session_id, None)
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
            if session is None or float(session["expires_at"]) <= time.monotonic():
                self._sessions.pop(session_id, None)
                raise KeyError("Goal chat session not found or expired.")

            updated_session, response = self._conversation_manager.apply_turn(
                state=session,
                message=message,
                slot_updates=slot_updates,
                profile_answers=profile_answers,
            )
            updated_session["expires_at"] = time.monotonic() + self._ttl_seconds
            self._sessions[session_id] = updated_session
            return response

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
                        "requires_partner_review": task.get("requires_partner_review", True),
                        "review_sla": task.get("review_sla", "24h"),
                        "escalation_policy": task.get("escalation_policy", "Escalate after missed SLA"),
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
            if session is None or float(session["expires_at"]) <= time.monotonic():
                self._sessions.pop(session_id, None)
                raise KeyError("Goal chat session not found or expired.")

            session["slots"] = self._conversation_manager._slot_tracker.merge_slots(session.get("slots", {}), summary_patch)
            session["expires_at"] = time.monotonic() + self._ttl_seconds
            self._sessions[session_id] = session

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
            "intent": slots["intent"],
            "success_definition": slots["success_definition"],
            "availability": slots["availability"],
            "time_budget": slots["time_budget"],
            "accountability_mode": slots["accountability_mode"],
            "deadline": slots.get("deadline"),
            "review_cycle": slots.get("review_cycle"),
            "tasks": slots["tasks"],
            "profile_summary": session["profile"]["merged_summary"],
        }
        async with self._lock:
            if session_id in self._sessions:
                self._sessions[session_id]["status"] = "finalized"
                self._sessions[session_id]["expires_at"] = time.monotonic() + self._ttl_seconds

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
