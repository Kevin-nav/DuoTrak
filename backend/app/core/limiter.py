from slowapi import Limiter
from slowapi.util import get_remote_address
from app.core.config import settings
from fastapi import Request
import jwt
from app.core.config import settings

def key_func(request: Request) -> str:
    """
    Rate limit key function that uses the user ID for authenticated users
    and falls back to the IP address for unauthenticated users.
    """
    session_token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if session_token:
        try:
            payload = jwt.decode(
                session_token, settings.SECRET_KEY, algorithms=["HS256"]
            )
            user_id = payload.get("uid")
            if user_id:
                return f"user:{user_id}"
        except jwt.PyJWTError:
            # If the token is invalid, fall back to IP address
            pass
    
    # Fallback to remote address for unauthenticated users or invalid tokens
    return get_remote_address(request)

# Centralized rate limiter instance
limiter = Limiter(
    key_func=key_func, 
    storage_uri=str(settings.REDIS_URL),
    default_limits=["100/minute"]
)
