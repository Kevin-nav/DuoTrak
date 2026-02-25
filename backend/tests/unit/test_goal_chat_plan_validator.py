from app.services.goal_chat.plan_validator import PlanValidator
from app.services.goal_chat.slot_tracker import SlotTracker


def test_plan_validator_rejects_missing_partner():
    validator = PlanValidator(slot_tracker=SlotTracker())
    slots = {
        "intent": "habit",
        "success_definition": "Practice daily",
        "accountability_type": "voice",
        "tasks": [{"name": "Practice scales"}],
    }

    errors = validator.validate_finalize(slots=slots, has_partner=False)
    assert any("Partner is required" in error for error in errors)


def test_plan_validator_accepts_complete_slots():
    validator = PlanValidator(slot_tracker=SlotTracker())
    slots = {
        "intent": "target-date",
        "success_definition": "Ship API by deadline",
        "accountability_type": "task_completion",
        "deadline": "2026-05-01",
        "tasks": [{"name": "Implement endpoint"}],
    }

    errors = validator.validate_finalize(slots=slots, has_partner=True)
    assert errors == []


def test_plan_validator_rejects_invalid_accountability_type():
    validator = PlanValidator(slot_tracker=SlotTracker())
    slots = {
        "intent": "habit",
        "success_definition": "Run daily",
        "accountability_type": "invalid_type",
        "tasks": [{"name": "Run"}],
    }

    errors = validator.validate_finalize(slots=slots, has_partner=True)
    assert any("Invalid accountability_type" in error for error in errors)
