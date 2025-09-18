from pydantic import BaseModel
from .goal import GoalCreate, TaskCreate

class OnboardingGoalCreate(BaseModel):
    goal: GoalCreate
    task: TaskCreate
