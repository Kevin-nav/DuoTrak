# Journal + Progress Calendar and Workspace Tasks Design

**Date:** 2026-02-27  
**Status:** Approved

## Goal
Add calendar support to the Journal and Progress experiences so users can manage and review time-based activity in a Notion-like workflow. The Journal must support workspace-created todos with partner assignment and show both todos and journal entries on a unified calendar. The Progress page must add a historical streak calendar showing both partners' daily streak status.

## Scope
- Journal unified calendar view with filters.
- Workspace task blocks in journal pages (with assignee and due date).
- Calendar aggregation query for journal entries + workspace tasks.
- Progress streak history calendar for self and partner.
- Mobile-first UX for both pages.

Out of scope for this phase:
- Recurring task rules.
- Drag-and-drop rescheduling.
- External calendar sync (Google/Apple/Notion integrations).
- Reminder/notification orchestration beyond current events.

## Product Decisions (Validated)
- Journal uses a unified calendar model (entries + tasks).
- Todo creation lives inside workspace pages via task blocks.
- Progress day cells primarily represent streak status.
- Mobile Journal defaults to agenda-first with month toggle.

## UX Design

### Journal
1. Add a calendar surface in Journal with month navigation and day selection.
2. Provide filter chips: `All`, `Entries`, `Todos`, `Assigned to me`, `Shared`, `Private`.
3. Show normalized day items:
- Journal entries (private/shared).
- Workspace tasks (personal/shared/assigned).
4. Day interactions:
- Desktop: side panel details.
- Mobile: bottom sheet details.
5. Mobile default mode:
- Agenda-first list (Today + Upcoming).
- Toggle to Month view.

### Workspace Task Blocks
1. Extend workspace page block model with a `task` block.
2. Task block fields:
- Title
- Optional notes
- Due date
- Status (`todo`/`done`)
- Assignee (`self` or partner in shared space)
3. Assignment rules:
- Shared space: assign to either partner.
- Private space: assign to owner only.

### Progress
1. Add `Streak History Calendar` section to Progress page.
2. Day cell encodes two status tracks:
- User streak state
- Partner streak state (when partner comparison enabled)
3. Day drilldown details:
- Completed tasks / total tasks
- Day streak continuity outcome
4. Presets: `30d`, `90d`, `1y`.
5. Mobile drilldown uses bottom sheet.

## Architecture

### Frontend
- Journal page remains composition root; add calendar tab/panel and shared state for view mode, filters, and selected day.
- Journal page editor integrates task block creation and editing.
- Progress page adds a new calendar card/section fed by a dedicated streak-history query.

### Backend
- Add dedicated `journal_tasks` table for durable workspace todo entities.
- Add journal calendar aggregation query that returns normalized items for date windows.
- Add progress streak-history query that computes day-level statuses for user and partner.

## Data Model Changes

### New Table: `journal_tasks`
Required fields:
- `space_id: Id<"journal_spaces">`
- `page_id: Id<"journal_pages">`
- `title: string`
- `notes?: string`
- `due_date: number`
- `status: string` (`todo` | `done` | `archived`)
- `assigned_to_user_id: Id<"users">`
- `created_by: Id<"users">`
- `created_at: number`
- `updated_at: number`
- Optional linkage field for block-level sync: `block_ref?: string`

Indexes:
- `by_space_due_date` => `["space_id", "due_date"]`
- `by_assignee_due_date` => `["assigned_to_user_id", "due_date"]`
- `by_page_updated` => `["page_id", "updated_at"]`

## API Design

### Journal APIs
- `createJournalTask`
- `updateJournalTask`
- `toggleJournalTaskStatus`
- `deleteJournalTask` (soft archive)
- `listJournalCalendarItems`

`listJournalCalendarItems` response shape (normalized):
- `id`
- `itemType` (`entry` | `task`)
- `title`
- `date`
- `spaceType` (`shared` | `private`)
- `assigneeUserId?`
- `status?`
- `authorName`

### Progress APIs
- `getStreakHistoryCalendar(startDate, endDate, includePartner)`

Response includes per-day payload:
- `date`
- `userStatus` (`done` | `missed` | `no_plan`)
- `partnerStatus?`
- `userCompleted`
- `userTotal`
- `partnerCompleted?`
- `partnerTotal?`

## Permissions and Validation
- Reuse journal space access controls for all task mutations and queries.
- Reject assigning tasks to non-partner users.
- Reject partner assignment in private space.
- Enforce date-window limits for calendar aggregation queries.
- Validate that task page belongs to the same accessible space.

## Data Flow

### Journal Calendar
1. User picks month/range.
2. Client calls `listJournalCalendarItems` with filters.
3. Backend resolves accessible spaces and aggregates entries + tasks.
4. Client renders day cells and day detail panel/sheet.

### Progress Streak Calendar
1. User chooses preset (`30d`/`90d`/`1y`) and partner toggle.
2. Client calls `getStreakHistoryCalendar`.
3. Backend computes day statuses from `task_instances`.
4. Client renders dual-status cells and drilldown details.

## Error Handling
- Missing partner: render informational fallback and hide partner assignment options.
- No data in range: show empty-state guidance with CTA to change range.
- Partial partner data: render warning banner and user-only values.
- Query failures: existing retry affordances remain; calendar sections should preserve last stable data when refreshing.

## Testing Strategy

### Backend
- Unit/integration tests for `journal_tasks` CRUD permission boundaries.
- Aggregation tests for journal calendar item normalization and filtering.
- Progress streak-history tests for status computation across date boundaries.

### Frontend
- Component tests for calendar filters, selected-day detail state, and mobile agenda/month toggles.
- Interaction tests for task assignment constraints by space type.
- Progress day-cell rendering tests for dual user/partner states.

### Regression
- Verify existing journal entry CRUD/search remains unchanged.
- Verify existing progress KPIs/charts remain unchanged.

## Rollout Notes
- Ship behind progressive UI integration: add calendar sections without removing existing journal/progress functionality.
- If needed, start with read-only calendar rendering, then enable task mutations once stable.

## Success Criteria
- Users can create workspace tasks, assign tasks to partner in shared space, and see those tasks with journal entries in Journal calendar.
- Users can inspect historical streak day status for self and partner in Progress calendar.
- Mobile UX remains fully usable for creation, filtering, and day drilldowns.
