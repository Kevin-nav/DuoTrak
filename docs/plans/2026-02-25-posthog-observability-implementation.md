# PostHog Observability Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement unified PostHog analytics for signup/invitation funnels, weekly retention, and LLM economics with backend truth events plus Convex goal-cost history.

**Architecture:** Use a shared event contract across Next.js, Convex, and FastAPI. Emit canonical business events from system-of-record layers (Convex for invitation lifecycle, backend for LLM costs), and UX/session events from frontend. Persist an internal Convex LLM-cost ledger for goal-level history and reconciliation.

**Tech Stack:** Next.js 15 (TypeScript), Convex, FastAPI (Python), PostHog Cloud, Jest, Pytest.

---

### Task 1: Add shared frontend PostHog client and event wrapper

**Files:**
- Create: `src/lib/analytics/posthog-client.ts`
- Create: `src/lib/analytics/events.ts`
- Create: `src/lib/analytics/__tests__/events.test.ts`
- Modify: `src/app/(app)/layout.tsx`

**Step 1: Write the failing test**

```ts
import { buildEventPayload } from "../events";

test("buildEventPayload includes event name and normalized properties", () => {
  const payload = buildEventPayload("onboarding_started", { platform: "web" });
  expect(payload.event).toBe("onboarding_started");
  expect(payload.properties.platform).toBe("web");
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/lib/analytics/__tests__/events.test.ts`  
Expected: FAIL with module/function missing.

**Step 3: Write minimal implementation**

```ts
export function buildEventPayload(event: string, properties: Record<string, unknown> = {}) {
  return { event, properties };
}
```

Add PostHog init wrapper with safe no-op when key is missing.

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/lib/analytics/__tests__/events.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/lib/analytics/posthog-client.ts src/lib/analytics/events.ts src/lib/analytics/__tests__/events.test.ts src/app/(app)/layout.tsx
git commit -m "feat(analytics): add frontend posthog client and event wrapper"
```

### Task 2: Instrument frontend auth/onboarding funnel events

**Files:**
- Modify: `src/app/(auth)/signup/page.tsx`
- Modify: `src/components/auth/LoginForm.tsx`
- Modify: `src/app/(auth)/onboarding/page.tsx`
- Modify: `src/contexts/UserContext.tsx`
- Test: `src/components/__tests__/goal-creation-wizard.test.tsx` (ensure existing suite still passes)

**Step 1: Write the failing test**

Add a unit-level event emission assertion:

```ts
expect(trackEvent).toHaveBeenCalledWith("onboarding_started", expect.any(Object));
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- src/components/__tests__/goal-creation-wizard.test.tsx`  
Expected: FAIL due to missing analytics call mock or unmet expectation.

**Step 3: Write minimal implementation**

Emit:
- `firebase_auth_account_created` on auth creation success
- `app_user_profile_created` when app user record is confirmed
- `onboarding_started` when onboarding flow is entered

Ensure properties include `platform`, `entry_point`, `auth_provider`.

**Step 4: Run test to verify it passes**

Run: `npm run test -- src/components/__tests__/goal-creation-wizard.test.tsx`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/app/(auth)/signup/page.tsx src/components/auth/LoginForm.tsx src/app/(auth)/onboarding/page.tsx src/contexts/UserContext.tsx src/components/__tests__/goal-creation-wizard.test.tsx
git commit -m "feat(analytics): instrument auth and onboarding funnel events"
```

### Task 3: Add Convex PostHog sink + invitation lifecycle events

**Files:**
- Create: `convex/lib/posthog.ts`
- Modify: `convex/invitations.ts`
- Create: `convex/lib/__tests__/posthog.test.ts`

**Step 1: Write the failing test**

```ts
it("builds invitation_accepted event payload with invitation id", () => {
  const payload = buildConvexEvent("invitation_accepted", { invitation_id: "abc" });
  expect(payload.event).toBe("invitation_accepted");
  expect(payload.properties.invitation_id).toBe("abc");
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest convex/lib/__tests__/posthog.test.ts`  
Expected: FAIL with missing helper.

**Step 3: Write minimal implementation**

Add `capturePosthogEvent` helper in Convex and emit on:
- invitation create
- invitation viewed
- invitation accepted
- invitation withdrawn
- invitation email failed

Use sender/receiver/event ids and invitation timing properties.

**Step 4: Run test to verify it passes**

Run: `npx jest convex/lib/__tests__/posthog.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add convex/lib/posthog.ts convex/invitations.ts convex/lib/__tests__/posthog.test.ts
git commit -m "feat(convex-analytics): emit invitation lifecycle events to posthog"
```

### Task 4: Add Convex internal LLM cost ledger schema + mutations

**Files:**
- Modify: `convex/schema.ts`
- Create: `convex/llmCostLedger.ts`
- Create: `convex/lib/__tests__/llmCostLedger.test.ts`

**Step 1: Write the failing test**

```ts
it("aggregates total cost per goal", async () => {
  const total = aggregateGoalCost([
    { goalId: "g1", costUsd: 0.02 },
    { goalId: "g1", costUsd: 0.03 },
  ]);
  expect(total.g1).toBeCloseTo(0.05, 5);
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest convex/lib/__tests__/llmCostLedger.test.ts`  
Expected: FAIL with missing aggregator.

**Step 3: Write minimal implementation**

Create `llm_cost_events` table with metadata-only fields:
- `goal_id`, `user_id`, `provider`, `model`, `input_tokens`, `output_tokens`, `latency_ms`, `cost_usd`, `workflow_stage`, `success`, `request_id`, `created_at`

Create internal mutations:
- `recordLlmCall`
- `recordGoalPlanSummary`

**Step 4: Run test to verify it passes**

Run: `npx jest convex/lib/__tests__/llmCostLedger.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add convex/schema.ts convex/llmCostLedger.ts convex/lib/__tests__/llmCostLedger.test.ts
git commit -m "feat(convex): add internal llm cost ledger for goal history"
```

### Task 5: Backend PostHog client and LLM event emission

**Files:**
- Create: `backend/app/observability/posthog_client.py`
- Create: `backend/app/observability/events.py`
- Modify: `backend/app/core/logging_config.py`
- Modify: `backend/app/ai/langgraph_goal_pipeline.py`
- Modify: `backend/app/api/v1/endpoints/goal_creation.py`
- Test: `backend/tests/api/v1/test_goal_creation_contract.py`

**Step 1: Write the failing test**

```py
def test_emits_llm_call_completed_event(test_app):
    events = test_app.state.telemetry_events
    assert any(e["event_name"] == "llm_call_completed" for e in events)
```

**Step 2: Run test to verify it fails**

Run: `cd backend; pytest tests/api/v1/test_goal_creation_contract.py -v`  
Expected: FAIL because new event not emitted.

**Step 3: Write minimal implementation**

Add backend PostHog capture wrapper and emit:
- `llm_call_completed`
- `llm_call_failed`
- `goal_plan_generated`

Compute and include `cost_usd`, `latency_ms`, token counts, `provider`, `model`, `goal_id`, `workflow_stage`.

Also forward each LLM call summary to Convex internal mutation (`recordLlmCall`).

**Step 4: Run test to verify it passes**

Run: `cd backend; pytest tests/api/v1/test_goal_creation_contract.py -v`  
Expected: PASS.

**Step 5: Commit**

```bash
git add backend/app/observability/posthog_client.py backend/app/observability/events.py backend/app/core/logging_config.py backend/app/ai/langgraph_goal_pipeline.py backend/app/api/v1/endpoints/goal_creation.py backend/tests/api/v1/test_goal_creation_contract.py
git commit -m "feat(backend-analytics): emit llm cost events and goal summaries"
```

### Task 6: Add backend->Convex bridge for LLM ledger writes

**Files:**
- Create: `backend/app/observability/convex_ledger.py`
- Modify: `backend/app/core/config.py`
- Test: `backend/tests/unit/test_orchestrator_factory.py`

**Step 1: Write the failing test**

```py
def test_convex_ledger_payload_has_required_fields():
    payload = build_ledger_payload(goal_id="g1", model="gemini-2.5-pro", cost_usd=0.12)
    assert payload["goal_id"] == "g1"
    assert payload["cost_usd"] == 0.12
```

**Step 2: Run test to verify it fails**

Run: `cd backend; pytest tests/unit/test_orchestrator_factory.py -v`  
Expected: FAIL due to missing helper.

**Step 3: Write minimal implementation**

Create bridge client with retries and timeout to call Convex internal endpoint/mutation.
Feature-gate with env vars (`CONVEX_LEDGER_ENABLED`, endpoint, secret).

**Step 4: Run test to verify it passes**

Run: `cd backend; pytest tests/unit/test_orchestrator_factory.py -v`  
Expected: PASS.

**Step 5: Commit**

```bash
git add backend/app/observability/convex_ledger.py backend/app/core/config.py backend/tests/unit/test_orchestrator_factory.py
git commit -m "feat(backend): add convex ledger bridge for llm cost history"
```

### Task 7: Define retention and funnel dashboards in PostHog docs

**Files:**
- Create: `docs/analytics/posthog-event-catalog.md`
- Create: `docs/analytics/posthog-dashboard-spec.md`
- Create: `docs/analytics/posthog-retention-spec.md`

**Step 1: Write the failing test**

Create doc checklist entries and assert missing checklist in CI text check (if available).  
If no doc check exists, skip automated fail and perform manual checklist validation.

**Step 2: Run test/check**

Run: `if (Get-Command rg -ErrorAction SilentlyContinue) { rg -n "TBD|TODO" docs/analytics }`  
Expected: FAIL before docs complete (or no files found).

**Step 3: Write minimal implementation**

Document:
- Event names + required properties
- Funnel definitions and exact step order
- Retention definition (primary meaningful action + secondary lenses)
- LLM dashboards (cost by model/provider, cost per goal, fail/latency trends)

**Step 4: Re-run check**

Run: `if (Get-Command rg -ErrorAction SilentlyContinue) { rg -n "TBD|TODO" docs/analytics }`  
Expected: no matches.

**Step 5: Commit**

```bash
git add docs/analytics/posthog-event-catalog.md docs/analytics/posthog-dashboard-spec.md docs/analytics/posthog-retention-spec.md
git commit -m "docs(analytics): define posthog event catalog and dashboard specs"
```

### Task 8: End-to-end verification in staging

**Files:**
- Modify: `.env.example`
- Modify: `backend/.env.example`
- Create: `docs/analytics/posthog-verification-runbook.md`

**Step 1: Write failing verification checklist**

Add checklist with required events not yet observed.

**Step 2: Run verification**

Run:
- `npm run lint`
- `npm run test`
- `cd backend; pytest -q`

Expected: PASS for code/test health.

Then execute staging smoke flow:
1. Create auth account
2. Ensure app user profile creation
3. Start onboarding
4. Send invite
5. View invite
6. Accept invite
7. Trigger goal creation with LLM pipeline

Validate all events in PostHog Live Events and funnel insights.

**Step 3: Implement any minimal fixes from verification**

Patch missing event properties or identity joins only (no scope expansion).

**Step 4: Re-run verification**

Repeat smoke flow and confirm dashboard metrics populate.

**Step 5: Commit**

```bash
git add .env.example backend/.env.example docs/analytics/posthog-verification-runbook.md
git commit -m "chore(observability): add posthog env and staging verification runbook"
```

### Task 9: Final hardening and rollout gate

**Files:**
- Modify: `docs/plans/2026-02-25-posthog-observability-design.md`
- Create: `docs/analytics/posthog-rollout-checklist.md`

**Step 1: Write rollout gate checklist**

Checklist includes:
- Data quality
- Privacy review (no raw prompts/responses)
- Volume sampling/limits
- Alert thresholds

**Step 2: Run gate review**

Run: manual architecture review with event samples from PostHog + Convex ledger spot checks.

**Step 3: Minimal implementation updates**

Apply only release blockers discovered by gate.

**Step 4: Re-validate**

Confirm all checklist items are green.

**Step 5: Commit**

```bash
git add docs/plans/2026-02-25-posthog-observability-design.md docs/analytics/posthog-rollout-checklist.md
git commit -m "docs(observability): add rollout gate and readiness checklist"
```
