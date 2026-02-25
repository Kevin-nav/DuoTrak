# Goal Detail Weekly Instance View Design

**Date:** 2026-02-25  
**Status:** Approved

## Goal
Make Goal Detail task views accurate and execution-driven by using real `task_instances` data for weekly tracking, and add an `All Tasks` timeline tab for past and future visibility.

## Why This Change
- Current `This Week` grouping relies on `goal.tasks` and task `created_at`, which does not represent true scheduled daily outcomes.
- Users need a trustworthy week view (done vs not done) and a complete timeline with completion timestamps.

## Product Behavior
### This Week Tab
- Show current week day buckets (Mon-Sun).
- Populate from `task_instances` tied to the goal.
- Display real status per instance:
  - pending
  - completed / verified
  - pending-verification
  - missed / skipped
  - rejected
- Show timestamp metadata where relevant (completed/reviewed/submitted).

### All Tasks Tab
- New tab next to existing tabs.
- Timeline list of goal instances across time.
- Filter options:
  - All
  - Past
  - Today
  - Future
- Each row shows:
  - task name
  - scheduled date
  - status
  - completion/review timestamp if available.

### Full Plan and Settings
- Remain unchanged in function.

## Architecture
- Introduce goal-scoped execution query that joins `task_instances` with task metadata.
- Frontend goal-detail tabs consume this execution dataset rather than deriving week state from static task templates.
- Keep existing goal profile/settings save behavior unchanged.

## Data Contract (Execution View)
- `weekInstances`: instances within current week for selected goal.
- `allInstances`: paginated/sliced timeline for selected goal.
- `weekSummary`: aggregate counts by normalized status.

Per instance payload should include:
- `instance_id`
- `task_id`
- `goal_id`
- `task_name`
- `instance_date`
- `status`
- `completed_at?`
- `verification_submitted_at?`
- `verification_reviewed_at?`
- `verification_rejection_reason?`
- task metadata (`verification_mode`, `time_window_*`) where useful for UI.

## Notifications
- Existing verification and due/overdue events remain.
- Weekly summary and reminder sweeps should prefer `task_instances` outcomes when available.
- Include `goalId`, `taskId`, `instanceDate` in context payloads for deep-linking.

## Risks
- Potential mismatch if historical tasks exist without generated instances.
- Need careful fallback behavior during transition.

## Mitigations
- Fallback: if no instances exist for a goal/day, show empty state with clear message.
- Keep old task-template views only in Full Plan.
- Incremental rollout at Goal Detail level first, then broader sweep updates.

## Validation
- Manual checks:
  - week day counts match actual instance statuses.
  - all tasks filters return correct subsets.
  - status timestamps render correctly.
  - verification actions still route correctly.
  - notification links open relevant task/goal context.
- Lint and type checks on modified files.

## Non-goals
- No redesign of full planner model.
- No schema redesign for tasks/task_instances.
- No changes to journal/partner UI in this pass.
