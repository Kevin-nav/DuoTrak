import pytest


@pytest.mark.asyncio
async def test_removed_legacy_routes_not_registered(client):
    legacy_questions_response = await client.post(
        "/api/v1/agent-crew/wizard/questions",
        json={"user_id": "user-1", "wizard_data": {}},
    )
    assert legacy_questions_response.status_code == 410

    legacy_answers_response = await client.post(
        "/api/v1/agent-crew/session-1/answers",
        json={"user_id": "user-1", "answers": {"q1": "a1"}},
    )
    assert legacy_answers_response.status_code == 410
