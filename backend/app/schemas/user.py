# backend/app/schemas/user.py

import uuid
from enum import Enum
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, TYPE_CHECKING, List

# This is a forward reference import, it's only evaluated by type checkers
if TYPE_CHECKING:
    from .partner_invitation import PartnerInvitation

class PartnershipStatus(str, Enum):
    """Enum for partnership statuses."""
    ACTIVE = "active"
    PENDING = "pending"
    NO_PARTNER = "no_partner"

class BadgeRead(BaseModel):
    id: uuid.UUID
    name: str
    icon: str
    description: str

    class Config:
        from_attributes = True

class UserBadgeRead(BaseModel):
    badge: BadgeRead
    earned_at: datetime

    class Config:
        from_attributes = True

# Base properties shared by all user-related schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

# Properties to receive via API on creation
class UserCreate(UserBase):
    firebase_uid: str

# Properties to receive via API on update
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    bio: Optional[str] = None
    profile_picture_url: Optional[str] = None
    timezone: Optional[str] = None
    notifications_enabled: Optional[bool] = None
    onboarding_complete: Optional[bool] = None

# Properties to return to the client (from the API)
class UserRead(UserBase):
    id: uuid.UUID
    onboarding_complete: bool
    partnership_status: PartnershipStatus
    partner_id: Optional[uuid.UUID] = None
    partner_full_name: Optional[str] = None
    partnership_id: Optional[uuid.UUID] = None
    sent_invitation: Optional["PartnerInvitation"] = None
    received_invitation: Optional["PartnerInvitation"] = None

    # New profile fields
    bio: Optional[str] = Field(default=None)
    profile_picture_url: Optional[str] = Field(default=None)
    timezone: Optional[str] = Field(default=None)
    notifications_enabled: Optional[bool] = Field(default=None)
    current_streak: Optional[int] = Field(default=None)
    longest_streak: Optional[int] = Field(default=None)
    total_tasks_completed: Optional[int] = Field(default=None)
    goals_conquered: Optional[int] = Field(default=None)
    badges: List[UserBadgeRead] = Field(default_factory=list)

    class Config:
        from_attributes = True

# Schema for user data in the database
class UserInDB(UserBase):
    id: uuid.UUID
    firebase_uid: str
    onboarding_complete: bool = False
    partnership_status: PartnershipStatus = PartnershipStatus.NO_PARTNER
    current_partner_id: Optional[uuid.UUID] = None

    class Config:
        from_attributes = True

# Schema for syncing user profile from the Next.js backend
class UserProfileSync(BaseModel):
    firebase_uid: str
    email: EmailStr
    full_name: Optional[str] = None
    invitation_token: Optional[str] = None

class SessionLoginRequest(BaseModel):
    token: str

class UserSyncResponse(BaseModel):
    user: UserRead
    has_partner: bool

# Forward reference resolution is handled in app.schemas.__init__.py
