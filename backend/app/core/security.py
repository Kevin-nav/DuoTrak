# backend/app/core/security.py

import firebase_admin
from firebase_admin import auth, credentials
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select

from app.db import models
from app.db.session import get_db

from app.core.config import settings
from app.schemas.user import UserCreate
from datetime import timedelta

# Initialize Firebase Admin SDK
# We explicitly use the service account file specified in the .env file.
# This avoids ambiguity with Application Default Credentials (ADC) in local development.
# The check `if not firebase_admin._apps:` makes this initialization idempotent,
# preventing crashes when the development server reloads the module.
if not firebase_admin._apps:
    try:
        cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_JSON_PATH)
        firebase_admin.initialize_app(cred, {
            'projectId': settings.FIREBASE_PROJECT_ID,
        })
    except Exception as e:
        # This will catch errors like the service account file not being found
        # or the project ID being missing, and prevent the app from starting.
        print(f"CRITICAL: Failed to initialize Firebase Admin SDK: {e}")
        # In a production environment, you might want to exit or raise a more specific exception.
        raise

# This scheme will look for a token in the "Authorization: Bearer <token>" header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user_token(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Dependency to verify Firebase ID token and return the decoded claims.
    """
    try:
        # Verify the token against the Firebase Auth API, checking for revocation.
        decoded_token = auth.verify_id_token(token, check_revoked=True)
        return decoded_token
    except Exception as e:
        # If the token is invalid for any reason, raise an unauthorized error.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(decoded_token: dict = Depends(get_current_user_token)) -> dict:
    """
    Dependency that processes the decoded token into a raw dictionary.
    This is what the endpoint will actually receive.
    """
    try:
        return decoded_token
    except Exception:
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Error processing user information from token."
        )

def create_session_cookie_from_token(id_token: str) -> tuple[str, int]:
    """
    Creates a session cookie from a Firebase ID token.
    Returns the session cookie and its max_age in seconds.
    """
    # Set session expiration to 5 days. This is a good balance of security and convenience.
    expires_in = timedelta(days=5)
    try:
        # Create the session cookie. This will also verify the ID token.
        session_cookie = auth.create_session_cookie(id_token, expires_in=expires_in)
        # Get expiration in seconds for the cookie's max_age attribute.
        expires_seconds = int(expires_in.total_seconds())
        return session_cookie, expires_seconds
    except Exception as e:
        print(f"\n!!! Firebase Error in create_session_cookie_from_token: {type(e).__name__} - {e}\n")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Failed to create session cookie: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )

def verify_session_cookie(session_cookie: str) -> dict:
    """
    Verifies a session cookie and returns the decoded claims.
    Used by the middleware and protected API routes.
    """
    try:
        # Verify the session cookie. For the initial login, we don't check for
        # revocation to avoid race conditions with newly created tokens.
        # For subsequent requests, this check can be re-enabled if needed for enhanced security.
        decoded_claims = auth.verify_session_cookie(session_cookie)
        return decoded_claims
    except auth.InvalidSessionCookieError:
        # Session cookie is invalid, expired, or revoked.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session cookie. Please log in again.",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during session verification: {e}",
        )

def get_current_user_from_cookie(request: Request) -> dict:
    """
    FastAPI dependency to get the current user from the session cookie.
    This will protect API endpoints that require authentication.
    """
    session_cookie = request.cookies.get("auth_token")
    if not session_cookie:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. No session cookie found.",
        )
    return verify_session_cookie(session_cookie)


async def get_current_active_user(
    db: AsyncSession = Depends(get_db),
    decoded_claims: dict = Depends(get_current_user_from_cookie)
):
    """
    Dependency to get the current user from the database via session cookie.

    1. Extracts claims from the session cookie.
    2. Gets the user_id from the claims.
    3. Fetches and returns the user from the database.
    """
    # The key for firebase user id in the token is 'uid'
    firebase_uid = decoded_claims.get("uid")
    if firebase_uid is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid authentication credentials: Firebase UID missing from token.",
        )

    stmt = (
        select(models.User)
        .options(
            selectinload(models.User.sent_invitations).selectinload(
                models.PartnerInvitation.receiver
            ),
            selectinload(models.User.received_invitations).selectinload(
                models.PartnerInvitation.sender
            ),
            selectinload(models.User.partnerships_as_user1).selectinload(
                models.Partnership.user2
            ),
        )
        .where(models.User.firebase_uid == firebase_uid)
    )
    result = await db.execute(stmt)
    user = result.scalars().first()
    
    if not user:
        # This might happen if the user exists in Firebase but not in the local DB.
        # A sync mechanism should handle this, but for now, it's an auth error.
        raise HTTPException(status_code=404, detail="User not found in database.")
        
    return user
