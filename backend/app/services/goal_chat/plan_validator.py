from typing import Any, Dict, List

from app.services.goal_chat.slot_tracker import SlotTracker


class PlanValidator:
    def __init__(self, slot_tracker: SlotTracker) -> None:
        self._slot_tracker = slot_tracker

    def validate_finalize(self, slots: Dict[str, Any], has_partner: bool) -> List[str]:
        errors: List[str] = []
        missing_slots = self._slot_tracker.missing_slots(slots)
        if missing_slots:
            errors.append(f"Missing required slots: {', '.join(missing_slots)}")

        if not has_partner:
            errors.append("Partner is required to finalize goal chat plan.")

        tasks = slots.get("tasks") or []
        for idx, task in enumerate(tasks):
            if not isinstance(task, dict):
                errors.append(f"Task {idx + 1} must be an object.")
                continue
            if task.get("requires_partner_review") is not True:
                errors.append(f"Task {idx + 1} must require partner review.")
            if not self._has_text(task.get("review_sla")):
                errors.append(f"Task {idx + 1} is missing review_sla.")
            if not self._has_text(task.get("escalation_policy")):
                errors.append(f"Task {idx + 1} is missing escalation_policy.")

        return errors

    @staticmethod
    def _has_text(value: Any) -> bool:
        return isinstance(value, str) and value.strip() != ""
