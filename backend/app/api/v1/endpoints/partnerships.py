import uuid
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.services.partnership_service import partnership_service
from app.api.v1.schemas.partnership import Partnership, PartnershipInvite, PartnershipUpdate
from app.db.models.user import User

# Import the dev dependency from the users endpoint file
from app.api.v1.endpoints.users import get_current_user_dev_override

router = APIRouter()

@router.post("/invite", response_model=Partnership, status_code=status.HTTP_201_CREATED)
async def invite_partner(
    *,
    db: AsyncSession = Depends(get_db),
    invite_data: PartnershipInvite,
    current_user: User = Depends(get_current_user_dev_override)
):
    """
    Create a new partnership invitation.
    """
    partnership = await partnership_service.create_invitation(
        db=db, inviter_user_id=current_user.id, invite_data=invite_data
    )
    return partnership

@router.put("/{partnership_id}/respond", response_model=Partnership)
async def respond_to_invitation(
    *,
    db: AsyncSession = Depends(get_db),
    partnership_id: uuid.UUID,
    response_data: PartnershipUpdate,
    current_user: User = Depends(get_current_user_dev_override)
):
    """
    Accept or reject a partnership invitation.
    """
    partnership = await partnership_service.respond_to_invitation(
        db=db, partnership_id=partnership_id, responding_user_id=current_user.id, response_data=response_data
    )
    return partnership

@router.get("/invitations/pending", response_model=list[Partnership])
async def get_pending_invitations(
    *,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_dev_override)
):
    """
    Get all pending invitations for the current user.
    """
    from app.repositories.partnership_repository import partnership_repo
    pending_invitations = await partnership_repo.get_pending_invitations_for_user(db, user_id=current_user.id)
    return pending_invitations
