import uuid
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, EmailStr

class InvitationStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    EXPIRED = "expired"
    DECLINED = "declined"


class InvitationBase(BaseModel):
    invitee_email: EmailStr


class InvitationCreate(InvitationBase):
    pass


class Invitation(InvitationBase):
    id: uuid.UUID
    inviter_id: uuid.UUID
    status: InvitationStatus
    created_at: datetime
    expires_at: datetime

    class Config:
        from_attributes = True


class InvitationAccept(BaseModel):
    token: str


class InvitationAcceptResponse(BaseModel):
    message: str
    partnership_id: uuid.UUID
