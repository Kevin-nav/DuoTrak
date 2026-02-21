import pytest


@pytest.mark.asyncio
async def test_removed_legacy_routes_not_registered(client):
    response = await client.post(
        "/api/v1/agent-crew/wizard/questions",
        json={"user_id": "user-1", "wizard_data": {}},
    )
    assert response.status_code == 410
