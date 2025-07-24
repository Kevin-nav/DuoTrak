import uuid
from datetime import datetime, timedelta
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.base_class import Base
from app.schemas.invitation import InvitationStatus


class Invitation(Base):
    __tablename__ = 'invitations'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    inviter_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    invitee_email = Column(String, nullable=False, index=True)
    status = Column(Enum(InvitationStatus), nullable=False, default=InvitationStatus.PENDING)
    token = Column(String, nullable=False, unique=True, index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False, default=lambda: datetime.utcnow() + timedelta(days=7))

    inviter = relationship("User", back_populates="sent_invitations")
