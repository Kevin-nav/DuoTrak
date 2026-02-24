import re
from typing import Any, Dict, List, Tuple

from app.schemas.goal_chat import GoalChatProfileState
from app.services.goal_chat.profile_engine import ProfileEngine
from app.services.goal_chat.slot_tracker import SlotTracker


SLOT_PROMPTS: Dict[str, str] = {
    "intent": "What kind of goal is this: habit, milestone, or target-date?",
    "success_definition": "What does success look like in one clear sentence?",
    "availability": "When do you realistically have time for this?",
    "time_budget": "How much time can you commit each day or week?",
    "accountability_mode": "How should your partner keep you accountable?",
    "tasks": "What are the key tasks this goal should include?",
    "deadline": "What exact deadline do you want for this target-date goal?",
    "review_cycle": "How often should you and your partner review progress?",
}


class ConversationManager:
    def __init__(self, slot_tracker: SlotTracker, profile_engine: ProfileEngine) -> None:
        self._slot_tracker = slot_tracker
        self._profile_engine = profile_engine

    def apply_turn(
        self,
        state: Dict[str, Any],
        message: str,
        slot_updates: Dict[str, Any],
        profile_answers: Dict[str, str],
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        inferred_updates = self._infer_slot_updates(message, state["slots"])
        merged_updates = self._slot_tracker.merge_slots(inferred_updates, slot_updates)
        slots = self._slot_tracker.merge_slots(state["slots"], merged_updates)
        profile = GoalChatProfileState.model_validate(state["profile"])
        profile = self._profile_engine.merge(profile, profile_answers)

        missing_slots = self._slot_tracker.missing_slots(slots)
        next_prompt = self._next_prompt(missing_slots)
        quick_reply_chips = self._chips_for_slot(missing_slots[0] if missing_slots else None)
        ready = len(missing_slots) == 0

        updated_state = dict(state)
        updated_state["slots"] = slots
        updated_state["profile"] = profile.model_dump()
        updated_state["history"] = [*state["history"], {"role": "user", "message": message}]
        updated_state["status"] = "ready" if ready else "collecting"

        response = {
            "missing_slots": missing_slots,
            "captured_slots": slots,
            "next_prompt": next_prompt,
            "is_ready_to_finalize": ready,
            "profile": profile.model_dump(),
            "quick_reply_chips": quick_reply_chips,
        }
        return updated_state, response

    def initial_missing_slots(self) -> list[str]:
        return self._slot_tracker.missing_slots({})

    def required_slots(self) -> list[str]:
        return self._slot_tracker.required_slots_for_intent(None)

    @staticmethod
    def _next_prompt(missing_slots: list[str]) -> str:
        if not missing_slots:
            return "I have what I need. I can generate your summary for review now."
        return SLOT_PROMPTS.get(missing_slots[0], f"Tell me about {missing_slots[0]}.")

    @staticmethod
    def _chips_for_slot(slot: str | None) -> List[str]:
        if slot == "intent":
            return ["Habit", "Milestone", "Target-date"]
        if slot == "availability":
            return ["Weekday mornings", "Evenings", "Weekends"]
        if slot == "time_budget":
            return ["15 min/day", "30 min/day", "5 hrs/week"]
        if slot == "accountability_mode":
            return ["Daily check-in", "Proof review", "Weekly recap"]
        if slot == "review_cycle":
            return ["Weekly", "Bi-weekly", "Monthly"]
        return []

    @staticmethod
    def _infer_slot_updates(message: str, current_slots: Dict[str, Any]) -> Dict[str, Any]:
        text = message.strip()
        lower = text.lower()
        updates: Dict[str, Any] = {}

        if "habit" in lower:
            updates["intent"] = "habit"
        elif "milestone" in lower:
            updates["intent"] = "milestone"
        elif "target-date" in lower or "deadline" in lower:
            updates["intent"] = "target-date"

        if "morning" in lower or "evening" in lower or "weekend" in lower or "weekday" in lower:
            updates["availability"] = text

        if re.search(r"\b(\d+)\s*(min|mins|minutes|hour|hours|hr|hrs)\b", lower):
            updates["time_budget"] = text

        if re.search(r"\b\d{4}-\d{2}-\d{2}\b", text):
            updates["deadline"] = re.search(r"\b\d{4}-\d{2}-\d{2}\b", text).group(0)
            updates["intent"] = current_slots.get("intent") or "target-date"

        if "daily" in lower or "check-in" in lower or "review" in lower or "accountability" in lower:
            updates["accountability_mode"] = text

        if "weekly" in lower or "bi-weekly" in lower or "monthly" in lower:
            updates["review_cycle"] = text

        if "," in text or " and " in lower:
            parts = [p.strip(" .") for p in re.split(r",| and ", text) if p.strip()]
            if len(parts) >= 2 and not current_slots.get("tasks"):
                updates["tasks"] = [
                    {
                        "name": part[:120],
                        "requires_partner_review": True,
                        "review_sla": "24h",
                        "escalation_policy": "Escalate after missed SLA",
                    }
                    for part in parts[:5]
                ]

        if "tasks" in lower and not updates.get("tasks"):
            updates["tasks"] = [
                {
                    "name": text[:120],
                    "requires_partner_review": True,
                    "review_sla": "24h",
                    "escalation_policy": "Escalate after missed SLA",
                }
            ]

        if "success" in lower or "finish" in lower or "complete" in lower:
            updates["success_definition"] = text
        elif "success_definition" not in current_slots and len(text) > 20 and not updates.get("success_definition"):
            updates["success_definition"] = text

        return updates
