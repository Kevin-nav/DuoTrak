from typing import Any, Dict, List


class SlotTracker:
    BASE_REQUIRED_SLOTS: List[str] = [
        "intent",
        "success_definition",
        "accountability_type",
        "tasks",
    ]

    INTENT_REQUIRED_SLOTS: Dict[str, List[str]] = {
        "target-date": ["deadline"],
    }

    VALID_ACCOUNTABILITY_TYPES = {"photo", "video", "voice", "check_in", "task_completion"}

    def required_slots_for_intent(self, intent: str | None) -> List[str]:
        required = list(self.BASE_REQUIRED_SLOTS)
        if intent in self.INTENT_REQUIRED_SLOTS:
            required.extend(self.INTENT_REQUIRED_SLOTS[intent])
        return required

    def merge_slots(self, current: Dict[str, Any], updates: Dict[str, Any]) -> Dict[str, Any]:
        merged = dict(current)
        for key, value in updates.items():
            if value is None:
                continue
            merged[key] = value
        return merged

    def missing_slots(self, slots: Dict[str, Any]) -> List[str]:
        intent = slots.get("intent")
        required_slots = self.required_slots_for_intent(intent)
        missing: List[str] = []
        for slot_name in required_slots:
            value = slots.get(slot_name)
            if not self._is_filled(value):
                missing.append(slot_name)
        return missing

    @staticmethod
    def _is_filled(value: Any) -> bool:
        if value is None:
            return False
        if isinstance(value, str):
            return value.strip() != ""
        if isinstance(value, list):
            return len(value) > 0
        return True
