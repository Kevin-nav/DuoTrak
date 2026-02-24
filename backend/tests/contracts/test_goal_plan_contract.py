from app.schemas.agent_crew import GoalPlanResponse


def test_goal_plan_response_matches_canonical_fixture():
    fixture = {
        "session_id": "session-1",
        "goal_plan": {
            "title": "Run a 5k",
            "description": "Train for a neighborhood race",
            "milestones": [
                {
                    "title": "Week 1",
                    "description": "Establish consistency",
                    "tasks": [
                        {
                            "description": "Run for 20 minutes",
                            "success_metric": "3 runs completed",
                            "recommended_cadence": "3x per week",
                            "recommended_time_windows": ["Weekday mornings"],
                            "consistency_rationale": "A predictable rhythm is easier to sustain.",
                            "verification_mode": "time-window",
                            "verification_mode_reason": "Run starts can be verified by check-in time.",
                            "verification_confidence": 0.9,
                            "time_window_start": "06:50",
                            "time_window_end": "07:10",
                            "partner_required": True,
                            "auto_approval_policy": "time_window_only",
                            "auto_approval_timeout_hours": 24,
                            "auto_approval_min_confidence": 0.85,
                            "partner_involvement": {
                                "daily_check_in_suggestion": "Quick post-run ping.",
                                "weekly_anchor_review": "Sunday recap.",
                                "fallback_if_missed": "Encourage a lighter make-up run the next day.",
                            },
                            "proof_guidance": {
                                "what_counts": ["Start check-in in time window", "Post-run summary"],
                                "good_examples": ["7:02 AM completion check-in"],
                                "avoid_examples": ["Checking in hours later"],
                            },
                        }
                    ],
                }
            ],
            "success_metrics": ["3 runs completed"],
            "adherence_weight": 0.7,
            "schedule_soft_cap_percent": 10,
            "schedule_impact": {
                "capacity_minutes": 210,
                "projected_load_minutes": 195,
                "overload_percent": 0,
                "conflict_flags": [],
                "fit_band": "good",
            },
            "decision_trace": [
                "Plan aligns with your preferred morning availability.",
                "Workload stays under your weekly capacity.",
            ],
            "partner_accountability": {
                "role": "Check in nightly",
                "check_in_schedule": "daily",
                "shared_celebrations": "Coffee date on milestone completion",
            },
        },
        "partner_integration": "Daily check-ins with partner",
        "personalization_score": 8.5,
        "execution_metadata": {
            "plan_generation_time_ms": 420,
        },
    }

    GoalPlanResponse.model_validate(fixture)


def _base_task(**overrides):
    """Helper to build a valid task dict with minimal boilerplate."""
    base = {
        "description": "Test task",
        "success_metric": "Task completed",
        "recommended_cadence": "daily",
        "recommended_time_windows": ["Morning"],
        "consistency_rationale": "Daily repetition is key.",
        "verification_mode": "photo",
        "verification_mode_reason": "Photo provides evidence.",
        "verification_confidence": 0.85,
        "partner_required": True,
        "auto_approval_policy": "time_window_only",
        "auto_approval_timeout_hours": 24,
        "auto_approval_min_confidence": 0.85,
    }
    base.update(overrides)
    return base


def _base_plan(**overrides):
    """Helper to build a valid plan response dict."""
    base = {
        "session_id": "session-test",
        "goal_plan": {
            "title": "Test Plan",
            "description": "Test description",
            "milestones": [{"title": "M1", "description": "Milestone 1", "tasks": [_base_task()]}],
            "success_metrics": ["Test metric"],
            "adherence_weight": 0.8,
            "schedule_soft_cap_percent": 10,
            "schedule_impact": {
                "capacity_minutes": 420,
                "projected_load_minutes": 300,
                "overload_percent": 0,
                "conflict_flags": [],
                "fit_band": "good",
            },
            "decision_trace": ["Reason 1"],
            "partner_accountability": {
                "role": "Supporter",
                "check_in_schedule": "daily",
                "shared_celebrations": "milestones",
            },
        },
        "partner_integration": "Daily check-ins",
        "personalization_score": 7.5,
        "execution_metadata": {"plan_generation_time_ms": 200},
    }
    for k, v in overrides.items():
        if isinstance(v, dict) and k in base:
            base[k].update(v)
        else:
            base[k] = v
    return base


def test_habit_plan_with_cadence_and_config():
    """Validates a habit plan with structured cadence, habit_config, and first_day_actions."""
    task = _base_task(
        cadence={"type": "daily", "days": [], "duration_weeks": None},
        difficulty_level=1,
        minimum_viable_action="2-minute meditation",
    )
    plan = _base_plan()
    plan["goal_plan"]["goal_type"] = "habit"
    plan["goal_plan"]["milestones"][0]["tasks"] = [task]
    plan["goal_plan"]["habit_config"] = {
        "minimum_viable_start": "2-minute meditation",
        "habit_anchor": "After morning coffee",
        "ramp_up_weeks": 3,
        "streak_milestones": [3, 7, 14, 21],
        "allowed_miss_days": 1,
    }
    plan["goal_plan"]["first_day_actions"] = [
        "Do 2-minute meditation — right after morning coffee",
        "Take a quick photo as proof",
        "Tell your partner you started",
    ]
    plan["goal_plan"]["this_week_preview"] = "This week: Build your streak with daily sessions."

    GoalPlanResponse.model_validate(plan)


def test_milestone_plan_with_checkpoints():
    """Validates a milestone plan with checkpoint config."""
    task = _base_task(
        cadence={"type": "weekly", "days": ["mon", "thu"], "duration_weeks": 4},
        difficulty_level=2,
        minimum_viable_action="Work on it for 30 minutes",
    )
    plan = _base_plan()
    plan["goal_plan"]["goal_type"] = "milestone"
    plan["goal_plan"]["milestones"][0]["tasks"] = [task]
    plan["goal_plan"]["milestone_config"] = {
        "total_checkpoints": 4,
        "checkpoints": [
            {"target_label": "25% complete", "deadline_description": "End of Week 1"},
            {"target_label": "100% complete", "deadline_description": "End of Week 4"},
        ],
        "critical_path_warning": "Watch for: Time constraints",
    }
    plan["goal_plan"]["first_day_actions"] = [
        "Break 'first deliverable' into 3 small sub-tasks",
        "Complete the easiest sub-task today",
    ]

    GoalPlanResponse.model_validate(plan)


def test_target_date_plan_with_phases():
    """Validates a target-date plan with periodization phases."""
    task = _base_task(
        cadence={"type": "custom", "days": ["mon", "wed", "fri"], "duration_weeks": 4},
        difficulty_level=1,
    )
    plan = _base_plan()
    plan["goal_plan"]["goal_type"] = "target-date"
    plan["goal_plan"]["milestones"][0]["tasks"] = [task]
    plan["goal_plan"]["target_date_config"] = {
        "total_phases": 3,
        "phases": [
            {"name": "Foundation", "week_range": "1-3", "focus": "Build base", "intensity": "low"},
            {"name": "Build", "week_range": "4-8", "focus": "Progressive overload", "intensity": "medium"},
        ],
        "periodization_type": "linear",
        "rest_protocol": "No constraints",
    }

    GoalPlanResponse.model_validate(plan)


def test_shared_goal_with_template_enhancement():
    """Validates shared goal mode and template attribution fields."""
    plan = _base_plan()
    plan["goal_plan"]["shared_goal_mode"] = "independent"
    plan["goal_plan"]["partner_timezone_adjustment"] = "Tasks adjusted: America/New_York ↔ Europe/London"
    plan["goal_plan"]["template_source_title"] = "Morning Routine Pro"
    plan["goal_plan"]["template_enhanced"] = True

    GoalPlanResponse.model_validate(plan)


def test_wizard_request_with_shared_goal_fields():
    """Validates GoalWizardRequest accepts new shared goal and template enhancement fields."""
    from app.schemas.agent_crew import GoalWizardRequest

    request = GoalWizardRequest(
        user_id="user-123",
        wizard_data={
            "goal_description": "Run every morning",
            "motivation": "Get healthier and more energetic",
            "availability": ["Mornings"],
            "time_commitment": "30 min",
            "accountability_type": "visual_proof",
            "goal_type": "habit",
            "timezone": "America/New_York",
            "is_shared_goal": True,
            "shared_goal_mode": "independent",
            "partner_timezone": "Europe/London",
            "template_enhancement_mode": True,
            "goal_template_id": "tmpl-1",
            "goal_template_title": "Morning Runner",
        },
    )
    assert request.wizard_data.is_shared_goal is True
    assert request.wizard_data.shared_goal_mode == "independent"
    assert request.wizard_data.template_enhancement_mode is True
