# backend/app/api/v1/endpoints/goals.py

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
import logging
from typing import List

from app import schemas
from app.db.session import get_db
from app.core.security import get_current_active_user
from app.db import models
from app.core.limiter import limiter

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/", response_model=List[schemas.GoalRead])
@limiter.limit("20/minute")
async def read_goals(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
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
