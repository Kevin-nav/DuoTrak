import pytest

from app.api.v1.endpoints import goal_chat
from app.services.goal_chat_session_service import GoalChatSessionService


pytestmark = pytest.mark.asyncio


@pytest.fixture(autouse=True)
def fresh_goal_chat_service(monkeypatch):
    monkeypatch.setattr(goal_chat, "goal_chat_session_service", GoalChatSessionService(ttl_seconds=600))


async def test_session_creation_returns_profile_prompts(client):
    response = await client.post("/api/v1/goal-chat/sessions", json={})
    assert response.status_code == 200
    body = response.json()

    assert len(body["profile"]["self_profile_prompts"]) == 3
    assert body["profile"]["behavioral_summary"] != ""
    assert "intent" in body["missing_slots"]


async def test_turn_logic_enforces_conditional_slots(client):
    create_response = await client.post("/api/v1/goal-chat/sessions", json={})
    session_id = create_response.json()["session_id"]

    first_turn = await client.post(
        f"/api/v1/goal-chat/{session_id}/turns",
        json={
            "message": "Starting with basics",
            "slot_updates": {
                "intent": "target-date",
                "success_definition": "Finish launch checklist",
                "accountability_type": "task_completion",
            },
        },
    )
    assert first_turn.status_code == 200
    first_body = first_turn.json()
    assert "deadline" in first_body["missing_slots"]
    assert "tasks" in first_body["missing_slots"]
    assert first_body["is_ready_to_finalize"] is False

    second_turn = await client.post(
        f"/api/v1/goal-chat/{session_id}/turns",
        json={
            "message": "Adding tasks and deadline",
            "slot_updates": {
                "deadline": "2026-04-15",
                "tasks": [{"name": "Draft launch doc"}],
            },
            "profile_answers": {"energy_pattern": "Mornings"},
        },
    )
    assert second_turn.status_code == 200
    second_body = second_turn.json()
    assert second_body["missing_slots"] == []
    assert second_body["is_ready_to_finalize"] is True
    assert "energy_pattern: Mornings" in second_body["profile"]["merged_summary"]


async def test_finalize_requires_partner(client):
    create_response = await client.post("/api/v1/goal-chat/sessions", json={})
    session_id = create_response.json()["session_id"]

    await client.post(
        f"/api/v1/goal-chat/{session_id}/turns",
        json={
            "message": "Fill all required slots",
            "slot_updates": {
                "intent": "habit",
                "success_definition": "Workout 4x weekly",
                "accountability_type": "photo",
                "tasks": [{"name": "Morning workout"}],
            },
        },
    )

    no_partner = await client.post(
        f"/api/v1/goal-chat/{session_id}/finalize",
        json={"has_partner": False},
    )
    assert no_partner.status_code == 400
    assert "Partner is required" in str(no_partner.json()["detail"]["errors"])


async def test_finalize_success(client):
    create_response = await client.post("/api/v1/goal-chat/sessions", json={})
    session_id = create_response.json()["session_id"]

    await client.post(
        f"/api/v1/goal-chat/{session_id}/turns",
        json={
            "message": "Complete goal",
            "slot_updates": {
                "intent": "milestone",
                "success_definition": "Ship v1 API",
                "accountability_type": "task_completion",
                "tasks": [{"name": "Implement endpoint"}],
            },
            "profile_answers": {"support_style": "Blunt feedback"},
        },
    )

    finalize = await client.post(
        f"/api/v1/goal-chat/{session_id}/finalize",
        json={"has_partner": True},
    )
    assert finalize.status_code == 200
    body = finalize.json()
    assert body["finalized"] is True
    assert body["goal_plan"]["intent"] == "milestone"
    assert body["goal_plan"]["accountability_type"] == "task_completion"


async def test_summary_endpoints_roundtrip(client):
    create_response = await client.post("/api/v1/goal-chat/sessions", json={})
    session_id = create_response.json()["session_id"]

    await client.post(
        f"/api/v1/goal-chat/{session_id}/turns",
        json={
            "message": "I want a habit goal",
        },
    )

    summary_response = await client.post(f"/api/v1/goal-chat/{session_id}/summary")
    assert summary_response.status_code == 200
    summary = summary_response.json()["summary"]

    summary["success_definition"] = "Stay consistent for 30 days"
    patch_response = await client.patch(
        f"/api/v1/goal-chat/{session_id}/summary",
        json={"summary": summary},
    )
    assert patch_response.status_code == 200
    assert patch_response.json()["summary"]["success_definition"] == "Stay consistent for 30 days"
