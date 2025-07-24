import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app import crud
from app.api import deps
from app.core.security import create_access_token
from app.models.user import User
from app.schemas.invitation import InvitationAccept, InvitationAcceptResponse
from app.schemas.partnership import PartnershipCreate
from app.core.ratelimit import limiter

router = APIRouter()


@router.post("/accept", response_model=InvitationAcceptResponse)
@limiter.limit("5/minute")
def accept_invitation(
    *,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
    invitation_in: InvitationAccept,
    request: Request # Required for rate limiting
):
    """
    Accept a partnership invitation.
    """
    invitation = crud.invitation.get_by_token(db, token=invitation_in.token)

    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found.")

    if invitation.invitee_email.lower() != current_user.email.lower():
        raise HTTPException(status_code=403, detail="This invitation is not for you.")

    if invitation.status != 'pending':
        raise HTTPException(status_code=400, detail=f"Invitation is already {invitation.status}.")

    if invitation.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invitation has expired.")

    # Create the partnership
    partnership_in = PartnershipCreate(user1_id=invitation.inviter_id, user2_id=current_user.id)
    partnership = crud.partnership.create(db, obj_in=partnership_in)

    # Mark invitation as accepted
    crud.invitation.mark_as_accepted(db, db_obj=invitation)

    return {
        "message": "Invitation accepted successfully! You are now partners.",
        "partnership_id": partnership.id
    }
