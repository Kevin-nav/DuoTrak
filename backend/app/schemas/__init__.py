"""Pydantic schemas for the application."""

# Import all schemas from their respective files.
from .user import (
    UserCreate, UserUpdate, UserRead, AccountStatus, PartnershipStatus, 
    UserBase, UserInDB, UserProfileSync, SessionLoginRequest, UserSyncResponse, 
    BadgeRead, UserBadgeRead
)
from .goal import (
    GoalRead, GoalCreate, GoalUpdate, GoalSuggestionRequest, GoalSuggestionResponse, 
    GoalBase, GoalType, AccountabilityType, SuggestedTask, OnboardingGoalPlanRequest as GoalOnboardingRequest
)
from .task import TaskCreate, TaskUpdate, TaskRead, TaskBase
from .partner_invitation import (
    PartnerInvitation, PartnerInvitationCreate, PartnerInvitationUpdate, 
    PublicInvitationDetails, InvitationStatus, PartnerInvitationBase, 
    PartnerInvitationInDBBase, InvitationAction, InvitationActionWithToken, 
    PartnerInvitationResponse
)
from .agent import GoalCreationContext, OnboardingGoalPlanRequest
from .msg import Msg
from .onboarding import OnboardingGoalCreate

# After all schemas are loaded, rebuild models with forward references.
UserRead.model_rebuild()
PartnerInvitation.model_rebuild()



