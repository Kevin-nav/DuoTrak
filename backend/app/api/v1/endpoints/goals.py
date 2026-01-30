# backend/app/api/v1/endpoints/goals.py

from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
import logging
from typing import List, Dict, Any

from app import schemas
from app.db.session import get_db
from app.api.v1.endpoints.users import get_current_user_from_cookie
from app.db import models
from app.core.limiter import limiter
from app.schemas.onboarding import OnboardingGoalCreate
from app.services.ai_suggestion_service import ai_suggestion_service
from app.api.v1.dependencies import validate_goal_request

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/onboarding-questions", response_model=Dict[str, Any], deprecated=True)
@limiter.limit("5/minute")
async def get_onboarding_questions(
    request: Request,
    goal_context: schemas.GoalCreationContext, # Use the new richer schema
    current_user: models.User = Depends(get_current_user_from_cookie)
):
    """
    First step of the onboarding AI flow: Generate clarifying questions.
    """
    # This endpoint is deprecated and its logic is now handled by the V3 goal creation flow.
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail="This endpoint is deprecated. Please use the new V3 '/goal-creation/questions' endpoint."
    )

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
        .where(models.Goal.user_id == current_user.id, models.Goal.is_archived == False)
        .options(selectinload(models.Goal.tasks))
        .order_by(models.Goal.created_at.desc())
    )
    
    result = await db.execute(stmt)
    goals = result.scalars().all()
    
    return goals

@router.post("/{goal_id}/archive", response_model=schemas.GoalRead)
@limiter.limit("10/minute")
async def archive_goal(
    request: Request,
    goal_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user_from_cookie)
):
    """
    Archive a specific goal by its ID.
    """
    logger.info(f"--- Archiving goal {goal_id} for user_id: {current_user.id} ---")
    
    stmt = select(models.Goal).where(models.Goal.id == goal_id, models.Goal.user_id == current_user.id)
    result = await db.execute(stmt)
    goal = result.scalars().first()
    
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
        
    goal.is_archived = True
    await db.commit()
    await db.refresh(goal)
    
    return goal


@router.get("/{goal_id}", response_model=schemas.GoalRead)
@limiter.limit("30/minute")
async def read_goal(
    request: Request,
    goal_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user_from_cookie)
):
    """
    Get a specific goal by its ID.
    """
    logger.info(f"--- Fetching goal {goal_id} for user_id: {current_user.id} ---")
    
    stmt = (
        select(models.Goal)
        .where(models.Goal.id == goal_id, models.Goal.user_id == current_user.id)
        .options(selectinload(models.Goal.tasks))
    )
    
    result = await db.execute(stmt)
    goal = result.scalars().first()
    
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
        
    return goal

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

@router.post("/", response_model=schemas.GoalRead)
@limiter.limit("10/minute")
async def create_goal(
    request: Request,
    goal_in: schemas.GoalCreate = Depends(validate_goal_request),
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user_from_cookie),
):
    """
    Create a new goal for the current user.
    """
    logger.info(f"--- Creating goal for user_id: {current_user.id} ---")
    
    goal_data = goal_in.dict()
    tasks_data = goal_data.pop('tasks', [])
    
    # Create the goal instance
    goal = models.Goal(**goal_data, user_id=current_user.id)
    db.add(goal)
    await db.flush() # Flush to get the goal.id before creating tasks

    # Create and add task instances
    for task_data in tasks_data:
        task = models.Task(**task_data, goal_id=goal.id)
        db.add(task)

    await db.commit()
    
    # Eagerly load the tasks relationship before returning
    await db.refresh(goal, attribute_names=["tasks"])
    
    return goal

@router.post("/suggest-tasks", response_model=schemas.GoalSuggestionResponse)
@limiter.limit("5/minute")
async def suggest_tasks(
    request: Request,
    goal_data: schemas.GoalSuggestionRequest,
    current_user: models.User = Depends(get_current_user_from_cookie)
):
    """
    Generate AI-powered task suggestions for a user's goal.
    """
    try:
        logger.info(f"Received task suggestion request from user {current_user.id}")
        
        suggestions = await ai_suggestion_service.generate_task_suggestions(
            request=goal_data,
            user=current_user
        )
        
        logger.info(f"Successfully generated suggestions for user {current_user.id}")
        return suggestions
        
    except ValueError as e:
        logger.error(f"Validation error for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid request: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while generating suggestions. Please try again."
        )

@router.post("/onboarding-plan", response_model=schemas.GoalSuggestionResponse, deprecated=True)
@limiter.limit("5/minute")
async def get_onboarding_plan(
    request: Request,
    plan_request: schemas.OnboardingGoalPlanRequest, # This will now contain the user's answers
    current_user: models.User = Depends(get_current_user_from_cookie)
):
    """
    Second step of the onboarding AI flow: Generate the final plan.
    """
    # This endpoint is deprecated and its logic is now handled by the V3 goal creation flow.
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail="This endpoint is deprecated. Please use the new V3 '/goal-creation/{session_id}/plan' endpoint."
    )

@router.post("/{goal_id}/duplicate", response_model=schemas.GoalRead)
@limiter.limit("10/minute")
async def duplicate_goal(
    request: Request,
    goal_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user_from_cookie)
):
    """
    Duplicate a specific goal by its ID.
    """
    logger.info(f"--- Duplicating goal {goal_id} for user_id: {current_user.id} ---")
    
    stmt = (
        select(models.Goal)
        .where(models.Goal.id == goal_id, models.Goal.user_id == current_user.id)
        .options(selectinload(models.Goal.tasks))
    )
    
    result = await db.execute(stmt)
    original_goal = result.scalars().first()
    
    if not original_goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

    # Create a new goal with a modified name
    new_goal_data = {
        "name": f"{original_goal.name} (Copy)",
        "category": original_goal.category,
        "icon": original_goal.icon,
        "color": original_goal.color,
        "is_habit": original_goal.is_habit,
        "user_id": current_user.id
    }
    
    new_goal = models.Goal(**new_goal_data)
    db.add(new_goal)
    await db.flush()

    # Duplicate the tasks
    for original_task in original_goal.tasks:
        new_task_data = {
            "name": original_task.name,
            "description": original_task.description,
            "repeat_frequency": original_task.repeat_frequency,
            "status": "pending",
            "goal_id": new_goal.id
        }
        new_task = models.Task(**new_task_data)
        db.add(new_task)

    await db.commit()
    await db.refresh(new_goal, attribute_names=["tasks"])
    
    return new_goal
