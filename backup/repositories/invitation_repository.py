import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.models.invitation import Invitation, InvitationStatus
from app.repositories.base_repository import BaseRepository
from app.schemas.invitation import InvitationCreate


class InvitationRepository(BaseRepository[Invitation, InvitationCreate, InvitationCreate]):
    def get_by_token(self, db: Session, *, token: str) -> Optional[Invitation]:
        return db.query(Invitation).filter(Invitation.token == token).first()

    def get_by_email_and_inviter(self, db: Session, *, invitee_email: str, inviter_id: uuid.UUID) -> Optional[Invitation]:
        return db.query(Invitation).filter(
            Invitation.invitee_email == invitee_email,
            Invitation.inviter_id == inviter_id,
            Invitation.status == InvitationStatus.PENDING
        ).first()

    def mark_as_accepted(self, db: Session, *, db_obj: Invitation) -> Invitation:
        db_obj.status = InvitationStatus.ACCEPTED
        db_obj.accepted_at = datetime.utcnow()
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

invitation_repo = InvitationRepository(Invitation)
