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
                        }
                    ],
                }
            ],
            "success_metrics": ["3 runs completed"],
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
