# backend/app/schemas/agent_crew.py
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from typing_extensions import Literal

class GoalWizardData(BaseModel):
    """Data from the Duotrak Goal Creation Wizard."""
    goal_description: str = Field(..., description="User's goal description")
    motivation: str = Field(..., description="Why they want to achieve this goal")
    availability: List[str] = Field(..., description="When they're available to work on it")
    time_commitment: str = Field(..., description="Weekly time commitment")
    accountability_type: str = Field(..., description="Preferred accountability style")
    goal_type: Optional[Literal["habit", "target-date", "milestone"]] = Field(
        None,
        description="Goal type for planning behavior",
    )
    timezone: Optional[str] = Field(None, description="Detected IANA timezone")
    goal_template_id: Optional[str] = Field(None, description="Selected template identifier")
    goal_template_title: Optional[str] = Field(None, description="Selected template title")
    goal_template_tasks: Optional[List[Dict[str, Any]]] = Field(
        None,
        description="Selected template tasks used as personalization baseline",
    )
    partner_name: Optional[str] = Field(None, description="Partner's name if provided")
    partner_relationship: Optional[str] = Field(None, description="Relationship to partner")
    target_deadline: Optional[str] = Field(None, description="Target completion date if user has one")
    preferred_check_in_style: Optional[str] = Field(
        "quick_text",
        description="Preferred partner check-in style: quick_text, photo_recap, voice_note",
    )
    # Shared goal fields
    is_shared_goal: Optional[bool] = Field(None, description="Whether user wants a shared goal")
    shared_goal_mode: Optional[Literal["independent", "together"]] = Field(
        None, description="Shared goal mode"
    )
    partner_timezone: Optional[str] = Field(None, description="Partner's IANA timezone")
    # Template enhancement mode
    template_enhancement_mode: Optional[bool] = Field(
        None, description="Whether AI should enhance a template rather than generate from scratch"
    )

class GoalWizardRequest(BaseModel):
    user_id: str = Field(..., description="Unique user identifier")
    wizard_data: GoalWizardData
    thinking_budget: Optional[int] = Field(None, description="Custom thinking budget")
    enable_thinking_budget: bool = Field(True, description="Whether to use thinking budget")

class StrategicQuestion(BaseModel):
    """A strategic question with suggested answers for better UX."""
    question: str = Field(..., description="The strategic question to ask")
    question_key: str = Field(..., description="Unique identifier for this question")
    context: str = Field(..., description="Why this question is important")
    suggested_answers: List[str] = Field(..., description="3-4 suggested answer options")
    allow_custom_answer: bool = Field(True, description="Whether user can provide custom answer")

class UserProfileSummary(BaseModel):
    """Brief user profile summary for the questions phase."""
    archetype: str = Field(..., description="User's behavioral archetype")
    key_motivators: List[str] = Field(..., description="Primary motivation drivers")
    risk_factors: List[str] = Field(..., description="Potential obstacles")
    confidence_level: float = Field(..., ge=0, le=1, description="Profile confidence 0-1")

class QuestionsResponse(BaseModel):
    """Response containing strategic questions with suggested answers."""
    session_id: str
    user_profile_summary: UserProfileSummary
    strategic_questions: List[StrategicQuestion]
    execution_metadata: Dict[str, Any]

class AnswersSubmissionRequest(BaseModel):
    """User's answers to strategic questions."""
    user_id: str
    answers: Dict[str, str] = Field(..., description="Answers keyed by question_key")
    thinking_budget: Optional[int] = None
    enable_thinking_budget: bool = True

class DuotrakTask(BaseModel):
    description: str = Field(..., description="Task description")
    success_metric: str = Field(..., description="How success is measured")
    recommended_cadence: str = Field(..., description="Suggested cadence for consistency")
    recommended_time_windows: List[str] = Field(default_factory=list, description="Recommended execution windows")
    consistency_rationale: str = Field(..., description="Why this cadence/window is sustainable")
    verification_mode: Literal["photo", "voice", "time-window"] = Field(..., description="Recommended verification mode")
    verification_mode_reason: str = Field(..., description="Why this verification mode fits the task")
    verification_confidence: float = Field(..., ge=0, le=1, description="Confidence in verification mode recommendation")
    time_window_start: Optional[str] = Field(None, description="Start of allowed completion window (HH:MM)")
    time_window_end: Optional[str] = Field(None, description="End of allowed completion window (HH:MM)")
    time_window_duration_minutes: Optional[int] = Field(
        None,
        ge=1,
        description="Time-window duration in minutes when end is not provided",
    )
    partner_required: bool = Field(True, description="Whether partner approval is required")
    auto_approval_policy: Literal["time_window_only", "none"] = Field("time_window_only", description="Auto-approval policy")
    auto_approval_timeout_hours: int = Field(24, ge=1, description="Timeout before eligible auto-approval")
    auto_approval_min_confidence: float = Field(0.85, ge=0, le=1, description="Minimum confidence for eligible auto-approval")
    partner_involvement: Dict[str, str] = Field(default_factory=dict, description="Daily flexible partner touchpoint guidance")
    proof_guidance: Dict[str, List[str]] = Field(default_factory=dict, description="Advisory picture proof guidance")
    # Structured cadence
    cadence: Optional[Dict[str, Any]] = Field(None, description="Structured cadence: {type, days, duration_weeks}")
    difficulty_level: Optional[int] = Field(None, ge=1, le=5, description="Progressive difficulty 1-5")
    minimum_viable_action: Optional[str] = Field(None, description="Smallest possible version of this task")


class DuotrakMilestone(BaseModel):
    title: str = Field(..., description="Milestone title")
    description: str = Field(..., description="Milestone description")
    tasks: List[DuotrakTask] = Field(..., description="Tasks to complete this milestone")


class PartnerAccountability(BaseModel):
    role: str = Field(..., description="Partner's accountability role")
    check_in_schedule: str = Field(..., description="Check-in cadence")
    shared_celebrations: str = Field(..., description="How progress is celebrated")

class DuotrakGoalPlan(BaseModel):
    """Canonical goal plan contract shared with frontend."""
    goal_type: Optional[Literal["habit", "target-date", "milestone"]] = Field(
        None,
        description="Goal type for plan framing",
    )
    title: str = Field(..., description="Engaging goal title")
    description: str = Field(..., description="Detailed plan description")
    milestones: List[DuotrakMilestone] = Field(..., description="Milestone breakdown")
    success_metrics: List[str] = Field(..., description="Overall success metrics")
    adherence_weight: float = Field(..., ge=0, le=1, description="Relative weight on adherence vs schedule fit")
    schedule_soft_cap_percent: float = Field(..., ge=0, le=100, description="Allowed soft overload cap")
    schedule_impact: Dict[str, Any] = Field(..., description="Deterministic schedule verification summary")
    decision_trace: List[str] = Field(default_factory=list, max_length=3, description="Concise user-facing reasons for recommendation")
    partner_accountability: PartnerAccountability
    # Goal-type-specific configs
    habit_config: Optional[Dict[str, Any]] = Field(None, description="Habit-specific config (streak milestones, ramp-up, anchor)")
    milestone_config: Optional[Dict[str, Any]] = Field(None, description="Milestone-specific config (checkpoints, critical path)")
    target_date_config: Optional[Dict[str, Any]] = Field(None, description="Target-date config (phases, periodization, rest)")
    # Day-one readiness
    first_day_actions: Optional[List[str]] = Field(None, description="Concrete actions for today")
    this_week_preview: Optional[str] = Field(None, description="Natural language preview of the first week")
    # Shared goal awareness
    shared_goal_mode: Optional[Literal["independent", "together"]] = Field(None, description="Shared goal mode")
    partner_timezone_adjustment: Optional[str] = Field(None, description="Timezone adjustment note")
    # Template attribution
    template_source_title: Optional[str] = Field(None, description="Original template title if enhanced")
    template_enhanced: Optional[bool] = Field(None, description="Whether this plan was AI-enhanced from a template")

class GoalPlanResponse(BaseModel):
    """Final goal plan response after processing answers."""
    session_id: str
    goal_plan: DuotrakGoalPlan
    partner_integration: str
    personalization_score: float = Field(..., ge=0, le=10)
    execution_metadata: Dict[str, Any]

class GoalFeedbackRequest(BaseModel):
    user_id: str
    session_id: str
    usefulness_score: int = Field(..., ge=1, le=10)
    partner_integration_score: int = Field(..., ge=1, le=10)
    clarity_score: int = Field(..., ge=1, le=10)
    comments: Optional[str] = None

class ThinkingBudgetConfig(BaseModel):
    budget: int = Field(..., ge=0, le=32000, description="Thinking budget in tokens")
    enabled: bool = Field(True, description="Whether thinking budget is enabled")

class BehavioralSnapshot(BaseModel):
    """
    A structured analysis of a user's performance and character evolution over time.
    This is the output of the weekly performance and growth analysis engine.
    """
    character_trait_analysis: str = Field(..., description="An analysis of the user's current character traits based on their performance (e.g., discipline, resilience, inconsistency).")
    growth_trajectory: str = Field(..., description="A comparison of this week's performance to historical snapshots to determine if the user is growing, stagnating, or declining.")
    emerging_patterns: str = Field(..., description="Newly identified behavioral patterns (e.g., 'The user is now consistently completing morning tasks, which is a new development.').")
    archetype_suggestion: str = Field(..., description="A suggested user archetype based on the latest data.")


# ============================================================================
# Onboarding Plan Generation Schemas
# ============================================================================

class OnboardingPlanRequest(BaseModel):
    """Request body for generating an onboarding plan from a goal template."""
    goalTitle: str = Field(..., description="Title of the selected goal template")
    goalDescription: str = Field(..., description="Description of the goal")
    contextualAnswers: Dict[str, str] = Field(default_factory=dict, description="Optional contextual answers for personalization")


class OnboardingPlanTask(BaseModel):
    """A single task within the generated onboarding plan."""
    taskName: str = Field(..., description="Name of the task")
    description: str = Field(..., description="Detailed description of what to do")
    repeatFrequency: str = Field(..., description="How often to repeat: 'daily', 'weekly', 'once'")


class OnboardingPlanResponse(BaseModel):
    """Response containing the AI-generated onboarding plan."""
    goalType: str = Field(..., description="Category of the goal (e.g., 'mindfulness', 'fitness')")
    tasks: List[OnboardingPlanTask] = Field(..., description="List of tasks for the goal")
