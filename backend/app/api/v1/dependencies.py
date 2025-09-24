# backend/app/api/v1/dependencies.py

from fastapi import Depends, HTTPException, status
from app.security.security_manager import SecurityManager, SecureGoalRequest, SecurityError
from app.db.models import User
from .endpoints.users import get_current_user_from_cookie

def get_security_manager() -> SecurityManager:
    return SecurityManager()

async def validate_goal_request(
    request: SecureGoalRequest,
    current_user: User = Depends(get_current_user_from_cookie),
    security_manager: SecurityManager = Depends(get_security_manager)
):
    try:
        user_context = {"user_id": str(current_user.id)} # Add other relevant context if needed
        security_manager.validate_request(request, user_context)
    except SecurityError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    return request
