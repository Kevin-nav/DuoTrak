from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.security import get_current_user
from app.services.user_service import user_service
from app.db.models.user import User as UserModel
from app.api.v1.schemas.user import User


# TODO: DEVELOPMENT ONLY - Remove this and revert the dependency below for production
async def get_current_user_dev_override(request: Request, db: AsyncSession = Depends(get_db)) -> UserModel:
    """
    Mock user for development testing without a real Firebase token.
    Creates or retrieves a user based on the `X-Dev-User-ID` header.
    """
    dev_user_id = request.headers.get("x-dev-user-id")
    if not dev_user_id:
        raise HTTPException(status_code=400, detail="X-Dev-User-ID header is required for development.")

    # Use the dev_user_id to create a unique user profile
    firebase_user = {
        "uid": f"dev_firebase_uid_{dev_user_id}",
        "email": f"{dev_user_id}@example.com",
        "username": f"Dev User {dev_user_id}"
    }
    
    user = await user_service.sync_user_profile(db, firebase_user=firebase_user)
    if not user:
        raise HTTPException(status_code=500, detail="Could not retrieve or create dev user.")
    return user


router = APIRouter()

@router.post("/verify-and-sync-profile", response_model=User, status_code=200)
async def verify_and_sync_profile(
    # This header is now explicitly part of the endpoint, making it visible in docs.
    x_dev_user_id: str = Header(..., alias="X-Dev-User-ID"), 
    current_user: UserModel = Depends(get_current_user_dev_override)
):
    """
    Onboards a user by syncing their Firebase profile with the local DB.
    In development, this is controlled by the X-Dev-User-ID header.
    Returns the full user profile from the database.
    """
    return current_user
