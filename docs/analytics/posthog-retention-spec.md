# PostHog Retention Spec

## Primary Retention Definition
Retained user in week N:
- User performed at least one meaningful action event in that week.

Meaningful actions:
- `invite_action_taken`
- `goal_created` (planned)
- `task_completed` (planned)
- `chat_message_sent` (planned)

## Secondary Retention Lenses
- Any app activity (`app_opened`)
- Invitation-only behavior (inviter lifecycle activity)

## Cohort Anchor
- Anchor cohort by `app_user_profile_created`.
- Show week 0 through week 8 retention.

## Required Filters
- Environment (`prod` vs `dev`)
- Platform (`web`)

