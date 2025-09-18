# backend/app/api/v1/endpoints/goals.py

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
import logging
from typing import List

from app import schemas
from app.db.session import get_db
from app.api.v1.endpoints.users import get_current_user_from_cookie
from app.db import models
from app.core.limiter import limiter
from app.schemas.onboarding import OnboardingGoalCreate

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/", response_model=List[schemas.GoalRead])
@limiter.limit("20/minute")
async def read_goals(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user_from_cookie)
):
    """
    Get all goals for the current user.
    """
    logger.info(f"--- Fetching goals for user_id: {current_user.id} ---")
    
    stmt = (
        select(models.Goal)
        .where(models.Goal.user_id == current_user.id)
        .options(selectinload(models.Goal.tasks))
        .order_by(models.Goal.created_at.desc())
    )
    
    result = await db.execute(stmt)
    goals = result.scalars().all()
    
    return goals

@router.post("/onboarding", response_model=schemas.GoalRead)
@limiter.limit("5/minute")
async def create_onboarding_goal(
    request: Request,
    onboarding_goal: OnboardingGoalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user_from_cookie),
):
    """
    Create the first goal and task during onboarding.
    """
    logger.info(f"--- Creating onboarding goal for user_id: {current_user.id} ---")
    
    # Create the goal
    goal = models.Goal(**onboarding_goal.goal.dict(), user_id=current_user.id)
    db.add(goal)
    await db.flush() # Flush to get the goal.id

    # Create the task associated with the goal
    task = models.Task(**onboarding_goal.task.dict(), goal_id=goal.id)
    db.add(task)
    
    await db.commit()
    await db.refresh(goal)
    
    return goal
