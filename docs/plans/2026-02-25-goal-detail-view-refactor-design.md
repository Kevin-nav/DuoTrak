# Goal Detail View Refactor Design

**Date:** 2026-02-25  
**Status:** Approved

## Goal
Refactor `goal-detail-view.tsx` from one large component into smaller focused modules so future logic changes are easier and safer.

## Scope
- Split UI sections and state logic into dedicated files.
- Preserve behavior and visual output.
- Allow small safe cleanup (shared helpers/subcomponents) without business logic changes.

## Current Problem
- `src/components/goal-detail-view.tsx` is ~636 lines and mixes:
  - orchestration
  - state management
  - helper functions
  - three tab layouts
  - modal and overlay logic
- This increases regression risk and slows editing.

## Proposed Structure
- `src/components/goal-detail/GoalDetailView.tsx` (orchestrator)
- `src/components/goal-detail/types.ts`
- `src/components/goal-detail/utils.ts`
- `src/components/goal-detail/useGoalDetailState.ts`
- `src/components/goal-detail/GoalHeaderCard.tsx`
- `src/components/goal-detail/GoalTabs.tsx`
- `src/components/goal-detail/ThisWeekTab.tsx`
- `src/components/goal-detail/FullPlanTab.tsx`
- `src/components/goal-detail/GoalSettingsTab.tsx`
- `src/components/goal-detail/CelebrationOverlay.tsx`
- `src/components/goal-detail/index.ts`

Compatibility layer:
- `src/components/goal-detail-view.tsx` remains import target and re-exports the new component.

## Data and Control Flow
- `GoalDetailView.tsx` receives `goal` and composes sections.
- `useGoalDetailState.ts` manages:
  - active tab
  - proof modal state
  - profile draft state
  - milestone collapse state
  - save and task-action handlers
- Tab components receive minimal props and remain presentational.
- Modal and celebration rendering remains in orchestrator boundary.

## Safe Cleanup Rules
- Allowed:
  - move duplicated utility snippets into local helper functions/components
  - normalize small repeated badge/row structures
- Not allowed:
  - changing goal/task business rules
  - changing API contracts or persistence behavior
  - redesigning UI patterns

## Vercel React Best-Practice Alignment
- Keep helper functions module-local and pure where possible.
- Reduce re-render churn by passing stable, minimal props.
- Avoid unnecessary nested component definitions inside render scope.

## Risks and Mitigations
- Risk: subtle behavior drift while splitting handlers.
  - Mitigation: migrate in small sections and preserve existing prop wiring.
- Risk: import breakage in existing routes/components.
  - Mitigation: keep `goal-detail-view.tsx` compatibility wrapper.
- Risk: mobile/desktop visual drift.
  - Mitigation: preserve classNames first, only minimal safe cleanup.

## Validation Plan
- Lint pass.
- Manual checks:
  - tab switching
  - task action button behavior by verification mode
  - proof modal open/submit/close
  - settings save interaction
  - full-plan milestone collapse and expand
  - celebration overlay trigger and timeout

## Non-goals
- No business logic changes.
- No backend changes.
- No design overhaul.
