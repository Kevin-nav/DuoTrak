import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.api.v1.endpoints import goal_creation


pytestmark = pytest.mark.asyncio


class _User:
    id = "user-1"


@pytest.fixture
def test_app(monkeypatch):
    telemetry_events = []

    async def _fake_create_goal_plan_from_answers(session_id: str, user_id: str, answers: dict):
        return {
            "final_plan": {
                "title": "Run a 5k",
                "description": "Legacy output shape",
                "milestones": [
                    {
                        "title": "Week 1",
                        "description": "Build consistency",
                        "tasks": [
                            {
                                "description": "Run for 60 minutes",
                                "success_metric": "60 minutes completed",
                                "recommended_cadence": "daily",
                                "recommended_time_windows": ["Evenings (6-9 PM)"],
                                "consistency_rationale": "Daily effort accelerates momentum.",
                            }
                        ],
                    }
                ],
                "success_metrics": [],
                "partner_accountability": {
                    "role": "Coach",
                    "check_in_schedule": "daily",
                    "shared_celebrations": "Weekly recap",
                },
            },
            "partner_integration": {
                "check_in_schedule": ["daily"],
                "accountability_actions": ["text check-in"],
                "support_strategies": ["encouragement"],
                "celebration_milestones": ["week 1"],
            },
            "internal_score": 7.8,
            "execution_time_ms": 250,
        }

    def _fake_emit_goal_operation_event(event_name: str, **fields):
        telemetry_events.append({"event_name": event_name, **fields})

    async def _fake_initialize():
        return None

    monkeypatch.setattr(
        goal_creation.duotrak_orchestrator,
        "create_goal_plan_from_answers",
        _fake_create_goal_plan_from_answers,
    )
    monkeypatch.setattr(goal_creation.settings, "INTERNAL_API_SECRET", "test-secret", raising=False)
    monkeypatch.setattr(goal_creation, "emit_goal_operation_event", _fake_emit_goal_operation_event)
    monkeypatch.setattr(goal_creation.pinecone_service, "initialize", _fake_initialize)

    app = FastAPI()
    app.include_router(goal_creation.router, prefix="/api/v1/goal-creation")
    app.state.telemetry_events = telemetry_events
    return app


@pytest.fixture
async def authed_client(test_app: FastAPI):
    async with AsyncClient(transport=ASGITransport(app=test_app), base_url="http://test") as client:
        yield client


@pytest.fixture
def seeded_session():
    return "session-1"


async def test_create_goal_plan_returns_contract_shape(authed_client: AsyncClient, seeded_session: str, test_app: FastAPI):
    response = await authed_client.post(
        f"/api/v1/goal-creation/{seeded_session}/plan",
        json={"user_id": "user-1", "answers": {"q1": "a1"}},
        headers={"X-Internal-API-Key": "test-secret"},
    )

    assert response.status_code == 200
    body = response.json()
    assert "goal_plan" in body
    assert "partner_integration" in body
    events = test_app.state.telemetry_events
    event_names = [e["event_name"] for e in events]
    assert "goal_plan_generated" in event_names
    assert "goal_plan_overload_warning" in event_names
    assert "llm_call_completed" in event_names
    generated = next(e for e in events if e["event_name"] == "goal_plan_generated")
    assert "overload_percent" in generated
    assert "conflict_count" in generated
