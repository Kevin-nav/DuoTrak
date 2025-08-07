import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock

from fastapi import HTTPException

# Mark all tests in this file as asyncio
pytestmark = pytest.mark.asyncio


async def test_session_login_success(client: AsyncClient, monkeypatch):
    """
    Tests the successful session login flow.
    - Mocks Firebase token verification.
    - Asserts a 200 OK response.
    - Verifies the response body contains user data and CSRF token.
    - Verifies that __session, __refresh, and csrf_token cookies are set.
    """
    # 1. Mock the dependencies in the auth endpoint
    mock_user_data = {
        'uid': 'test_firebase_uid_123',
        'email': 'test@example.com',
        'email_verified': True,
        'name': 'Test User',
        'picture': 'http://example.com/pic.jpg'
    }
    
    # Mock the function that verifies the token with Firebase
    monkeypatch.setattr(
        'app.api.v1.endpoints.auth.verify_firebase_token', 
        AsyncMock(return_value=mock_user_data)
    )
    
    # Mock the function that syncs the user profile to the DB
    # It should return a mock user object that includes DB-specific fields
    mock_db_user = type('User', (), {
        'firebase_uid': mock_user_data['uid'],
        'email': mock_user_data['email'],
        'onboarding_complete': False,
        'model_dump': lambda *args, **kwargs: {
            'firebase_uid': mock_user_data['uid'],
            'email': mock_user_data['email'],
            'onboarding_complete': False
        }
    })()
    
    monkeypatch.setattr(
        'app.api.v1.endpoints.auth.sync_user_profile', 
        AsyncMock(return_value=mock_db_user)
    )

    # 2. Make the request to the login endpoint
    response = await client.post(
        "/api/v1/auth/session-login", 
        json={"firebase_token": "a-valid-mock-token"}
    )

    # 3. Assert the response is successful
    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}: {response.text}"
    
    data = response.json()
    # Assert that the FULL user object is returned, including DB-specific fields
    assert 'user' in data
    assert data['user']['firebase_uid'] == mock_user_data['uid']
    assert 'onboarding_complete' in data['user'] # Check for our DB-specific field
    assert 'expires_at' in data
    assert 'csrf_token' in data
    
    # 4. Assert that all required cookies are set
    cookies = response.cookies
    assert '__session' in cookies
    assert '__refresh' in cookies
    assert 'csrf_token' in cookies


async def test_session_login_invalid_firebase_token(client: AsyncClient, monkeypatch):
    """
    Tests the session login flow with an invalid Firebase token.
    - Mocks Firebase token verification to raise an exception.
    - Asserts a 401 Unauthorized response.
    """
    # 1. Mock the Firebase verification to raise an exception
    monkeypatch.setattr(
        'app.api.v1.endpoints.auth.verify_firebase_token', 
        AsyncMock(side_effect=HTTPException(status_code=401, detail="Invalid Firebase token"))
    )

    # 2. Make the request
    response = await client.post(
        "/api/v1/auth/session-login", 
        json={"firebase_token": "an-invalid-mock-token"}
    )

    # 3. Assert the response is 401 Unauthorized
    assert response.status_code == 401, f"Expected 401, got {response.status_code}"
    data = response.json()
    assert "Invalid Firebase token" in data.get("detail", "")

