import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.api.v1.endpoints import goal_creation


class MissingSessionOrchestrator:
    async def create_goal_plan_from_answers(self, session_id: str, user_id: str, answers):
        raise ValueError("Session not found or expired. Please restart from strategic questions.")


@pytest.mark.asyncio
async def test_missing_session_returns_404(monkeypatch):
    app = FastAPI()
    app.include_router(goal_creation.router, prefix="/api/v1/goal-creation")

    monkeypatch.setattr(goal_creation.settings, "INTERNAL_API_SECRET", "test-secret", raising=False)
    monkeypatch.setattr(goal_creation, "duotrak_orchestrator", MissingSessionOrchestrator())

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/api/v1/goal-creation/missing/plan",
            json={"user_id": "u1", "answers": {"q": "a"}},
            headers={"X-Internal-API-Key": "test-secret"},
        )

    assert response.status_code == 404
    body = response.json()
    assert body["detail"]["code"] == "goal_creation_session_not_found"
