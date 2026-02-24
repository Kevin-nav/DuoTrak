from app.services.goal_chat.plan_validator import PlanValidator
from app.services.goal_chat.slot_tracker import SlotTracker


def test_plan_validator_rejects_missing_partner_and_task_partner_fields():
    validator = PlanValidator(slot_tracker=SlotTracker())
    slots = {
        "intent": "habit",
        "success_definition": "Practice daily",
        "availability": "Evenings",
        "time_budget": "20m/day",
        "accountability_mode": "partner-review",
        "review_cycle": "weekly",
        "tasks": [{"name": "Practice scales"}],
    }

    errors = validator.validate_finalize(slots=slots, has_partner=False)
    assert any("Partner is required" in error for error in errors)
    assert any("must require partner review" in error for error in errors)
    assert any("missing review_sla" in error for error in errors)
    assert any("missing escalation_policy" in error for error in errors)


def test_plan_validator_accepts_complete_slots_and_tasks():
    validator = PlanValidator(slot_tracker=SlotTracker())
    slots = {
        "intent": "target-date",
        "success_definition": "Ship API by deadline",
        "availability": "Weekdays",
        "time_budget": "2h/day",
        "accountability_mode": "partner-review",
        "deadline": "2026-05-01",
        "tasks": [
            {
                "name": "Implement endpoint",
                "requires_partner_review": True,
                "review_sla": "24h",
                "escalation_policy": "Escalate after missed SLA",
            }
        ],
    }

    errors = validator.validate_finalize(slots=slots, has_partner=True)
    assert errors == []
