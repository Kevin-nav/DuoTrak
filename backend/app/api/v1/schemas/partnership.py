from pydantic import BaseModel, EmailStr
from typing import Optional
import uuid

class PartnershipBase(BaseModel):
    pass

class PartnershipInvite(BaseModel):
    invitee_email: EmailStr

class PartnershipCreate(BaseModel):
    user1_id: uuid.UUID
    user2_id: uuid.UUID
    inviter_id: uuid.UUID
    status: str = "pending"

class PartnershipUpdate(BaseModel):
    status: str  # 'accepted' or 'rejected'

class Partnership(PartnershipBase):
    id: uuid.UUID
    user1_id: uuid.UUID
    user2_id: uuid.UUID
    inviter_id: uuid.UUID
    status: str

    model_config = {"from_attributes": True}
