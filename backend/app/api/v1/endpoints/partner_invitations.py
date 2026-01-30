"""API endpoints for managing partner invitations."""
from typing import Any, List, Optional
import uuid
import logging
import jwt
from jwt import PyJWTError


from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app import schemas
from app.db.session import get_db
from app.core.config import settings
from app.db import models
from app.services.partner_invitation_service import PartnerInvitationService
from app.services.user_service import UserService
from app.core.limiter import limiter


logger = logging.getLogger(__name__)
router = APIRouter()
user_service = UserService()

async def get_current_user_from_cookie(
    request: Request, db: AsyncSession = Depends(get_db)
) -> models.User:
    """
    Dependency to get the current user from the session cookie.
    """
    session_token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    try:
        payload = jwt.decode(
            session_token, settings.SECRET_KEY, algorithms=["HS256"]
        )
        user_id_str = payload.get("uid")
        if user_id_str is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload"
            )
        try:
            user_id = uuid.UUID(user_id_str)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user ID in token"
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


@router.post(
    "/invite",
    response_model=schemas.PartnerInvitationResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("5/minute")
async def invite_partner(
    request: Request,
    invitation_in: schemas.PartnerInvitationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user_from_cookie),
) -> Any:
    logger.info(
        f"User '{current_user.email}' ({current_user.id}) is attempting to invite a partner."
    )
    logger.info(f"Invitation details: {invitation_in.dict()}")
    """
    Create a new partner invitation.
    
    - **receiver_email**: Email address of the user to invite
    - **expires_in_days**: Number of days until the invitation expires (default: 7)
    """
    # Check if user already has a partner
    if current_user.current_partner_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a partner"
        )
    
    # Create the invitation
    service = PartnerInvitationService(db)
    try:
        invitation, invitation_token = await service.create_invitation(current_user, invitation_in)
    except HTTPException as e:
        raise e
    except Exception as e:
        # The service layer should ideally log the specific error.
        # This endpoint log provides context that the operation failed.
        logger.error(
            f"Failed to create invitation from user '{current_user.email}'. An unexpected error occurred in the service layer.",
            exc_info=True
        )
        # Do not rollback here, the service layer should handle its own transaction
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating the invitation. Check server logs for details."
        )
    
    # TODO: Send email notification
    
    return {
        "message": "Invitation sent successfully",
        "invitation": {**invitation.__dict__, "invitation_token": invitation_token}
    }


@router.get(
    "/invitations",
    response_model=List[schemas.PartnerInvitation],
)
@limiter.limit("10/minute")
async def list_partner_invitations(
    request: Request,
    status: Optional[schemas.InvitationStatus] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user_from_cookie),
) -> List[schemas.PartnerInvitation]:
    """
    List all partner invitations for the current user.
    
    - **status**: Filter by invitation status (pending, accepted, rejected, revoked, expired)
    - **skip**: Number of records to skip (for pagination)
    - **limit**: Maximum number of records to return (for pagination)
    """
    service = PartnerInvitationService(db)
    invitations, _ = await service.get_user_invitations(
        user=current_user,
        status_filter=status,
        skip=skip,
        limit=limit
    )
    
    return invitations


@router.get(
    "/me/sent-status",
    response_model=Optional[schemas.PartnerInvitation],
)
@limiter.limit("10/minute")
async def get_my_sent_invitation_status(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user_from_cookie),
) -> Optional[schemas.PartnerInvitation]:
    """
    Get the most recent pending invitation sent by the current user.
    """
    service = PartnerInvitationService(db)
    invitation = await service.get_most_recent_sent_invitation(current_user)
    return invitation


@router.get(
    "/invitations/{invitation_id}",
    response_model=schemas.PartnerInvitationResponse,
)
@limiter.limit("10/minute")
async def get_partner_invitation(
    request: Request,
    invitation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user_from_cookie),
) -> Any:
    """
    Get a specific partner invitation by ID.
    
    - **invitation_id**: The ID of the invitation to retrieve
    """
    try:
        invitation_uuid = uuid.UUID(invitation_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid invitation ID format"
        )
    
    # Get the invitation
    stmt = select(models.PartnerInvitation).where(models.PartnerInvitation.id == invitation_uuid)
    result = await db.execute(stmt)
    invitation = result.scalars().first()
    
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )
    
    # Check if the current user is the sender or receiver
    if (invitation.sender_id != current_user.id and 
            invitation.receiver_email.lower() != current_user.email.lower()):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this invitation"
        )
    
    return {
        "success": True,
        "message": "Invitation retrieved successfully",
        "data": invitation
    }


@router.get(
    "/invitations/details/{token}",
    response_model=schemas.PublicInvitationDetails,
    status_code=status.HTTP_200_OK,
)
@limiter.limit("15/minute")
async def get_public_invitation_details(
    request: Request,
    token: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Get public details of an invitation using the token.
    This endpoint is not authenticated and only returns non-sensitive information.
    """
    service = PartnerInvitationService(db)
    return await service.get_public_invitation_details(token)


@router.patch(
    "/{token}/viewed",
    response_model=schemas.PartnerInvitationResponse,
    status_code=status.HTTP_200_OK,
)
@limiter.limit("15/minute")
async def mark_invitation_as_viewed(
    request: Request,
    token: str,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Mark an invitation as 'viewed' by its token.
    This endpoint is not authenticated.
    """
    service = PartnerInvitationService(db)
    invitation = await service.mark_invitation_as_viewed(token)
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found or already responded to.",
        )
    return {"message": "Invitation marked as viewed", "data": invitation}


@router.post("/accept", response_model=schemas.PartnerInvitationResponse)
@limiter.limit("10/minute")
async def accept_partner_invitation(
    request: Request,
    payload: schemas.InvitationActionWithToken,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user_from_cookie),
) -> Any:
    """
    Accept a partner invitation using an invitation token.
    """
    # Check if user already has a partner
    if current_user.current_partner_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a partner"
        )
    
    service = PartnerInvitationService(db)
    
    try:
        # The service now handles the token lookup and acceptance
        invitation = await service.accept_invitation_by_token(
            token=payload.invitation_token, 
            user=current_user
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing the invitation"
        ) from e
    
    return {
        "success": True,
        "message": "Invitation accepted successfully",
        "data": invitation
    }


@router.post("/reject", response_model=schemas.PartnerInvitationResponse)
@limiter.limit("10/minute")
async def reject_partner_invitation(
    request: Request,
    payload: schemas.InvitationAction,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user_from_cookie),
) -> Any:
    """
    Reject a partner invitation.
    
    - **invitation_id**: The ID of the invitation to reject
    """
    service = PartnerInvitationService(db)
    

    
    try:
        invitation = await service.respond_to_invitation(payload.invitation_id, current_user, accept=False)
    except HTTPException as e:
        raise e
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing the invitation"
        ) from e
    
    return {
        "success": True,
        "message": "Invitation rejected successfully",
        "data": invitation
    }


@router.delete(
    "/invitations/{invitation_id}",
    response_model=schemas.PartnerInvitationResponse,
)
@limiter.limit("10/minute")
async def revoke_partner_invitation(
    request: Request,
    invitation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user_from_cookie),
) -> Any:
    """
    Revoke a sent partner invitation.
    
    - **invitation_id**: The ID of the invitation to revoke
    """
    service = PartnerInvitationService(db)
    
    try:
        invitation_uuid = uuid.UUID(invitation_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid invitation ID format"
        )
    
    try:
        invitation = await service.revoke_invitation(invitation_uuid, current_user)
    except HTTPException as e:
        raise e
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while revoking the invitation"
        ) from e
    
    return {
        "success": True,
        "message": "Invitation revoked successfully",
        "data": invitation
    }


@router.post(
    "/invitations/{invitation_id}/nudge",
    status_code=status.HTTP_200_OK,
)
@limiter.limit("3/day")
async def nudge_partner(
    request: Request,
    invitation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user_from_cookie),
):
    """
    Send a reminder nudge for a pending invitation.
    """
    service = PartnerInvitationService(db)
    try:
        invitation_uuid = uuid.UUID(invitation_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid invitation ID format"
        )

    try:
        await service.nudge_invitation(invitation_uuid, current_user)
    except HTTPException as e:
        raise e
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while sending the nudge."
        )

    return {"message": "Nudge sent successfully"}