from fastapi import WebSocket, WebSocketException, status
import jwt
from app.core.config import settings

async def get_current_user_ws(websocket: WebSocket) -> str:
    token = websocket.query_params.get("token")
    if not token:
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION,
            reason="Missing authentication token",
        )

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise WebSocketException(
                code=status.WS_1008_POLICY_VIOLATION,
                reason="Invalid authentication credentials",
            )
        return user_id
    except jwt.ExpiredSignatureError:
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION, reason="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise WebSocketException(
            code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token"
        )
