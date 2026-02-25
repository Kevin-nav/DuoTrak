# PostHog Dashboard Spec

## Dashboard 1: Signup and Onboarding Funnel
Steps:
1. `firebase_auth_account_created`
2. `app_user_profile_created`
3. `onboarding_started`

Breakdowns:
- `auth_provider`
- `entry_point`
- device/platform

Primary KPI:
- Signup conversion (`step 2 / step 1`)

## Dashboard 2: Invitation Funnel
Steps:
1. `app_user_profile_created`
2. `invitation_created`
3. `invitation_viewed`
4. `invitation_accepted`

Breakdowns:
- `receiver_domain`
- inviter cohort week

Primary KPI:
- Invite acceptance conversion (`step 4 / step 2`)

## Dashboard 3: LLM Cost and Reliability
Charts:
- Total `cost_usd` by day
- Cost by `model` and `provider`
- `latency_ms` p50/p95 by `model`
- Failure rate (`llm_call_failed / total calls`) when available

Derived KPIs:
- Cost per generated plan
- Cost trend by workflow stage

