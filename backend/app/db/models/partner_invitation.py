import uuid
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Optional

from sqlalchemy import Column, String, DateTime, ForeignKey, Index, text, Enum
from sqlalchemy.dialects.postgresql import UUID



from app.db.base import Base


class InvitationStatus(str, Enum):
    """Enum for invitation status values."""
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    REVOKED = "revoked"
    EXPIRED = "expired"
    VIEWED = "viewed"


class PartnerInvitation(Base):
    """
    Represents a partnership invitation between two users.
    """
    __tablename__ = 'partner_invitations'
    
    # Default expiration time (7 days)
    DEFAULT_EXPIRATION_DAYS = 7
    
    id = Column(
        UUID(as_uuid=True), 
        primary_key=True, 
        server_default=text('gen_random_uuid()')
    )
    sender_id = Column(
        UUID(as_uuid=True), 
        ForeignKey('users.id', ondelete='CASCADE'), 
        nullable=False
    )
    receiver_id = Column(
        UUID(as_uuid=True),
        ForeignKey('users.id', ondelete='SET NULL'),
        nullable=True
    )
    receiver_name = Column(String(100), nullable=False)
    receiver_email = Column(
        String(255), 
        nullable=False,
        index=True
    )
    message = Column(String(500), nullable=True)
    invitation_token = Column(
        UUID(as_uuid=True), 
        nullable=False, 
        unique=True,
        server_default=text('gen_random_uuid()')
    )
    status = Column(
        Enum(
            "pending", "accepted", "rejected", "revoked", "expired", "viewed",
            name='invitation_status',
            native_enum=False
        ),
        nullable=False,
        default="pending"
    )
    created_at = Column(
        DateTime(timezone=True), 
        nullable=False, 
        server_default=text('now()')
    )
    expires_at = Column(
        DateTime(timezone=True), 
        nullable=True
    )
    accepted_at = Column(
        DateTime(timezone=True), 
        nullable=True
    )
    updated_at = Column(
        DateTime(timezone=True), 
        nullable=False, 
        server_default=text('now()'),
        onupdate=text('now()')
    )
    last_nudged_at = Column(
        DateTime(timezone=True),
        nullable=True
    )
    
    # Relationships to User are configured in app/db/models/__init__.py
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Set default expiration if not provided
        if not self.expires_at:
            self.expires_at = datetime.now(timezone.utc) + timedelta(
                days=self.DEFAULT_EXPIRATION_DAYS
            )
    
    @property
    def is_expired(self) -> bool:
        """Check if the invitation has expired."""
        if self.status == InvitationStatus.EXPIRED:
            return True
        return self.expires_at and self.expires_at < datetime.now(timezone.utc)
    
    @property
    def is_active(self) -> bool:
        """Check if the invitation is still active (not expired and pending)."""
        return self.status == InvitationStatus.PENDING and not self.is_expired
    
    def accept(self) -> None:
        """Mark the invitation as accepted."""
        self.status = InvitationStatus.ACCEPTED
        self.accepted_at = datetime.now(timezone.utc)
    
    def reject(self) -> None:
        """Mark the invitation as rejected."""
        self.status = InvitationStatus.REJECTED
    
    def revoke(self) -> None:
        """Revoke the invitation."""
        self.status = InvitationStatus.REVOKED
    
    def expire(self) -> None:
        """Mark the invitation as expired."""
        self.status = InvitationStatus.EXPIRED
