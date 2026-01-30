from datetime import datetime
from enum import Enum
from typing import Optional, TYPE_CHECKING
from uuid import UUID
import uuid

from pydantic import BaseModel, EmailStr, Field

if TYPE_CHECKING:
    from .user import UserRead

class InvitationStatus(str, Enum):
    """Invitation status values."""
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    REVOKED = "revoked"
    EXPIRED = "expired"
    VIEWED = "viewed"

class PartnerInvitationBase(BaseModel):
    """Base schema for partner invitation."""
    receiver_email: EmailStr = Field(..., description="Email address of the user being invited")

class PartnerInvitationCreate(PartnerInvitationBase):
    """Schema for creating a new partner invitation."""
    receiver_name: str = Field(..., min_length=1, max_length=100, description="Name of the user being invited")
    message: Optional[str] = Field(None, max_length=500, description="Optional custom message from the sender")
    expires_in_days: int = Field(7, description="Number of days until the invitation expires")

class PartnerInvitationUpdate(BaseModel):
    """Schema for updating an existing partner invitation."""
    status: InvitationStatus = Field(..., description="New status for the invitation")

class PartnerInvitationInDBBase(PartnerInvitationBase):
    """Base schema for partner invitation in the database."""
    id: UUID
    sender_id: UUID
    status: InvitationStatus
    created_at: datetime
    expires_at: datetime
    last_nudged_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PartnerInvitation(PartnerInvitationInDBBase):
    """Schema for returning a partner invitation with sender details."""
    sender: "UserRead"
    invitation_token: str

class InvitationAction(BaseModel):
    invitation_id: uuid.UUID

class InvitationActionWithToken(BaseModel):
    invitation_token: str



class PartnerInvitationResponse(BaseModel):
    """Response schema for partner invitation operations."""
    message: str
    invitation: Optional[PartnerInvitation] = None

# Forward reference resolution is handled in app.schemas.__init__.py

class PublicInvitationDetails(BaseModel):
    """Schema for public invitation details."""
    sender_name: str
    sender_profile_picture_url: Optional[str] = None
    receiver_name: str
    custom_message: Optional[str] = None
    expires_at: datetime


