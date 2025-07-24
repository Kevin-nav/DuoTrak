from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from app.core.limiter import limiter
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from firebase_admin import auth

from app.core.security import get_current_user, create_session_cookie_from_token
from app.core.config import settings
from app.db.session import get_db
from app.db import models
from app.schemas.user import UserRead, UserCreate, UserProfileSync, SessionLoginRequest, UserSyncResponse
from app.services.user_service import user_service
from app.services.partner_invitation_service import accept_invitation
from app import schemas

router = APIRouter()


@router.post("/session-login")
@limiter.limit("10/minute")
async def session_login(request: Request, data: SessionLoginRequest, response: Response):
    """
    Takes a Firebase ID token, creates a session cookie, and sets it in the user's browser.
    """
    try:
        session_cookie, expires_in = create_session_cookie_from_token(data.token)
        response.set_cookie(
            key="auth_token",
            value=session_cookie,
            max_age=expires_in,
            httponly=True,
            secure=settings.ENVIRONMENT == "production",
            samesite="lax",
            path="/"
        )
        return {"status": "success"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during session login: {str(e)}"
        )


@router.post("/logout")
async def logout(response: Response):
    """
    Clears the session cookie.
    """
    response.delete_cookie(key="auth_token", path="/")
    return {"status": "success"}


from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

bearer_scheme = HTTPBearer()

@router.post("/verify-and-sync-profile", response_model=UserSyncResponse, status_code=status.HTTP_200_OK)
@limiter.limit("10/minute")
async def verify_and_sync_profile(
    *,
    response: Response,
    request: Request, # Add request for the limiter
    db: AsyncSession = Depends(get_db),
    profile_in: UserProfileSync,
    firebase_user: dict = Depends(get_current_user),
    token: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):
    """
    Verify Firebase token, create/update user profile, and return full user status.
    """
    user_in = UserCreate(
        firebase_uid=firebase_user["uid"],
        email=firebase_user["email"],
        full_name=profile_in.full_name or firebase_user.get("name")
    )

    try:
        db_user = await user_service.sync_user_profile(db=db, user_in=user_in)

        # If an invitation token is provided, accept it now atomically.
        if profile_in.invitation_token:
            try:
                # The service returns the updated user object
                db_user = await accept_invitation(
                    db=db,
                    invitation_id_str=profile_in.invitation_token,
                    user=db_user
                )
            except HTTPException as e:
                # If invitation is invalid, we can choose to ignore it and proceed
                # or raise an error. For now, we'll let it raise.
                raise e

        has_partner = db_user.current_partner_id is not None

        auth.set_custom_user_claims(firebase_user['uid'], {'has_partner': has_partner})

        # --- Fetch invitation status ---
        sent_stmt = (
            select(models.PartnerInvitation)
            .options(selectinload(models.PartnerInvitation.receiver))
            .where(
                models.PartnerInvitation.sender_id == db_user.id,
                models.PartnerInvitation.status == 'pending',
            )
        )
        sent_result = await db.execute(sent_stmt)
        sent_invitation = sent_result.scalars().first()

        received_stmt = (
            select(models.PartnerInvitation)
            .options(selectinload(models.PartnerInvitation.sender))
            .where(
                models.PartnerInvitation.receiver_email.ilike(db_user.email),
                models.PartnerInvitation.status == 'pending',
            )
        )
        received_result = await db.execute(received_stmt)
        received_invitation = received_result.scalars().first()

        user_read = schemas.UserRead(
            id=db_user.id,
            email=db_user.email,
            full_name=db_user.full_name,
            onboarding_complete=db_user.onboarding_complete,
            partnership_status=db_user.partnership_status,
            partner_id=getattr(db_user, 'current_partner_id', None),
            partner_full_name=getattr(db_user, 'partner_full_name', None),
            partnership_id=getattr(db_user, 'partnership_id', None),
            sent_invitation=sent_invitation,
            received_invitation=received_invitation,
            bio=getattr(db_user, 'bio', None),
            profile_picture_url=getattr(db_user, 'profile_picture_url', None),
            timezone=getattr(db_user, 'timezone', 'UTC'),
            notifications_enabled=getattr(db_user, 'notifications_enabled', True),
            current_streak=getattr(db_user, 'current_streak', 0),
            longest_streak=getattr(db_user, 'longest_streak', 0),
            total_tasks_completed=getattr(db_user, 'total_tasks_completed', 0),
            goals_conquered=getattr(db_user, 'goals_conquered', 0),
            badges=getattr(db_user, 'badges', [])
        )

        # Create and set the session cookie in the same atomic transaction
        id_token = token.credentials
        session_cookie, expires_in = create_session_cookie_from_token(id_token)
        response.set_cookie(
            key="auth_token",
            value=session_cookie,
            max_age=expires_in,
            httponly=True,
            secure=settings.ENVIRONMENT == "production",
            samesite="lax",
            path="/",
            domain="127.0.0.1"  # Explicitly set the domain for the cookie
        )

        return {"user": user_read, "has_partner": has_partner}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )
