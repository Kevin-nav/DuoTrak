"""Pydantic schemas for the application."""

# Import all schemas from their respective files first.
from .msg import Msg
from .goal import GoalCreate, GoalRead, TaskCreate, TaskRead
from .user import AccountStatus, PartnershipStatus, UserBase, UserCreate, UserInDB, UserRead, UserUpdate
from .partner_invitation import (
    InvitationAction,
    InvitationActionWithToken,
    InvitationStatus,
    PartnerInvitation,
    PartnerInvitationBase,
    PartnerInvitationCreate,
    PartnerInvitationInDBBase,
    PartnerInvitationResponse,
    PartnerInvitationUpdate,
    PublicInvitationDetails,
)

# Define the public API for the schemas package.
__all__ = [
    "AccountStatus",
    "InvitationAction",
    "InvitationActionWithToken",
    "InvitationStatus",
    "Msg",
    "PartnerInvitation",
    "PartnerInvitationBase",
    "PartnerInvitationCreate",
    "PartnerInvitationInDBBase",
    "PartnerInvitationResponse",
    "PartnerInvitationUpdate",
    "PublicInvitationDetails",
    "GoalCreate",
    "GoalRead",
    "TaskCreate",
    "TaskRead",
    "UserBase",
    "UserCreate",
    "UserInDB",
    "UserRead",
    "UserUpdate",
    "PartnershipStatus",
]

# After all schemas are loaded into this module's scope,
# we can safely rebuild the models that have forward references.
# This resolves the circular dependency issue.
UserRead.model_rebuild()
PartnerInvitation.model_rebuild()



