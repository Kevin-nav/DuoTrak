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
