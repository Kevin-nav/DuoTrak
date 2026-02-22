from app.services.goal_plan_adapter import adapt_goal_plan_response


def _base_raw_result():
    return {
        "goal_plan": {
            "title": "Morning Run",
            "description": "Build running consistency",
            "milestones": [
                {
                    "title": "Week 1",
                    "description": "Start routine",
                    "tasks": [
                        {
                            "description": "Run for 30 minutes",
                            "success_metric": "30 minutes completed",
                            "recommended_cadence": "daily",
                            "recommended_time_windows": ["Evenings (6-9 PM)"],
                            "consistency_rationale": "Daily repetition builds momentum.",
                        }
                    ],
                }
            ],
            "success_metrics": ["7 runs per week"],
            "partner_accountability": {
                "role": "Partner cheerleader",
                "check_in_schedule": "daily",
                "shared_celebrations": "Weekly high-five",
            },
        },
        "wizard_data": {
            "availability": ["Mornings (6-9 AM)"],
            "time_commitment": "60 minutes/week",
        },
        "partner_integration": "Daily support",
        "personalization_score": 8.0,
        "execution_time_ms": 300,
    }


def test_adapter_flags_overload_and_conflicts():
    result = adapt_goal_plan_response("s1", _base_raw_result())
    impact = result["goal_plan"]["schedule_impact"]

    assert impact["fit_band"] == "overloaded"
    assert len(impact["conflict_flags"]) > 0


def test_adapter_scales_cadence_when_over_soft_cap():
    result = adapt_goal_plan_response("s2", _base_raw_result())
    task = result["goal_plan"]["milestones"][0]["tasks"][0]

    assert task["recommended_cadence"] != "daily"
    assert "Detected schedule overload" in result["goal_plan"]["decision_trace"][0]


def test_adapter_includes_verification_defaults():
    result = adapt_goal_plan_response("s3", _base_raw_result())
    task = result["goal_plan"]["milestones"][0]["tasks"][0]

    assert task["verification_mode"] in {"photo", "voice", "time-window"}
    assert 0 <= task["verification_confidence"] <= 1
    assert task["auto_approval_policy"] in {"time_window_only", "none"}
