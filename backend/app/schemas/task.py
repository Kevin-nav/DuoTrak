# backend/app/schemas/task.py

import uuid
from datetime import datetime, timedelta, timezone
from typing import Literal, Optional
from pydantic import BaseModel, Field

VerificationMode = Literal["photo", "voice", "time-window"]
AutoApprovalPolicy = Literal["time_window_only", "none"]
VerificationOutcome = Literal["pending_partner_review", "approved", "rejected"]

class TaskBase(BaseModel):
    name: str
    status: str = "pending"
    due_date: Optional[datetime] = None
    verification_mode: VerificationMode = "photo"
    verification_mode_reason: Optional[str] = None
    verification_confidence: Optional[float] = Field(default=None, ge=0, le=1)
    auto_approval_policy: AutoApprovalPolicy = "time_window_only"
    auto_approval_timeout_hours: int = 24
    auto_approval_min_confidence: float = Field(default=0.85, ge=0, le=1)
    verification_submitted_at: Optional[datetime] = None
    verification_evidence_confidence: Optional[float] = Field(default=None, ge=0, le=1)
    verification_reviewed_at: Optional[datetime] = None
    verification_outcome: Optional[VerificationOutcome] = None
    verification_rejection_reason: Optional[str] = None

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


class TaskVerificationDecision(BaseModel):
    requires_partner_review: bool
    auto_approved: bool
    outcome: VerificationOutcome
    reason: str


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo:
        return value.astimezone(timezone.utc)
    return value.replace(tzinfo=timezone.utc)


def evaluate_task_verification_decision(
    *,
    verification_mode: VerificationMode,
    auto_approval_policy: AutoApprovalPolicy,
    evidence_confidence: float,
    submitted_at: datetime,
    now: datetime,
    auto_approval_timeout_hours: int = 24,
    auto_approval_min_confidence: float = 0.85,
) -> TaskVerificationDecision:
    """
    Partner-loop policy:
    - photo/voice: always partner review required
    - time-window: partner review required initially, but can auto-approve after timeout
      only when confidence >= threshold and policy allows it.
    """
    if verification_mode in {"photo", "voice"}:
        return TaskVerificationDecision(
            requires_partner_review=True,
            auto_approved=False,
            outcome="pending_partner_review",
            reason=f"{verification_mode} evidence requires partner review.",
        )

    submitted_utc = _as_utc(submitted_at)
    now_utc = _as_utc(now)
    timeout_deadline = submitted_utc + timedelta(hours=auto_approval_timeout_hours)

    if auto_approval_policy != "time_window_only":
        return TaskVerificationDecision(
            requires_partner_review=True,
            auto_approved=False,
            outcome="pending_partner_review",
            reason="Auto-approval policy disabled for this task.",
        )

    if evidence_confidence < auto_approval_min_confidence:
        return TaskVerificationDecision(
            requires_partner_review=True,
            auto_approved=False,
            outcome="pending_partner_review",
            reason="Evidence confidence below auto-approval threshold.",
        )

    if now_utc < timeout_deadline:
        return TaskVerificationDecision(
            requires_partner_review=True,
            auto_approved=False,
            outcome="pending_partner_review",
            reason="Partner review timeout window has not elapsed.",
        )

    return TaskVerificationDecision(
        requires_partner_review=False,
        auto_approved=True,
        outcome="approved",
        reason="Time-window task auto-approved after timeout with strong evidence.",
    )
