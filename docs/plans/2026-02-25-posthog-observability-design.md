# PostHog Observability Design

**Date:** 2026-02-25  
**Status:** Approved for implementation

## Goal
Implement unified observability across frontend, Convex, and backend using PostHog Cloud to measure:
- Signup and onboarding conversion
- Invitation lifecycle conversion
- Weekly retention
- LLM economics (cost by model, cost per goal, latency/failure trends)

## Scope
- Product analytics and funnel analytics
- Operational analytics for AI/LLM usage and spend
- Internal cost ledger in Convex for goal-level history (not user-visible)
- Metadata-only telemetry for LLM calls (no prompt/response text)

## Architecture
- **PostHog Cloud** is the analytics destination.
- **Backend (FastAPI)** is source of truth for LLM cost events.
- **Convex** is source of truth for invitation/business-state events.
- **Frontend (Next.js)** emits UX/session/onboarding interaction events.
- Shared event contract across all emitters:
  - `event_name`
  - `distinct_id`
  - `timestamp`
  - `properties` (flat and consistent keys)

## Identity Model
- Anonymous user tracked pre-auth.
- Alias anonymous identity to known app user after profile creation.
- Primary KPI signup event is `app_user_profile_created`.
- Supporting pre-signup events remain tracked:
  - `firebase_auth_account_created`
  - `onboarding_started`

## Canonical Event Taxonomy
### Auth and onboarding
- `firebase_auth_account_created`
- `app_user_profile_created` (primary signup KPI)
- `onboarding_started`

### Invitation lifecycle (Convex truth)
- `invitation_created`
- `invitation_viewed`
- `invitation_accepted`
- `invitation_withdrawn`
- `invitation_email_failed`

### Retention meaningful actions
- `goal_created`
- `task_completed`
- `chat_message_sent`
- `invite_action_taken`

### AI economics (backend truth)
- `llm_call_completed`
- `llm_call_failed`
- `goal_plan_generated`

## Required Properties
### Common
- `user_id`
- `platform`
- `app_version`
- `environment`
- `request_id` (where available)

### Invitation-specific
- `invitation_id`
- `sender_user_id`
- `receiver_domain`
- `delivery_status`
- `hours_to_accept` (for accepted invites)

### LLM-specific
- `goal_id`
- `provider`
- `model`
- `workflow_stage`
- `input_tokens`
- `output_tokens`
- `latency_ms`
- `cost_usd`
- `success`
- `error_type` (on failures)

## KPI Definitions
- **Signup rate:** `app_user_profile_created / firebase_auth_account_created`
- **Onboarding start rate:** `onboarding_started / app_user_profile_created`
- **Invite send rate:** `invitation_created / app_user_profile_created`
- **Invite acceptance rate:** `invitation_accepted / invitation_created`
- **Weekly retention (primary):** user performed >=1 meaningful action in week N
- **Cost per goal:** `sum(cost_usd by goal_id) / count(distinct goal_id)`
- **Cost per retained user:** `sum(cost_usd) / retained_users`

## PostHog LLM Analytics Alignment
All backend LLM call events include model/provider/token/cost/latency fields so PostHog can provide:
- Cost by model/provider over time
- Failure and latency by model
- Cost per goal and per workflow stage

## Internal Convex Cost Ledger
Add an internal table to persist:
- Per-call metadata references (no raw content)
- Per-goal cost rollups
- Reconciliation-friendly fields (request_id, source, timestamps)

This ledger supports:
- Auditability and debugging
- Goal creation history analysis
- Cross-checking PostHog analytics for data quality

## Privacy and Security
- Do not store prompt/response text.
- Do not emit secrets or PII beyond required identifiers.
- Use hashed/sanitized optional dimensions when needed.

## Rollout Strategy
1. Add shared analytics helpers for each runtime (frontend, Convex, backend).
2. Instrument critical funnel and cost events first.
3. Add Convex internal cost ledger.
4. Create PostHog funnels, retention reports, and LLM cost dashboards.
5. Validate event quality in staging before production rollout.

## Success Criteria
- End-to-end funnels are queryable in PostHog.
- Weekly retention and cohort trends are stable and explainable.
- LLM spend is visible by model/provider/goal with reconciled totals.
- No raw prompt/response payloads in telemetry.
