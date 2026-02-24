from typing import Any, Dict, Tuple

from app.schemas.goal_chat import GoalChatProfileState
from app.services.goal_chat.profile_engine import ProfileEngine
from app.services.goal_chat.slot_tracker import SlotTracker


SLOT_PROMPTS: Dict[str, str] = {
    "intent": "What type of goal is this: target-date, habit, or milestone?",
    "success_definition": "How will you measure success in concrete terms?",
    "availability": "What days or time windows can you consistently use?",
    "time_budget": "How much time can you commit each day or week?",
    "accountability_mode": "What accountability mode should your partner use?",
    "tasks": "List the concrete tasks required for this goal.",
    "deadline": "What target date should this goal hit?",
    "review_cycle": "What review cycle should be used to evaluate progress?",
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
        }
        return updated_state, response

    def initial_missing_slots(self) -> list[str]:
        return self._slot_tracker.missing_slots({})

    def required_slots(self) -> list[str]:
        return self._slot_tracker.required_slots_for_intent(None)

    @staticmethod
    def _next_prompt(missing_slots: list[str]) -> str:
        if not missing_slots:
            return "All required slots are complete. You can finalize this goal now."
        return SLOT_PROMPTS.get(missing_slots[0], f"Please provide {missing_slots[0]}.")
