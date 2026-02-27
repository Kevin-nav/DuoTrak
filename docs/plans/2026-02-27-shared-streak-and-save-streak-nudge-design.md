# Shared Duo Streak + Save-Streak Nudge Design

Date: 2026-02-27

## Decisions
- Streak model: Weighted Duo.
- Grace policy: 1 grace day per rolling 7-day window.
- Grace scope: Per person.

## Goals
- Dashboard big streak number represents shared partner streak, not individual streak.
- Shared streak should be driven by real product activity (tasks, journal, goals, verification actions).
- If one partner has acted and the other has not, send an engaging "save your streak" nudge email.

## Data Model
- Users:
  - `last_streak_activity_day` (local day key)
  - `last_activity_at`
- Partnerships:
  - `shared_current_streak`
  - `shared_longest_streak`
  - `last_shared_cycle_key`
  - `last_shared_user1_day`
  - `last_shared_user2_day`
  - `user1_last_activity_day_local`
  - `user2_last_activity_day_local`
  - `user1_grace_last_used_at`
  - `user2_grace_last_used_at`
  - `user1_last_streak_nudge_day`
  - `user2_last_streak_nudge_day`
  - `last_shared_activity_at`

## Activity + Streak Flow
1. Any qualifying user action records user activity in local timezone day key.
2. If user is in active partnership, partnership activity fields are updated.
3. Shared streak increments only when both users are active for their current local day pair.
4. Consecutive shared day pair increments streak.
5. If exactly one user has a one-day gap and that user's grace is available (>= 7 days since last use), consume grace and preserve increment.
6. Otherwise shared streak resets to 1 upon next completed shared day pair.

## Nudge Email Flow
- Hourly sweep over active partnerships.
- If one partner has completed today's local action and the other has not:
  - Send `shared_streak_save_needed` notification/email to the missing partner.
  - Enforce one nudge per recipient per local day using partnership day markers.
- Email tone is urgent but playful and relationship-oriented.

## Dashboard UX
- Dashboard streak value sourced from `shared_current_streak`.
- Label changed to "Shared Streak".
- Existing What's New card explains timezone-smart streak updates.

## Safety + Dedupe
- Streak nudge deduped by per-user local day on partnership record.
- Existing notification delivery + preference pipeline reused.

## Out of Scope
- Historical full backfill of shared streak from old events.
- Multi-grace customization per partnership.
