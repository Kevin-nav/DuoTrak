from app.services.goal_chat.slot_tracker import SlotTracker


def test_slot_tracker_requires_deadline_for_target_date():
    tracker = SlotTracker()
    slots = {
        "intent": "target-date",
        "success_definition": "Launch by date",
        "accountability_type": "task_completion",
        "tasks": [{"name": "Build API"}],
    }

    missing = tracker.missing_slots(slots)
    assert missing == ["deadline"]


def test_slot_tracker_no_extra_requirements_for_habit():
    tracker = SlotTracker()
    slots = {
        "intent": "habit",
        "success_definition": "Consistency",
        "accountability_type": "photo",
        "tasks": [{"name": "Practice"}],
    }

    missing = tracker.missing_slots(slots)
    assert missing == []


def test_slot_tracker_base_missing_slots():
    tracker = SlotTracker()
    missing = tracker.missing_slots({})
    assert "intent" in missing
    assert "success_definition" in missing
    assert "accountability_type" in missing
    assert "tasks" in missing
