import uuid
from datetime import datetime
from pydantic import BaseModel
from .user import User

class PartnershipBase(BaseModel):
    pass

class PartnershipCreate(PartnershipBase):
    user1_id: uuid.UUID
    user2_id: uuid.UUID

class PartnershipUpdate(PartnershipBase):
    pass

class Partnership(PartnershipBase):
    id: uuid.UUID
    user1: User
    user2: User
    created_at: datetime

    class Config:
        from_attributes = True
