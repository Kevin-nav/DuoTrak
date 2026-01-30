import pytest
from fastapi import WebSocket, WebSocketException
from unittest.mock import MagicMock
import jwt
from datetime import datetime, timedelta

from app.dependencies import get_current_user_ws
from app.core.config import settings

# Use the actual secret key for testing, but ensure it's not a production key
TEST_SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"

@pytest.mark.asyncio
async def test_get_current_user_ws_valid_token():
    """Tests that a valid token returns the user_id."""
    user_id = "test_user_123"
    token = jwt.encode({"sub": user_id, "exp": datetime.utcnow() + timedelta(minutes=5)}, TEST_SECRET_KEY, algorithm=ALGORITHM)

    mock_websocket = MagicMock(spec=WebSocket)
    mock_websocket.query_params.get.return_value = token

    result_user_id = await get_current_user_ws(websocket=mock_websocket)
    assert result_user_id == user_id

@pytest.mark.asyncio
async def test_get_current_user_ws_missing_token():
    """Tests that WebSocketException is raised when no token is provided."""
    mock_websocket = MagicMock(spec=WebSocket)
    mock_websocket.query_params.get.return_value = None

    with pytest.raises(WebSocketException):
        await get_current_user_ws(websocket=mock_websocket)

@pytest.mark.asyncio
async def test_get_current_user_ws_expired_token():
    """Tests that WebSocketException is raised for an expired token."""
    user_id = "test_user_123"
    token = jwt.encode({"sub": user_id, "exp": datetime.utcnow() - timedelta(minutes=5)}, TEST_SECRET_KEY, algorithm=ALGORITHM)

    mock_websocket = MagicMock(spec=WebSocket)
    mock_websocket.query_params.get.return_value = token

    with pytest.raises(WebSocketException):
        await get_current_user_ws(websocket=mock_websocket)

@pytest.mark.asyncio
async def test_get_current_user_ws_invalid_signature():
    """Tests that WebSocketException is raised for a token with an invalid signature."""
    user_id = "test_user_123"
    token = jwt.encode({"sub": user_id, "exp": datetime.utcnow() + timedelta(minutes=5)}, "wrong-secret", algorithm=ALGORITHM)

    mock_websocket = MagicMock(spec=WebSocket)
    mock_websocket.query_params.get.return_value = token

    with pytest.raises(WebSocketException):
        await get_current_user_ws(websocket=mock_websocket)

@pytest.mark.asyncio
async def test_get_current_user_ws_missing_sub_claim():
    """Tests that WebSocketException is raised for a token missing the 'sub' claim."""
    token = jwt.encode({"exp": datetime.utcnow() + timedelta(minutes=5)}, TEST_SECRET_KEY, algorithm=ALGORITHM)

    mock_websocket = MagicMock(spec=WebSocket)
    mock_websocket.query_params.get.return_value = token

    with pytest.raises(WebSocketException):
        await get_current_user_ws(websocket=mock_websocket)
