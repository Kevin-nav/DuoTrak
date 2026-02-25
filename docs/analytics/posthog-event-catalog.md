# PostHog Event Catalog

## Canonical Events

### Auth and onboarding
- `firebase_auth_account_created`
- `app_user_profile_created`
- `onboarding_started`

Required properties:
- `platform` (`web`)
- `entry_point`
- `auth_provider` (when applicable)
- `user_id` (known-user events)

### Invitation funnel (Convex source of truth)
- `invitation_created`
- `invitation_viewed`
- `invitation_accepted`
- `invitation_withdrawn`
- `invitation_email_failed`

Required properties:
- `invitation_id`
- `sender_user_id`
- `receiver_domain` (where available)
- `delivery_status` (failure paths)
- `hours_to_accept` (`invitation_accepted`)

### Meaningful-action retention
- `invite_action_taken`
- `goal_created` (planned)
- `task_completed` (planned)
- `chat_message_sent` (planned)

### LLM economics (backend source of truth)
- `llm_call_completed`
- `llm_call_failed` (planned)
- `goal_plan_generated`

Required properties:
- `provider`
- `model`
- `input_tokens`
- `output_tokens`
- `latency_ms`
- `cost_usd`
- `workflow_stage`
- `success`
- `request_id` / `session_id`

## Identity Rules
- Anonymous until known user ID.
- Known-user identity set via `identify` after `app_user_profile_created`.
- `distinct_id` for backend/convex events should use stable app user ID.

