import pytest


@pytest.mark.asyncio
async def test_removed_routes_not_registered(client):
    removed_routes = [
        "/api/v1/agent-crew/wizard/questions",
        "/api/v1/users/me",
        "/api/v1/goals",
        "/api/v1/partner-invitations/invitations",
        "/api/v1/storage/upload-profile-picture",
    ]

    for route in removed_routes:
        response = await client.get(route)
        assert response.status_code == 404
