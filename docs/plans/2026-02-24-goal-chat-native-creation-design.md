# Goal Chat-Native Creation Design

**Date:** 2026-02-24
**Status:** Approved

## Goal
Build a new primary goal-creation system where users create goals through an AI-led chat interview that converts intent into structured, accountable plans with mandatory partner accountability.

## Product Scope
- Launch a full-page chat-first creation experience as the new primary flow.
- Keep the existing wizard available only as temporary fallback during validation.
- Add an in-app entry point to the new flow from existing goals surfaces.
- Use strict plan validation before goal creation.
- Make accountability partner requirements mandatory for all tasks.

## Core Decisions
- Control model: AI-led interview.
- Validation mode: strict required fields before finalize.
- Personalization: behavioral inference plus short self-profile questions.
- Creation flow: review gate required before save.
- Partner model: mandatory partner accountability metadata on every task.

## Architecture
### Frontend
- New route: `/goals/new-ai`.
- New page-level chat experience with:
  - assistant conversation thread
  - user composer
  - live plan preview panel
  - missing requirements checklist
  - review-and-confirm gate before create
- Entry points:
  - goals page CTA/button
  - optional navbar quick action if enabled

### Backend
- New API group: `/api/v1/goal-chat`.
- Endpoints:
  - `POST /sessions`
  - `POST /{session_id}/turns`
  - `POST /{session_id}/finalize`
  - `POST /{session_id}/create`
- New orchestration modules:
  - `conversation_manager`
  - `profile_engine`
  - `goal_strategy_engine`
  - `plan_composer`

### Storage
- Reuse the existing session-store pattern for TTL session state.
- Persist per-session:
  - extracted facts
  - missing required slots
  - personality profile
  - draft plan
  - turn history and decision trace

## Conversation Flow
1. Start session
- Load behavioral signals from current goals/performance.
- Ask 3 short profile questions.

2. AI interview phases
- Intent and outcome.
- Goal type resolution (`habit`, `milestone`, `target-date`).
- Required planning slots.
- Cadence and task synthesis.
- Live preview with assumptions.

3. Finalize gate
- Finalize unavailable until all required slots are complete.
- Show review panel with goal summary, schedule, tasks, accountability rules.

4. Create
- Persist goal and tasks only after explicit user confirmation.

## Required Slot Rules
### Always required
- Goal intent and success definition.
- Availability/time budget.
- Accountability mode.
- Actionable task list.
- Partner connected and task-level partner review rules.

### Conditional
- `target-date`: deadline required.
- `habit` and `milestone`: deadline optional; review cycle required.

## Partner Accountability Rules
- Creation blocked without active partner relationship.
- Every task must have:
  - `requires_partner_review: true`
  - review SLA (same-day or 24h)
  - reminder/escalation fallback
- Solo-only task generation is not allowed in this flow.

## Personalization Strategy
- Behavioral-first signals:
  - completion consistency
  - streak resilience
  - missed-day recovery patterns
  - prior accountability behavior
- Add 3 self-profile answers in chat.
- Merge both inputs into a personality profile used to tune:
  - cadence intensity
  - task sizing
  - accountability prompts
  - fallback/recovery plans

## Error Handling
- `partner_missing`: block and route to partner setup.
- `plan_incomplete`: list missing slots and continue interview.
- `schedule_overload`: propose scaled cadence and request confirmation.
- `invalid_goal_type_rules`: enforce conditional deadline/review logic.
- `session_expired`: restore if possible or restart session.

## Testing Strategy
- Backend contract tests for all goal-chat endpoints.
- Unit tests for slot tracking, goal-type rule enforcement, and partner-accountability requirements.
- Frontend interaction tests for:
  - chat turn progression
  - finalize gate states
  - review confirmation
- Integration tests for full create flow from `/goals/new-ai` to persisted goal.

## Rollout Plan
### Phase 1
- Implement chat APIs, minimal chat UI, and review gate.
- Add goals page entry point.

### Phase 2
- Add profile engine with behavioral plus self-profile merge.
- Tune strategy engine for goal-type-specific cadence/task patterns.

### Phase 3
- Promote new flow as default and retire old wizard after validation.

## Non-Goals (Initial)
- Multi-partner accountability.
- Post-creation autonomous coaching in this same feature scope.
- Rebuilding existing chat product surfaces outside goal creation.
