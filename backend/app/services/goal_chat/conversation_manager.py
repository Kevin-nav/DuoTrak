from typing import Any, Dict, List, Tuple

from app.schemas.goal_chat import GoalChatProfileState
from app.services.goal_chat.profile_engine import ProfileEngine
from app.services.goal_chat.slot_tracker import SlotTracker


SLOT_PROMPTS: Dict[str, str] = {
    "intent": "Is this a daily habit, a milestone you want to hit, or a target-date goal?",
    "success_definition": "What does success look like for you — in one clear sentence?",
    "accountability_type": "How should your partner hold you accountable?",
    "tasks": "What are the key steps for this goal?",
    "deadline": "When would you like to complete this goal?",
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
        slots = self._slot_tracker.merge_slots(state["slots"], slot_updates)
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
            return "I have everything I need! Let me put together your goal summary for review."
        return SLOT_PROMPTS.get(missing_slots[0], f"Tell me about {missing_slots[0]}.")

    @staticmethod
    def _chips_for_slot(slot: str | None) -> List[str]:
        if slot == "intent":
            return ["Habit", "Milestone", "Target-date"]
        if slot == "accountability_type":
            return ["📸 Photo proof", "🎙️ Voice reflection", "⏰ Check-in", "✅ Task completion"]
        if slot == "deadline":
            return ["Next week", "In one month", "In 3 months", "End of the year"]
        return []
