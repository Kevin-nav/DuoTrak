"""API endpoints for managing partner invitations."""
from typing import Any, List, Optional
import uuid
import logging

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app import schemas
from app.db.session import get_db
from app.core.security import get_current_active_user
from app.db import models
from app.services.partner_invitation_service import PartnerInvitationService
from app.core.limiter import limiter


logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/invite",
    response_model=schemas.PartnerInvitationResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("5/minute")
async def create_partner_invitation(
    request: Request,
    invitation_in: schemas.PartnerInvitationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
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
        invitation = await service.create_invitation(current_user, invitation_in)
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
        "success": True,
        "message": "Invitation sent successfully",
        "data": invitation
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
    current_user: models.User = Depends(get_current_active_user),
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
    "/invitations/{invitation_id}",
    response_model=schemas.PartnerInvitationResponse,
)
@limiter.limit("10/minute")
async def get_partner_invitation(
    request: Request,
    invitation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
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


@router.post("/accept", response_model=schemas.PartnerInvitationResponse)
@limiter.limit("10/minute")
async def accept_partner_invitation(
    request: Request,
    payload: schemas.InvitationAction,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
) -> Any:
    """
    Accept a partner invitation.
    
    - **invitation_id**: The ID of the invitation to accept
    """
    # Check if user already has a partner
    if current_user.current_partner_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a partner"
        )
    
    service = PartnerInvitationService(db)
    

    
    try:
        invitation = await service.respond_to_invitation(payload.invitation_id, current_user, accept=True)
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
    current_user: models.User = Depends(get_current_active_user),
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
    current_user: models.User = Depends(get_current_active_user),
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
