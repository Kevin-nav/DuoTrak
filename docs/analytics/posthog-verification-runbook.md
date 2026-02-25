# PostHog Verification Runbook

## Pre-check
- Set frontend env:
  - `NEXT_PUBLIC_POSTHOG_KEY`
  - `NEXT_PUBLIC_POSTHOG_HOST`
- Set backend env:
  - `POSTHOG_API_KEY`
  - `POSTHOG_HOST`
- Optional Convex ledger bridge:
  - `CONVEX_LEDGER_ENDPOINT`
  - `CONVEX_LEDGER_SECRET`

## Local Validation
1. Run `npm run lint`.
2. Run `npm run test -- --runInBand src/lib/analytics/__tests__/events.test.ts convex/lib/__tests__/posthog.test.ts convex/lib/__tests__/llmCostLedger.test.ts`.
3. Run backend tests with environment that has `pytest` installed.

## Staging Smoke Flow
1. Create account via email and verify `firebase_auth_account_created`.
2. Confirm user profile exists and verify `app_user_profile_created`.
3. Enter onboarding and verify `onboarding_started`.
4. Send invite and verify `invitation_created`.
5. Open invite link and verify `invitation_viewed`.
6. Accept invite and verify `invitation_accepted`.
7. Generate goal plan and verify:
   - `goal_plan_generated`
   - `llm_call_completed`

## Data Quality Checks
- `distinct_id` is stable and user-linked.
- Mandatory properties exist for each event family.
- No raw prompt/response payloads in PostHog or Convex ledger.

