import pytest

from app.api.v1.endpoints import goal_chat
from app.services.goal_chat_session_service import GoalChatSessionService


pytestmark = pytest.mark.asyncio


@pytest.fixture(autouse=True)
def fresh_goal_chat_service(monkeypatch):
    monkeypatch.setattr(goal_chat, "goal_chat_session_service", GoalChatSessionService(ttl_seconds=600))


async def test_goal_chat_routes_are_registered(client):
    create_response = await client.post("/api/v1/goal-chat/sessions", json={})
    assert create_response.status_code == 200

    session_id = create_response.json()["session_id"]
    turn_response = await client.post(
        f"/api/v1/goal-chat/{session_id}/turns",
        json={"message": "Starting goal chat"},
    )
    assert turn_response.status_code == 200

    finalize_response = await client.post(
        f"/api/v1/goal-chat/{session_id}/finalize",
        json={"has_partner": False},
    )
    assert finalize_response.status_code == 400
