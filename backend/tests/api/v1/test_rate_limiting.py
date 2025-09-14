# backend/tests/api/v1/test_rate_limiting.py
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from fastapi import FastAPI, Depends, HTTPException
from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import _rate_limit_exceeded_handler


# --- Test Setup ---

# 1. Create a new, isolated Limiter instance for our tests
limiter = Limiter(key_func=get_remote_address, storage_uri="memory://")

# 2. Create a new, isolated FastAPI app instance for our tests
rate_limit_app = FastAPI()
rate_limit_app.state.limiter = limiter
rate_limit_app.add_exception_handler(RateLimitExceeded, lambda request, exc: RateLimitExceeded(exc.detail))


# 3. Define some test endpoints on our isolated app
@rate_limit_app.get("/test-limit")
@limiter.limit("2/minute")
async def limited_endpoint(request: Request):
    return {"message": "This is a limited endpoint."}

@rate_limit_app.post("/test-login-limit")
@limiter.limit("5/minute")
async def limited_login_endpoint(request: Request):
    # This endpoint simulates the behavior of the real login endpoint
    # where an error might occur, but it still counts towards the rate limit.
    raise HTTPException(status_code=401, detail="Invalid mock token")


import pytest
import pytest_asyncio
from httpx import AsyncClient
from fastapi import FastAPI, Depends, HTTPException
from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request
from slowapi.errors import RateLimitExceeded

# --- Test Setup ---

# 1. Create a new, isolated Limiter instance for our tests
limiter = Limiter(key_func=get_remote_address, storage_uri="memory://")

# 2. Create a new, isolated FastAPI app instance for our tests
rate_limit_app = FastAPI()
rate_limit_app.state.limiter = limiter
rate_limit_app.add_exception_handler(RateLimitExceeded, lambda request, exc: RateLimitExceeded(exc.detail))


# 3. Define some test endpoints on our isolated app
@rate_limit_app.get("/test-limit")
@limiter.limit("2/minute")
async def limited_endpoint(request: Request):
    return {"message": "This is a limited endpoint."}

@rate_limit_app.post("/test-login-limit")
@limiter.limit("5/minute")
async def limited_login_endpoint(request: Request):
    # This endpoint simulates the behavior of the real login endpoint
    # where an error might occur, but it still counts towards the rate limit.
    raise HTTPException(status_code=401, detail="Invalid mock token")


# 4. Create a fixture to provide a client for our isolated app
@pytest_asyncio.fixture(scope="function")
async def client() -> AsyncClient:
    async with AsyncClient(transport=ASGITransport(app=rate_limit_app), base_url="http://test") as c:
        yield c
    # Reset the limiter after each test function in this file
    limiter.reset()


# --- Tests ---

@pytest.mark.asyncio
async def test_basic_rate_limit_is_enforced(client: AsyncClient):
    """
    Tests that the basic rate limit (2 per minute) is enforced correctly.
    """
    # First two requests should succeed
    response1 = await client.get("/test-limit")
    assert response1.status_code == 200

    response2 = await client.get("/test-limit")
    assert response2.status_code == 200

    # Third request should be rate-limited
    response3 = await client.get("/test-limit")
    assert response3.status_code == 429


@pytest.mark.asyncio
async def test_login_rate_limit_is_enforced(client: AsyncClient):
    """
    Tests that the login endpoint's specific rate limit (5 per minute) is enforced.
    This test is now fully isolated and will not be affected by other tests.
    """
    login_payload = {"firebase_token": "dummy_token"}

    # The first 5 requests should fail with 401, but not be rate-limited
    for i in range(5):
        response = await client.post("/test-login-limit", json=login_payload)
        assert response.status_code == 401, f"Request {i+1} should have failed auth, not be rate-limited."

    # The 6th request should be rate-limited
    response_6 = await client.post("/test-login-limit", json=login_payload)
    assert response_6.status_code == 429, "The 6th request should be rate-limited."