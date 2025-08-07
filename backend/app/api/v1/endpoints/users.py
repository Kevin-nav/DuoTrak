# backend/app/api/v1/endpoints/users.py
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
import jwt
from jwt import PyJWTError
from fastapi import Request
import logging

from app.db.session import get_db
from app.schemas.user import UserRead, UserUpdate
from app.services.user_service import UserService # Import the class
from app.services import storage_service # Keep this import
from app.core.config import settings
from app.api.v1.endpoints.auth import SESSION_COOKIE_NAME
from app.core.limiter import limiter


router = APIRouter()
logger = logging.getLogger(__name__)
user_service = UserService() # Create a local instance

async def get_current_user_from_cookie(
    request: Request, db: AsyncSession = Depends(get_db)
) -> UserRead:
    """
    Dependency to get the current user from the session cookie.
    """
    session_token = request.cookies.get(SESSION_COOKIE_NAME)
    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    try:
        payload = jwt.decode(
            session_token, settings.SECRET_KEY, algorithms=["HS256"]
        )
        user_id = payload.get("uid")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload"
            )
        user = await user_service.get_user_by_id(db, user_id=user_id)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )
        return user
    except PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )

@router.get("/me", response_model=UserRead)
async def read_users_me(
    current_user: UserRead = Depends(get_current_user_from_cookie)
):
    """
    Get the complete profile for the currently logged-in user.
    """
    return current_user

@router.patch("/me", response_model=UserRead)
@limiter.limit("10/minute")
async def update_user_profile(
    request: Request,
    user_update: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: UserRead = Depends(get_current_user_from_cookie),
):
    """
    Update the current user's profile.
    """
    logger.info(f"--- Updating profile for user_id: {current_user.id} ---")
    # This call requires the user object, not just the ID
    updated_user = await user_service.update_user(
        db=db, user=current_user, user_update=user_update
    )
    logger.info(f"Successfully updated profile for user {current_user.id}")
    return updated_user

@router.post("/me/profile-picture", response_model=UserRead)
@limiter.limit("5/minute")
async def upload_profile_picture(
    request: Request,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: UserRead = Depends(get_current_user_from_cookie),
):
    """
    Upload a new profile picture for the current user.
    """
    logger.info(f"--- Uploading profile picture for user_id: {current_user.id} ---")
    contents = await file.read()
    try:
        public_url = await storage_service.upload_avatar(
            file_contents=contents,
            file_name=file.filename,
            user_id=str(current_user.id)
        )
        
        user_update = UserUpdate(profile_picture_url=public_url)
        updated_user = await user_service.update_user(db=db, user=current_user, user_update=user_update)
        
        logger.info(f"Successfully updated profile picture URL for user {current_user.id} to {public_url}")
        return updated_user
    except Exception as e:
        logger.error(f"Failed to upload profile picture for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while uploading the profile picture.",
        )

@router.delete("/me/profile-picture", response_model=UserRead)
@limiter.limit("5/minute")
async def remove_profile_picture(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: UserRead = Depends(get_current_user_from_cookie),
):
    """
    Remove the current user's profile picture.
    """
    logger.info(f"--- Removing profile picture for user_id: {current_user.id} ---")
    try:
        await storage_service.remove_avatar(user_id=str(current_user.id))
        
        user_update = UserUpdate(profile_picture_url=None)
        updated_user = await user_service.update_user(db=db, user=current_user, user_update=user_update)

        logger.info(f"Successfully removed profile picture for user {current_user.id}")
        return updated_user
    except Exception as e:
        logger.error(f"Failed to remove profile picture for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while removing the profile picture.",
        )