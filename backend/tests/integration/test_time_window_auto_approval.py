from datetime import datetime, timedelta, timezone

from app.schemas.task import evaluate_task_verification_decision


def test_photo_requires_partner_review():
    now = datetime.now(timezone.utc)
    decision = evaluate_task_verification_decision(
        verification_mode="photo",
        auto_approval_policy="time_window_only",
        evidence_confidence=0.99,
        submitted_at=now - timedelta(hours=48),
        now=now,
    )

    assert decision.requires_partner_review is True
    assert decision.auto_approved is False
    assert decision.outcome == "pending_partner_review"


def test_voice_requires_partner_review():
    now = datetime.now(timezone.utc)
    decision = evaluate_task_verification_decision(
        verification_mode="voice",
        auto_approval_policy="time_window_only",
        evidence_confidence=0.99,
        submitted_at=now - timedelta(hours=48),
        now=now,
    )

    assert decision.requires_partner_review is True
    assert decision.auto_approved is False
    assert decision.outcome == "pending_partner_review"


def test_time_window_auto_approves_after_24h_with_strong_confidence():
    now = datetime.now(timezone.utc)
    decision = evaluate_task_verification_decision(
        verification_mode="time-window",
        auto_approval_policy="time_window_only",
        evidence_confidence=0.9,
        submitted_at=now - timedelta(hours=24, minutes=1),
        now=now,
        auto_approval_timeout_hours=24,
        auto_approval_min_confidence=0.85,
    )

    assert decision.requires_partner_review is False
    assert decision.auto_approved is True
    assert decision.outcome == "approved"


def test_time_window_does_not_auto_approve_before_timeout():
    now = datetime.now(timezone.utc)
    decision = evaluate_task_verification_decision(
        verification_mode="time-window",
        auto_approval_policy="time_window_only",
        evidence_confidence=0.95,
        submitted_at=now - timedelta(hours=8),
        now=now,
        auto_approval_timeout_hours=24,
        auto_approval_min_confidence=0.85,
    )

    assert decision.requires_partner_review is True
    assert decision.auto_approved is False
    assert decision.outcome == "pending_partner_review"


def test_time_window_does_not_auto_approve_when_confidence_below_threshold():
    now = datetime.now(timezone.utc)
    decision = evaluate_task_verification_decision(
        verification_mode="time-window",
        auto_approval_policy="time_window_only",
        evidence_confidence=0.84,
        submitted_at=now - timedelta(hours=30),
        now=now,
        auto_approval_timeout_hours=24,
        auto_approval_min_confidence=0.85,
    )

    assert decision.requires_partner_review is True
    assert decision.auto_approved is False
    assert decision.outcome == "pending_partner_review"
