import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.api.v1.endpoints import goal_creation


pytestmark = pytest.mark.asyncio


class _User:
    id = "user-1"


@pytest.fixture
def test_app(monkeypatch):
    async def _fake_create_goal_plan_from_answers(session_id: str, user_id: str, answers: dict):
        return {
            "final_plan": {
                "title": "Run a 5k",
                "description": "Legacy output shape",
                "milestones": [],
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

    async def _fake_current_user():
        return _User()

    async def _fake_initialize():
        return None

    monkeypatch.setattr(
        goal_creation.duotrak_orchestrator,
        "create_goal_plan_from_answers",
        _fake_create_goal_plan_from_answers,
    )
    monkeypatch.setattr(goal_creation.pinecone_service, "initialize", _fake_initialize)

    app = FastAPI()
    app.include_router(goal_creation.router, prefix="/api/v1/goal-creation")
    app.dependency_overrides[goal_creation.get_optional_current_user_from_cookie] = _fake_current_user
    return app


@pytest.fixture
async def authed_client(test_app: FastAPI):
    async with AsyncClient(transport=ASGITransport(app=test_app), base_url="http://test") as client:
        yield client


@pytest.fixture
def seeded_session():
    return "session-1"


async def test_create_goal_plan_returns_contract_shape(authed_client: AsyncClient, seeded_session: str):
    response = await authed_client.post(
        f"/api/v1/goal-creation/{seeded_session}/plan",
        json={"user_id": "user-1", "answers": {"q1": "a1"}},
    )

    assert response.status_code == 200
    body = response.json()
    assert "goal_plan" in body
    assert "partner_integration" in body
