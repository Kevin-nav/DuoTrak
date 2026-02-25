from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


GoalIntent = Literal["target-date", "habit", "milestone"]
AccountabilityType = Literal["photo", "video", "voice", "check_in", "task_completion"]


class SelfProfilePrompt(BaseModel):
    prompt_id: str
    question: str


class GoalChatTask(BaseModel):
    name: str = Field(..., min_length=1)
    description: Optional[str] = None


class GoalChatSlotUpdates(BaseModel):
    intent: Optional[GoalIntent] = None
    success_definition: Optional[str] = None
    accountability_type: Optional[AccountabilityType] = None
    deadline: Optional[str] = None
    review_cycle: Optional[str] = None
    tasks: Optional[List[GoalChatTask]] = None
    user_summary: Optional[str] = None


class GoalChatProfileState(BaseModel):
    behavioral_summary: str
    self_profile_prompts: List[SelfProfilePrompt]
    answers: Dict[str, str]
    merged_summary: str


class GoalChatCreateSessionRequest(BaseModel):
    user_id: Optional[str] = None
    behavioral_summary: Optional[str] = None


class GoalChatCreateSessionResponse(BaseModel):
    session_id: str
    missing_slots: List[str]
    required_slots: List[str]
    profile: GoalChatProfileState


class GoalChatTurnRequest(BaseModel):
    message: str = Field(..., min_length=1)
    slot_updates: GoalChatSlotUpdates = Field(default_factory=GoalChatSlotUpdates)
    profile_answers: Dict[str, str] = Field(default_factory=dict)
    selected_chip: Optional[str] = None


class GoalChatTurnResponse(BaseModel):
    session_id: str
    missing_slots: List[str]
    captured_slots: Dict[str, Any]
    next_prompt: str
    is_ready_to_finalize: bool
    profile: GoalChatProfileState
    quick_reply_chips: List[str] = Field(default_factory=list)


class GoalChatFinalizeRequest(BaseModel):
    has_partner: bool


class GoalChatFinalizeResponse(BaseModel):
    session_id: str
    finalized: bool
    goal_plan: Optional[Dict[str, Any]] = None
    validation_errors: List[str] = Field(default_factory=list)


class GoalChatSummaryResponse(BaseModel):
    session_id: str
    ready_for_summary: bool
    summary: Dict[str, Any]


class GoalChatSummaryPatchRequest(BaseModel):
    summary: Dict[str, Any]


# ── Plan Generation Schemas ──


class PlanTask(BaseModel):
    name: str
    description: str = ""
    frequency: Literal["daily", "weekly", "biweekly", "monthly"] = "weekly"
    days: List[str] = Field(default_factory=list)
    duration_minutes: int = 30
    accountability_type: AccountabilityType = "task_completion"


class PlanMilestone(BaseModel):
    name: str
    description: str = ""
    target_week: int = 4
    progress_weight: int = 25
    tasks: List[PlanTask] = Field(default_factory=list)


class GeneratedPlan(BaseModel):
    title: str
    description: str = ""
    intent: GoalIntent = "habit"
    accountability_type: AccountabilityType = "task_completion"
    deadline: Optional[str] = None
    milestones: List[PlanMilestone] = Field(default_factory=list)


class GeneratePlanResponse(BaseModel):
    session_id: str
    plan: GeneratedPlan
