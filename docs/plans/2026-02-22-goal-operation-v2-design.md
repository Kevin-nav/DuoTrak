# Goal Operation V2 Design

**Date:** 2026-02-22  
**Status:** Approved

## Objective
Reframe goal creation and execution into a balanced-but-adherence-leaning system that improves long-term consistency while preventing schedule overload, with partner-in-the-loop verification and outcome-driven personalization.

## Locked Decisions
- Planning strategy: balanced mode, weighted toward sticking to the plan.
- Overload policy: soft cap up to +10% only when adherence gain is materially higher.
- Personalization memory: outcome signals only, rolling 90 days.
- Transparency: high but concise and supportive (not surveillance-feeling).
- Model policy: Gemini 3 Flash only (no Pro model).
- Task verification modes: photo, voice, time-window.
- Partner-loop approval: required by default.
- Auto-approval: time-window tasks only, after 24h timeout, confidence >= 0.85.

## End-to-End Flow
1. User creates goal with low-friction intake (goal, motivation, availability, commitment, deadline, check-in style).
2. System retrieves 90-day outcome profile from Pinecone.
3. Gemini 3 Flash generates a draft plan with per-task cadence, timing, and verification-mode suggestions.
4. Deterministic verifier scores schedule impact (fit, overload, conflicts).
5. If needed, system produces a scaled alternative plan.
6. UI recommends the best consistency plan and shows short "why" reasons.
7. User selects recommended or original plan.
8. During execution, user submits evidence per task verification mode.
9. Partner reviews and approves/rejects in partner-loop goals.
10. For eligible time-window tasks, auto-approve can trigger after timeout if confidence threshold is met.
11. Completion outcomes are written back and influence future planning.

## Architecture
- Goal Intake Service: captures planning inputs.
- Personalization Retriever (Pinecone): outcome-based user behavior profile over 90 days.
- AI Plan Generator: Gemini 3 Flash orchestration with strict schema targets.
- Schedule Impact Verifier: deterministic scoring and constraint checks.
- Plan Ranker: compares original vs scaled alternatives.
- Partner Verification Engine: evidence handling, approval lifecycle, timeout policy.
- Outcome Feedback Writer: logs actual behavior for future personalization.

## Data Contract Additions
### Goal-level
- adherence_weight
- schedule_soft_cap_percent (10)
- schedule_impact
  - capacity_minutes
  - projected_load_minutes
  - overload_percent
  - conflict_flags
  - fit_band
- decision_trace (2-3 concise user-facing reasons)

### Task-level
- verification_mode: photo | voice | time-window
- verification_mode_reason
- verification_confidence
- time_window_start
- time_window_end
- partner_required
- auto_approval_policy: time_window_only
- auto_approval_timeout_hours: 24
- auto_approval_min_confidence: 0.85

## Verification Rules
- Photo: partner/manual review path required.
- Voice: partner/manual review path required.
- Time-window: eligibility for auto-approval only if:
  - evidence is within configured window,
  - confidence >= 0.85,
  - no partner response for 24h.
- Partner dispute path remains available for all modes.

## Guardrails
- No silent full personalization.
- No auto-approval for photo/voice.
- Reject non-conforming AI output via schema + deterministic validation.
- If verification confidence is low, force manual partner review.
- Keep explanation language supportive and minimal to avoid surveillance tone.

## Success Metrics
- plan_accept_rate
- 7d_completion_rate
- 30d_completion_rate
- overload_warning_rate
- partner_review_latency
- auto_approval_rate_time_window_only

## Risks and Mitigations
- Risk: AI over-prescribes workload.
  - Mitigation: deterministic soft-cap enforcement and scaled alternative generation.
- Risk: Partner bottlenecks.
  - Mitigation: timeout policy for eligible time-window tasks only.
- Risk: User distrust in personalization.
  - Mitigation: concise "why" messaging and outcome-only data policy.
