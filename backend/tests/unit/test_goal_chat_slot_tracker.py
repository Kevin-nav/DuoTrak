from app.services.goal_chat.slot_tracker import SlotTracker


def test_slot_tracker_requires_deadline_for_target_date():
    tracker = SlotTracker()
    slots = {
        "intent": "target-date",
        "success_definition": "Launch by date",
        "availability": "Weekdays",
        "time_budget": "10h/week",
        "accountability_mode": "partner-review",
        "tasks": [{"name": "Build API"}],
    }

    missing = tracker.missing_slots(slots)
    assert missing == ["deadline"]


def test_slot_tracker_requires_review_cycle_for_habit_and_milestone():
    tracker = SlotTracker()
    base_slots = {
        "success_definition": "Consistency",
        "availability": "Mornings",
        "time_budget": "30m/day",
        "accountability_mode": "check-in",
        "tasks": [{"name": "Practice"}],
    }

    habit_missing = tracker.missing_slots({"intent": "habit", **base_slots})
    milestone_missing = tracker.missing_slots({"intent": "milestone", **base_slots})

    assert habit_missing == ["review_cycle"]
    assert milestone_missing == ["review_cycle"]
