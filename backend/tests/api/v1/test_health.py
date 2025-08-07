import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_root_health_check(client: AsyncClient):
    """
    Tests the root health check endpoint ('/').
    """
    response = await client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to the DuoTrak API"}
