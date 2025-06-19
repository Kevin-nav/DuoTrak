import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.user_repository import user_repo

pytestmark = pytest.mark.asyncio

async def test_verify_and_sync_profile_new_user(client: AsyncClient, test_app):
    # This test assumes the user does not exist yet
    response = await client.post("/api/v1/users/verify-and-sync-profile", headers={"Authorization": "Bearer testtoken"})
    
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "testuser@example.com"
    assert data["firebase_uid"] == "test_firebase_uid_123"
    assert "id" in data

async def test_verify_and_sync_profile_existing_user(client: AsyncClient, test_app):
    # First call to create the user
    await client.post("/api/v1/users/verify-and-sync-profile", headers={"Authorization": "Bearer testtoken"})
    
    # Second call should retrieve the same user
    response = await client.post("/api/v1/users/verify-and-sync-profile", headers={"Authorization": "Bearer testtoken"})
    
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "testuser@example.com"

    # You could add a check here to ensure the user count in the DB is still 1
