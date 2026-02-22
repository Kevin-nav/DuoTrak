# Backend Consolidation + Mobile Readiness Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Stabilize the current hybrid backend (Convex + Python), replace fragile CrewAI orchestration, and prepare a shared web/mobile architecture without a full backend rewrite.

**Architecture:** Keep Convex (TypeScript) as the source of truth for app-domain data and real-time features. Keep Python as an AI worker behind a narrow API boundary. Replace CrewAI with a deterministic, typed orchestration path (LangGraph-first) with feature flags and shadow mode before cutover.

**Tech Stack:** Convex (TS), Next.js, React Native/Expo (planned), FastAPI, Redis, Gemini, Pinecone, LangGraph, Zod, Pydantic, pytest, Jest.

---

### Task 1: Create Canonical Goal-Plan Contract (Single Source of Truth)

**Files:**
- Create: `packages/contracts/src/goalPlan.ts`
- Create: `packages/contracts/src/goalCreation.ts`
- Create: `packages/contracts/package.json`
- Modify: `src/schemas/goal.ts`
- Modify: `backend/app/schemas/agent_crew.py`
- Test: `src/schemas/__tests__/goalPlan.contract.test.ts`
- Test: `backend/tests/contracts/test_goal_plan_contract.py`

**Step 1: Write the failing tests**

```ts
import { GoalPlanResponseSchema } from "@duotrak/contracts/goalCreation";
import sample from "../fixtures/goalPlanResponse.sample.json";

test("goal plan response matches canonical schema", () => {
  expect(() => GoalPlanResponseSchema.parse(sample)).not.toThrow();
});
```

```python
from app.schemas.agent_crew import GoalPlanResponse
import json

def test_goal_plan_response_matches_canonical_fixture():
    fixture = json.load(open("tests/fixtures/goal_plan_response.sample.json"))
    GoalPlanResponse.model_validate(fixture)
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- src/schemas/__tests__/goalPlan.contract.test.ts`  
Expected: FAIL (schema mismatch)

Run: `pytest backend/tests/contracts/test_goal_plan_contract.py -v`  
Expected: FAIL (field mismatch)

**Step 3: Implement minimal contract alignment**

- Move V3 goal schemas from `src/schemas/goal.ts` into `packages/contracts`.
- Update frontend to import from `@duotrak/contracts`.
- Update backend `GoalPlanResponse`/`DuotrakGoalPlan` fields to match the canonical contract exactly.

**Step 4: Run tests to verify they pass**

Run: `npm test -- src/schemas/__tests__/goalPlan.contract.test.ts`  
Expected: PASS

Run: `pytest backend/tests/contracts/test_goal_plan_contract.py -v`  
Expected: PASS

**Step 5: Commit**

```bash
git add packages/contracts src/schemas/goal.ts backend/app/schemas/agent_crew.py backend/tests/contracts
git commit -m "feat: add canonical goal-plan contract shared across web and python"
```

### Task 2: Fix Goal API Wiring and Response Serialization

**Files:**
- Create: `backend/app/services/goal_plan_adapter.py`
- Modify: `backend/app/api/v1/endpoints/goal_creation.py`
- Test: `backend/tests/api/v1/test_goal_creation_contract.py`

**Step 1: Write the failing test**

```python
async def test_create_goal_plan_returns_contract_shape(authed_client, seeded_session):
    response = await authed_client.post(f"/api/v1/goal-creation/{seeded_session}/plan", json={
        "user_id": "user-1",
        "answers": {"q1": "a1"}
    })
    assert response.status_code == 200
    body = response.json()
    assert "goal_plan" in body
    assert "partner_integration" in body
```

**Step 2: Run test to verify it fails**

Run: `pytest backend/tests/api/v1/test_goal_creation_contract.py -v`  
Expected: FAIL

**Step 3: Write minimal implementation**

- Add adapter to normalize orchestrator outputs into canonical schema.
- Ensure `goal_creation.py` only returns adapted data.
- Remove legacy key assumptions (`final_plan`, `internal_score` style drift).

**Step 4: Run test to verify it passes**

Run: `pytest backend/tests/api/v1/test_goal_creation_contract.py -v`  
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/services/goal_plan_adapter.py backend/app/api/v1/endpoints/goal_creation.py backend/tests/api/v1/test_goal_creation_contract.py
git commit -m "fix: normalize goal creation response through adapter"
```

### Task 3: Replace In-Memory Session State with Redis Session Store

**Files:**
- Create: `backend/app/services/goal_creation_session_store.py`
- Modify: `backend/app/services/duotrak_crew_orchestrator.py`
- Modify: `backend/app/api/v1/endpoints/goal_creation.py`
- Test: `backend/tests/unit/test_goal_creation_session_store.py`
- Test: `backend/tests/api/v1/test_goal_creation_session_expiry.py`

**Step 1: Write the failing tests**

```python
async def test_session_survives_new_orchestrator_instance(redis_client):
    store = GoalCreationSessionStore(redis_client)
    await store.put("s1", {"user_id": "u1"}, ttl_seconds=900)
    store2 = GoalCreationSessionStore(redis_client)
    assert await store2.get("s1")["user_id"] == "u1"
```

```python
async def test_missing_session_returns_404(authed_client):
    response = await authed_client.post("/api/v1/goal-creation/missing/plan", json={
        "user_id": "u1",
        "answers": {"q": "a"}
    })
    assert response.status_code == 404
```

**Step 2: Run tests to verify they fail**

Run: `pytest backend/tests/unit/test_goal_creation_session_store.py backend/tests/api/v1/test_goal_creation_session_expiry.py -v`  
Expected: FAIL

**Step 3: Write minimal implementation**

- Persist session context to Redis with TTL.
- Remove `active_sessions` dict from orchestrator.
- Map missing/expired session to explicit 404 with actionable error payload.

**Step 4: Run tests to verify they pass**

Run: `pytest backend/tests/unit/test_goal_creation_session_store.py backend/tests/api/v1/test_goal_creation_session_expiry.py -v`  
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/services/goal_creation_session_store.py backend/app/services/duotrak_crew_orchestrator.py backend/app/api/v1/endpoints/goal_creation.py backend/tests/unit/test_goal_creation_session_store.py backend/tests/api/v1/test_goal_creation_session_expiry.py
git commit -m "feat: persist goal creation sessions in redis with ttl"
```

### Task 4: Introduce LangGraph Pipeline Behind Feature Flag

**Files:**
- Create: `backend/app/ai/langgraph_goal_pipeline.py`
- Create: `backend/app/ai/orchestrator_factory.py`
- Modify: `backend/app/core/config.py`
- Modify: `backend/app/api/v1/endpoints/goal_creation.py`
- Test: `backend/tests/unit/test_orchestrator_factory.py`
- Test: `backend/tests/integration/test_langgraph_goal_pipeline.py`

**Step 1: Write the failing tests**

```python
def test_factory_selects_langgraph_when_flag_enabled(settings):
    settings.AI_ORCHESTRATOR = "langgraph"
    orchestrator = create_orchestrator(settings)
    assert orchestrator.__class__.__name__ == "LangGraphGoalPipeline"
```

```python
async def test_langgraph_pipeline_returns_contract_shape():
    result = await pipeline.create_plan(...)
    assert "goal_plan" in result
    assert "partner_integration" in result
```

**Step 2: Run tests to verify they fail**

Run: `pytest backend/tests/unit/test_orchestrator_factory.py backend/tests/integration/test_langgraph_goal_pipeline.py -v`  
Expected: FAIL

**Step 3: Write minimal implementation**

- Add config flag `AI_ORCHESTRATOR=crewai|langgraph`.
- Build LangGraph linear workflow:
  1. profile node
  2. question node
  3. plan node
  4. score node
- Keep CrewAI path for rollback.

**Step 4: Run tests to verify they pass**

Run: `pytest backend/tests/unit/test_orchestrator_factory.py backend/tests/integration/test_langgraph_goal_pipeline.py -v`  
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/ai backend/app/core/config.py backend/app/api/v1/endpoints/goal_creation.py backend/tests/unit/test_orchestrator_factory.py backend/tests/integration/test_langgraph_goal_pipeline.py
git commit -m "feat: add langgraph orchestrator behind feature flag"
```

### Task 5: Add Shadow Mode and Reliability Telemetry

**Files:**
- Create: `backend/app/ai/shadow_runner.py`
- Modify: `backend/app/api/v1/endpoints/goal_creation.py`
- Modify: `deploy/otel-collector-config.yaml`
- Test: `backend/tests/integration/test_shadow_mode_non_blocking.py`

**Step 1: Write the failing test**

```python
async def test_shadow_mode_does_not_block_primary_response(client):
    response = await client.post("/api/v1/goal-creation/questions", json=payload)
    assert response.status_code == 200
```

**Step 2: Run test to verify it fails**

Run: `pytest backend/tests/integration/test_shadow_mode_non_blocking.py -v`  
Expected: FAIL

**Step 3: Write minimal implementation**

- Add `AI_SHADOW_MODE=true|false`.
- Run secondary orchestrator asynchronously; log diff metrics only.
- Emit metrics: parse_success_rate, schema_validation_rate, p95 latency.

**Step 4: Run test to verify it passes**

Run: `pytest backend/tests/integration/test_shadow_mode_non_blocking.py -v`  
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/ai/shadow_runner.py backend/app/api/v1/endpoints/goal_creation.py deploy/otel-collector-config.yaml backend/tests/integration/test_shadow_mode_non_blocking.py
git commit -m "feat: add non-blocking shadow mode for ai orchestrator comparison"
```

### Task 6: Normalize Auth Boundary for Web + Mobile

**Files:**
- Modify: `src/app/api/auth/verify-session/route.ts`
- Modify: `src/lib/auth/server.ts`
- Modify: `src/lib/auth.ts`
- Modify: `backend/app/core/config.py`
- Create: `docs/auth-boundary.md`
- Test: `src/app/api/auth/__tests__/cookie-contract.test.ts`

**Step 1: Write the failing test**

```ts
test("auth cookie contract uses __session consistently", async () => {
  const cookieName = getSessionCookieName();
  expect(cookieName).toBe("__session");
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/app/api/auth/__tests__/cookie-contract.test.ts`  
Expected: FAIL

**Step 3: Write minimal implementation**

- Replace `auth_token` usages with a single session cookie contract.
- Document boundary:
  - Convex/Firebase for app auth
  - Python AI endpoints called via Convex action + internal secret
- Remove dead mock cookie paths not used in production auth.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/app/api/auth/__tests__/cookie-contract.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/auth/verify-session/route.ts src/lib/auth/server.ts src/lib/auth.ts backend/app/core/config.py docs/auth-boundary.md src/app/api/auth/__tests__/cookie-contract.test.ts
git commit -m "refactor: unify auth cookie contract and document web-mobile auth boundary"
```

### Task 7: Move Remaining Frontend AI Calls to Convex Action Boundary

**Files:**
- Modify: `src/lib/api/goals.ts`
- Modify: `src/components/goal-creation-wizard.tsx`
- Modify: `convex/onboarding.ts`
- Create: `convex/goalCreation.ts`
- Test: `src/components/__tests__/goal-creation-wizard.test.tsx`

**Step 1: Write the failing test**

```tsx
it("submits goal planning via convex action instead of direct api client", async () => {
  render(<GoalCreationWizard />);
  // assert convex action mock called
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/__tests__/goal-creation-wizard.test.tsx`  
Expected: FAIL

**Step 3: Write minimal implementation**

- Add Convex action wrapper for strategic questions + plan creation.
- Update wizard to call Convex action instead of direct `/api/v1/goal-creation/*`.
- Keep fallback flag for emergency direct Python path.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/__tests__/goal-creation-wizard.test.tsx`  
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/api/goals.ts src/components/goal-creation-wizard.tsx convex/onboarding.ts convex/goalCreation.ts src/components/__tests__/goal-creation-wizard.test.tsx
git commit -m "feat: route goal creation ai calls through convex action boundary"
```

### Task 8: Set Up Shared Domain Package for Web + Expo Reuse

**Files:**
- Create: `packages/domain/src/index.ts`
- Create: `packages/domain/src/goals.ts`
- Create: `packages/domain/src/invitations.ts`
- Create: `packages/domain/src/chat.ts`
- Modify: `src/hooks/useGoals.ts`
- Create: `apps/mobile/README.md`
- Test: `packages/domain/src/__tests__/goals.test.ts`

**Step 1: Write the failing test**

```ts
import { mapGoalFromConvex } from "../goals";

test("maps convex goal shape to domain goal", () => {
  const result = mapGoalFromConvex(sampleGoal);
  expect(result.id).toBeDefined();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- packages/domain/src/__tests__/goals.test.ts`  
Expected: FAIL

**Step 3: Write minimal implementation**

- Extract mapping/business rules from `src/hooks/useGoals.ts` into `packages/domain`.
- Export pure functions usable by both web and Expo.

**Step 4: Run test to verify it passes**

Run: `npm test -- packages/domain/src/__tests__/goals.test.ts`  
Expected: PASS

**Step 5: Commit**

```bash
git add packages/domain src/hooks/useGoals.ts apps/mobile/README.md
git commit -m "feat: create shared domain package for web and expo"
```

### Task 9: Clean Dead Endpoints and Enforce API Surface

**Files:**
- Modify: `backend/app/main.py`
- Modify: `backend/app/api/v1/router.py`
- Modify: `backend/app/api/v1/endpoints/agent_crew.py`
- Create: `backend/tests/api/v1/test_route_surface.py`

**Step 1: Write the failing test**

```python
def test_removed_legacy_routes_not_registered(client):
    response = client.get("/api/v1/agent-crew/wizard/questions")
    assert response.status_code in (404, 410)
```

**Step 2: Run test to verify it fails**

Run: `pytest backend/tests/api/v1/test_route_surface.py -v`  
Expected: FAIL

**Step 3: Write minimal implementation**

- Remove stale router references and dead modules.
- Keep only active supported endpoints registered.
- Return `410 Gone` where deprecation grace is needed.

**Step 4: Run test to verify it passes**

Run: `pytest backend/tests/api/v1/test_route_surface.py -v`  
Expected: PASS

**Step 5: Commit**

```bash
git add backend/app/main.py backend/app/api/v1/router.py backend/app/api/v1/endpoints/agent_crew.py backend/tests/api/v1/test_route_surface.py
git commit -m "chore: remove dead api routes and enforce explicit route surface"
```

### Task 10: Production Cutover and Rollback Playbook

**Files:**
- Create: `docs/runbooks/ai-orchestrator-cutover.md`
- Create: `docs/runbooks/ai-orchestrator-rollback.md`
- Modify: `deploy/otel-collector-config.yaml`
- Modify: `docker-compose.yml`

**Step 1: Write the failing test/check**

```bash
# smoke gate script
./scripts/check-cutover-readiness.sh
```

Expected: FAIL until all SLO thresholds are configured.

**Step 2: Run check to verify it fails**

Run: `bash scripts/check-cutover-readiness.sh`  
Expected: FAIL

**Step 3: Write minimal implementation**

- Define SLO gates:
  - schema validation success >= 99%
  - question endpoint p95 < 4s
  - plan endpoint p95 < 10s
  - session-not-found rate < 0.5%
- Document exact toggles:
  - `AI_ORCHESTRATOR`
  - `AI_SHADOW_MODE`
  - `AI_DIRECT_PYTHON_FALLBACK`

**Step 4: Run check to verify it passes**

Run: `bash scripts/check-cutover-readiness.sh`  
Expected: PASS

**Step 5: Commit**

```bash
git add docs/runbooks deploy/otel-collector-config.yaml docker-compose.yml scripts/check-cutover-readiness.sh
git commit -m "docs: add cutover and rollback runbooks with readiness gates"
```

## Rollout Sequence

1. Tasks 1-3 (stabilize contracts + state)  
2. Tasks 4-5 (add LangGraph + shadow mode)  
3. Task 6 (auth boundary normalization)  
4. Tasks 7-8 (Convex boundary + shared domain extraction)  
5. Tasks 9-10 (cleanup + cutover)

## Definition of Done

1. Goal creation flows no longer fail due to contract drift.
2. No in-memory session coupling for multi-step AI flow.
3. LangGraph path is deployable and measured in shadow mode.
4. Frontend AI calls are routed through Convex action boundary.
5. Shared domain package is usable by web and Expo.
6. Cutover and rollback can be executed in < 10 minutes via documented flags.
