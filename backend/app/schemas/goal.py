# backend/app/schemas/goal.py

import uuid
# backend/app/schemas/goal.py

import uuid
from datetime import datetime
from typing import List, Optional
from enum import Enum
from pydantic import BaseModel, Field, validator, computed_field

from .task import TaskRead, TaskCreate # Import from the new task schema file

# --- Goal Schemas ---

class GoalBase(BaseModel):
    name: str
    category: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None

class GoalCreate(GoalBase):
    is_habit: bool = False
    tasks: List[TaskCreate] = []

class GoalUpdate(GoalBase):
    pass

class GoalRead(GoalBase):
    id: uuid.UUID
    user_id: uuid.UUID
    is_habit: bool
    tasks: List[TaskRead] = []
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def total(self) -> int:
        return len(self.tasks)

    @computed_field
    @property
    def progress(self) -> int:
        return sum(1 for task in self.tasks if task.status == "completed")

    @computed_field
    @property
    def status(self) -> str:
        if not self.tasks:
            return "On Track"
        if self.progress == self.total:
            return "Completed"
        return "On Track"

    class Config:
        from_attributes = True

# --- AI Goal Suggestion Schemas ---

class GoalType(str, Enum):
    PERSONAL = "personal"
    SHARED = "shared"

class AccountabilityType(str, Enum):
    VISUAL_PROOF = "visual_proof"
    TIME_BOUND_ACTION = "time_bound_action"
    STRICT_PHOTO_VERIFICATION = "strict_photo_verification"
    SYSTEM_VERIFIED_PUNCTUALITY = "system_verified_punctuality"

class GoalSuggestionRequest(BaseModel):
    goal_type: GoalType
    goal_name: str = Field(..., min_length=3, max_length=500)
    motivation: str = Field(..., min_length=10, max_length=1000)
    availability: List[str] = Field(..., min_items=1)
    time_commitment: str
    custom_time: Optional[str] = None
    accountability_type: AccountabilityType
    time_window: Optional[str] = None
    partner_name: Optional[str] = None
    
    @validator('availability')
    def validate_availability(cls, v):
        valid_options = [
            "Mornings (6-9 AM)", "Lunchtime (12-2 PM)", "Evenings (6-9 PM)",
            "Weekends only", "I'm flexible", "Early Mornings (6-8 AM)",
            "Lunch Break (12-2 PM)", "Weekend Mornings", "Weekend Evenings",
            "We're flexible"
        ]
        for item in v:
            if item not in valid_options:
                raise ValueError(f"Invalid availability option: {item}")
        return v

class SuggestedTask(BaseModel):
    task_name: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10, max_length=500)
    repeat_frequency: str = Field(..., description="e.g., 'Daily', '3 times a week'")

class GoalSuggestionResponse(BaseModel):
    goal_type: str = Field(..., description="'Project' or 'Habit'")
    tasks: List[SuggestedTask] = Field(..., min_items=3, max_items=5)
    success_tips: List[str] = Field(..., min_items=2, max_items=4)
    generated_at: str
    model_version: str = "gemini-3-flash"

class OnboardingGoalPlanRequest(BaseModel):
    goal_title: str
    goal_description: str
    contextual_answers: dict
