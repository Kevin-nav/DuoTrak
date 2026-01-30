# backend/app/agents_v2/models.py
from pydantic import BaseModel, Field
from typing import List, Optional

class TaskModel(BaseModel):
    """Data model for a single task within a goal plan."""
    task_name: str = Field(..., description="The specific, actionable name of the task.")
    description: str = Field(..., description="A brief explanation of what the task involves.")
    repeat_frequency: str = Field(..., description="How often the task should be repeated (e.g., 'Daily', 'Weekly on Monday').")

class GoalCreationContext(BaseModel):
    """
    The unified and complete input model for the agentic system.
    This structure ensures all rich data from the frontend is captured and used.
    """
    goal_title: str = Field(..., description="The user's primary goal, as a free-text statement.")
    motivation: str = Field(..., description="The user's core reason or 'why' for the goal.")
    availability: List[str] = Field(..., description="An array of strings representing when the user is free.")
    time_commitment_description: str = Field(..., description="User's description of their time commitment (e.g., 'Suggest optimal based on my input', '3-4 hours a week').")
    accountability_type: str = Field(..., description="Preferred tracking method. E.g., 'visual_proof', 'time_bound_action'.")
    is_shared_goal: bool = Field(False, description="Whether this is a shared goal with their accountability partner.")

class FinalPlan(BaseModel):
    """
    The 'golden standard' output model for a high-quality, personalized goal plan.
    This is the primary object the Goal Creation Crew is tasked with producing.
    """
    title: str = Field(..., description="A motivating and descriptive title for the goal plan.")
    description: str = Field(..., description="A brief, encouraging overview of the plan.")
    goal_type: str = Field(..., description="The AI's classification of the goal (e.g., 'Habit', 'Project').")
    difficulty_level: float = Field(..., ge=0.0, le=1.0, description="The AI's estimated difficulty for the user, from 0.0 (very easy) to 1.0 (very challenging).")
    estimated_duration_days: int = Field(..., gt=0, description="The estimated number of days to complete the goal.")
    tasks: List[TaskModel] = Field(..., min_items=2, description="A list of specific, actionable tasks.")
    success_tips: List[str] = Field(..., min_items=1, description="Personalized tips to help the user succeed.")
    partner_involvement_suggestions: List[str] = Field(..., description="Specific, actionable suggestions for how the user's accountability partner can support this goal. This is a critical component for the Duotrak application.")

class PlanEvaluation(BaseModel):
    """
    The structured output from the internal JudgeAgentV2, providing a final
    quantitative and qualitative assessment of the generated plan.
    """
    final_score: float = Field(..., ge=0.0, le=10.0, description="The final weighted average score for the plan.")
    thought: str = Field(..., description="A brief, objective justification for the score, highlighting strengths and weaknesses.")

