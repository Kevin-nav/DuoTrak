# Goal Creation Friction Reduction Design

**Date:** 2026-02-23  
**Status:** Approved

## Goal
Reduce friction in goal creation by shifting to a suggestion-first flow with AI-driven deep personalization, first-class duo accountability, and support for both habit-style and target-date goals.

## Product Scope
- Default to a `suggestion-first` creation experience.
- Launch with a lean, high-quality starter catalog (30-50 templates).
- Add common motivation suggestions and quick intent chips.
- Personalize selected templates with AI across title, motivation, task details, and accountability settings.
- Make partner accountability explicit and structured in goal setup.
- Support proof types: photo, voice note, time-window check-in, and hybrid modes.
- Treat habit goals as first-class (no required end date).
- Remove manual timezone input and auto-detect timezone for proof windows and reminders.

## UX Design
### Step 1: Choose a Goal Starter
- Show category chips and curated starter cards.
- Include search by intent and filters:
- goal type (`habit`, `target-date`, `milestone`)
- proof style (`photo`, `voice`, `time-window`, `hybrid`)
- Display badges such as `Popular with Duos` and `Strong accountability fit`.

### Step 2: Quick Personalization Inputs
- Keep this short to reduce form fatigue.
- Inputs:
- why this matters (suggested motivation chips + optional custom text)
- routine constraints (best times, hard constraints)
- accountability strictness preference

### Step 3: AI Personalized Draft
- Generate a full draft from template + user context:
- title
- motivation
- tasks and cadence
- proof mode per task
- partner review expectations
- time windows where relevant

### Step 4: Review and Adjust
- Inline editing for every generated section.
- Section-level regenerate controls:
- regenerate title
- regenerate motivation
- regenerate task plan
- regenerate accountability settings

### Step 5: Confirm and Create
- One-tap create after validation.
- Partner receives contextual notification describing their review role.

## Goal Types
### Habit Goal
- No required end date.
- Progress measured by consistency and streak behavior.
- Optional periodic review checkpoints (for example, every 30 days).

### Target-Date Goal
- Has a concrete deadline.
- Includes milestone/task schedule and deadline-aware accountability prompts.

### Milestone Goal
- Structured around milestone completion sequence.
- Deadline optional unless explicitly configured.

## Duo Accountability Model
- Accountability is duo-native by default.
- Task-level proof requirements:
- `photo_proof` (partner reviews)
- `voice_proof` (partner reviews)
- `time_window_checkin` (must check in inside configured local window)
- `hybrid` (window + media proof)
- Partner role defaults:
- reviewer assignment
- review SLA window (`same-day`, `24h`, `48h`)
- escalation/reminder policy when review is pending

## Timezone Strategy (Core Behavior)
- Do not ask users to pick timezone during goal setup.
- Auto-detect timezone on client using `Intl.DateTimeFormat().resolvedOptions().timeZone`.
- Persist timezone in user profile/session metadata.
- Validate and evaluate time-window proofs in backend using persisted timezone.
- Schedule reminders and check-in windows server-side with timezone-aware logic.
- Handle DST transitions in backend logic to avoid invalid proof evaluation.

## Data Model Impact
- Goal schema must support:
- `goal_type` (`habit`, `target_date`, `milestone`)
- optional end date (required only for target-date goals)
- Task schema must support:
- `proof_mode`
- `window_start_local`
- `window_duration_minutes`
- `requires_partner_review`
- Proof submission lifecycle:
- `submitted`, `approved`, `rejected`, `expired`
- Timezone metadata:
- persisted IANA timezone
- timezone versioning/audit for reliable historical validation

## AI Personalization Pipeline
- Inputs:
- selected template
- motivation/context chips and optional user text
- routine constraints
- accountability strictness
- existing behavior signals (if available)
- Outputs:
- personalized title and motivation
- realistic execution plan and cadence
- per-task proof mode and windows
- partner check cadence and SLA defaults
- Guardrails:
- enforce realistic workloads
- reject contradictory schedule windows
- avoid excessive daily task volume
- keep user intent intact during rewrites

## Error Handling
- `timezone_unavailable`: fallback to last known timezone or UTC with explicit user notice.
- `invalid_time_window`: reject impossible windows and provide correction hints.
- `partner_required_for_review_goal`: enforce duo requirements for partner-validated proofs.
- `ai_draft_generation_failed`: preserve template baseline and allow manual creation.
- `proof_mode_not_supported`: block unsupported proof mode combinations.

## Testing Strategy
- Contract tests for goal type validation and optional end-date rules.
- Timezone and DST tests for window validation logic.
- Proof lifecycle tests across all proof modes.
- Partner review and SLA behavior tests.
- AI draft schema validation tests (shape + constraints).
- UX tests for suggestion-first flow and section-regenerate behavior.

## Rollout Strategy
### Phase 1
- Suggestion-first UX and lean catalog.
- Habit/target-date/milestone model updates.
- Timezone auto-detect and backend window validation.

### Phase 2
- AI deep personalization and section-level regeneration.
- Partner accountability SLAs and escalation behavior.

### Phase 3
- Catalog expansion and ranking improvements based on usage.
- Advanced recommendations from historical completion patterns.

## Non-Goals (v1)
- Large long-tail template marketplace.
- Free-form conversational setup as primary creation flow.
- Multi-partner accountability models beyond duo.
