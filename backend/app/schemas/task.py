# backend/app/schemas/task.py

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class TaskBase(BaseModel):
    name: str
    status: str = "pending"
    due_date: Optional[datetime] = None

class TaskCreate(TaskBase):
    description: Optional[str] = None
    repeat_frequency: Optional[str] = None

class TaskUpdate(TaskBase):
    pass

class TaskRead(TaskBase):
    id: uuid.UUID
    goal_id: uuid.UUID
    description: Optional[str] = None
    repeat_frequency: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
