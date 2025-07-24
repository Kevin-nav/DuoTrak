# backend/app/schemas/goal.py

import uuid
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

# --- Task Schemas ---

class TaskBase(BaseModel):
    name: str
    status: str = "pending"
    due_date: Optional[datetime] = None

class TaskCreate(TaskBase):
    pass

class TaskRead(TaskBase):
    id: uuid.UUID
    goal_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Goal Schemas ---

class GoalBase(BaseModel):
    name: str
    category: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None

class GoalCreate(GoalBase):
    pass

class GoalRead(GoalBase):
    id: uuid.UUID
    user_id: uuid.UUID
    tasks: List[TaskRead] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
