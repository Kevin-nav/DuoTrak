# backend/app/schemas/agent.py

from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class GoalCreationContext(BaseModel):
    """
    Represents the full context gathered from the frontend goal creation wizard.
    """
    goal_title: str
    motivation: str
    availability: List[str]
    time_commitment: str
    custom_time: Optional[str] = None
    accountability_type: str

class OnboardingGoalPlanRequest(BaseModel):
    goal_title: str
    user_profile: Dict[str, Any]
    contextual_answers: Dict[str, str]
