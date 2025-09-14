# backend/tests/api/v1/test_invitations_and_status.py
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import AsyncMock
from datetime import datetime, timedelta, timezone
import jwt

from app.db import models
from app.schemas.user import AccountStatus
from app.core.config import settings
from app.main import app
from app.db.session import get_db


# Mark all tests in this file as asyncio
pytestmark = pytest.mark.asyncio

# --- Helper Function to Authenticate Client ---

async def get_authenticated_client(
    client: AsyncClient, user: models.User, db_session: AsyncSession
) -> AsyncClient:
    """
    Overrides the get_db dependency to use the test's db_session,
    creates a valid JWT for the user, and sets it as a cookie on the client.
    """
    # Override the dependency to use the test's database session
    async def override_get_db_for_test():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db_for_test

    # Create and set the session cookie
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    payload = {
        'uid': str(user.id),
        'email': user.email,
        'exp': expires_at,
        'iat': datetime.now(timezone.utc),
        'type': 'session'
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
    client.cookies.set(settings.SESSION_COOKIE_NAME, token)
    
    return client

# --- Tests ---

async def test_get_user_status_for_middleware(
    client: AsyncClient,
    user_awaiting_partnership: models.User,
    db_session: AsyncSession
):
    """
    Tests the /me/status endpoint for a user who is awaiting a partner.
    """
    # 1. Authenticate the client as our test user
    authed_client = await get_authenticated_client(client, user_awaiting_partnership, db_session)

    # 2. Make the request to the status endpoint
    response = await authed_client.get("/api/v1/users/me/status")

    # 3. Assert the response is successful and the data is correct
    assert response.status_code == 200
    data = response.json()
    assert data['account_status'] == 'AWAITING_PARTNERSHIP'
    assert data['has_pending_invitation'] is False


async def test_full_invitation_and_acceptance_flow(
    client: AsyncClient,
    db_session: AsyncSession,
    monkeypatch, # Keep monkeypatch here for mocking email
):
    """
    Tests the entire invitation flow from sending to acceptance,
    and verifies that user statuses are updated correctly.
    """
    # 1. Create two users for the test
    inviter = models.User(
        firebase_uid="inviter_uid",
        email="inviter@test.com",
        full_name="Inviter User",
        account_status=AccountStatus.AWAITING_PARTNERSHIP,
    )
    invitee = models.User(
        firebase_uid="invitee_uid",
        email="invitee@test.com",
        full_name="Invitee User",
        account_status=AccountStatus.AWAITING_ONBOARDING, # Starts onboarding
    )
    db_session.add_all([inviter, invitee])
    await db_session.commit()
    await db_session.refresh(inviter)
    await db_session.refresh(invitee)

    # 2. As the inviter, send an invitation
    authed_client_inviter = await get_authenticated_client(client, inviter, db_session)
    invite_payload = {"receiver_email": invitee.email, "receiver_name": invitee.full_name}
    
    # Mock the email service so we don't send real emails
    monkeypatch.setattr('app.services.email_service.EmailService.send_partner_invitation', lambda *args, **kwargs: None)

    response_invite = await authed_client_inviter.post("/api/v1/partner-invitations/invite", json=invite_payload)
    assert response_invite.status_code == 201, f"Invite failed: {response_invite.text}"
    invite_data = response_invite.json()['invitation']
    invitation_token = invite_data['invitation_token']

    # 3. Verify the inviter's status now shows a pending invitation
    # We need to re-authenticate the client for the inviter to make another request
    authed_client_inviter = await get_authenticated_client(client, inviter, db_session)
    response_inviter_status = await authed_client_inviter.get("/api/v1/users/me/status")
    assert response_inviter_status.status_code == 200
    assert response_inviter_status.json()['has_pending_invitation'] is True

    # 4. As the invitee, accept the invitation
    authed_client_invitee = await get_authenticated_client(client, invitee, db_session)
    
    # Mock the acceptance email
    monkeypatch.setattr('app.services.email_service.EmailService.send_invitation_accepted', lambda *args, **kwargs: None)

    response_accept = await authed_client_invitee.post(
        "/api/v1/partner-invitations/accept",
        json={"invitation_token": invitation_token}
    )
    assert response_accept.status_code == 200, f"Accept failed: {response_accept.text}"

    # 5. Verify that both users are now ACTIVE and linked
    await db_session.refresh(inviter)
    await db_session.refresh(invitee)

    assert inviter.account_status == AccountStatus.ACTIVE
    assert invitee.account_status == AccountStatus.ACTIVE
    assert str(inviter.current_partner_id) == str(invitee.id)
    assert str(invitee.current_partner_id) == str(inviter.id)
