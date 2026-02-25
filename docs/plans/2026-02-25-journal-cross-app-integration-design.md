# Journal Cross-App Integration Design

**Date:** 2026-02-25  
**Status:** Approved

## Goal
Connect Journal to Dashboard, Partner, and Notifications so entries drive daily behavior, partner collaboration, and high-touch accountability loops.

## Scope
- Keep existing Journal UI foundation and search.
- Add cross-surface functionality using an event-driven integration layer.
- Add lightweight interactions on shared entries: reactions and short comments.
- Remove realtime thread architecture from v1 to reduce complexity.

## Product Behavior
### Dashboard
- Add `Journal Pulse` card with:
  - private journal streak
  - shared entries this week
  - pending response count
- Add `Partner Reflections` widget showing recent partner shared entries.
- Add quick actions:
  - Write private entry
  - Share reflection
  - Respond to partner entry

### Partner Page
- Extend activity feed with journal activity items.
- Add lightweight shared-entry interaction controls:
  - reaction chips
  - short inline comment
- Keep deep-link to full Journal entry view for full reading/editing context.

### Journal Page
- Shared entries get interaction affordances (reaction/comment summary + open context CTA).
- Private entry share flow remains, but confirms partner notification outcome.

### Notifications (High-touch Mode)
- Instant events:
  - shared entry posted
  - partner reacted
  - partner commented
- Proactive reminders:
  - no share today
  - no response to partner entry
  - streak at risk
- Deep-link notifications to the exact Journal context.
- Apply cooldown + dedupe windows to prevent spam.

## Architecture
- Use event-driven integration via `journal_events` and `journal_interactions`.
- Keep existing `journal_entries` and `journal_shares` as primary authoring/share records.
- Dashboard and Partner page consume aggregate Journal queries instead of duplicating client-side logic.
- Notification dispatch continues through `internal.notifications.dispatchEvent` with new journal event types.

## Data Model Extensions
- `journal_interactions`
  - `entry_id`
  - `user_id`
  - `type` (`reaction` | `comment`)
  - `reaction_key?`
  - `comment_text?`
  - `created_at`
  - `updated_at`

- `journal_events`
  - `event_type`
  - `entry_id`
  - `actor_user_id`
  - `target_user_id?`
  - `partnership_id?`
  - `metadata_json?`
  - `created_at`

- `journal_entries` (optional denormalized fields for speed)
  - `reaction_count`
  - `comment_count`
  - `last_interaction_at`

## API Surface (Convex)
- `journal.addReaction(entryId, reactionKey)`
- `journal.removeReaction(entryId, reactionKey)`
- `journal.addComment(entryId, commentText)`
- `journal.getEntryInteractions(entryId)`
- `journal.getDashboardJournalPulse()`
- `journal.getPartnerJournalActivity(limit, cursor?)`
- `journal.getJournalAlerts()`

## Notification Event Types
Add support in notification dispatch for:
- `journal_entry_reacted`
- `journal_entry_commented`
- `journal_streak_risk`
- `journal_partner_silence_nudge`

Each event should include dedupe/cooldown checks by `(recipient, eventType, entryId)` where relevant.

## Error Handling
- Permission failures: shared interaction access restricted to active partnership members.
- Input validation:
  - comment length bounds
  - valid reaction key set
- Notification fallback: if dispatch fails, do not block journal interaction mutation success.

## Testing Strategy
- Convex authorization tests for shared-only interaction permissions.
- Mutation tests for reaction toggle/comment create/event writes.
- Notification tests for dedupe/cooldown behavior.
- UI tests for:
  - Dashboard journal widgets
  - Partner activity journal interactions
  - Notification deep-link routing
- Regression tests to ensure Journal search/share flows remain stable.

## Rollout Plan
### Phase 1
- Schema additions (`journal_interactions`, `journal_events`)
- Backend mutations/queries for interactions + aggregates
- Notification event extensions and dedupe guardrails

### Phase 2
- Journal page interaction UI
- Dashboard `Journal Pulse` and `Partner Reflections`
- Partner activity journal integration

### Phase 3
- Reminder threshold tuning and UX polish
- Performance optimization for aggregate queries
- Documentation and QA hardening

## Non-goals (for this release)
- Realtime collaboration thread model
- Rich long-thread discussion inside Journal cards
- Multi-member shared journal collaboration
