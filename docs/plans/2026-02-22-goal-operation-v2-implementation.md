# Goal Operation V2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a partner-in-the-loop, adherence-weighted goal operation system with deterministic schedule verification, outcome-driven Pinecone personalization, and Gemini 3 Flash-only AI planning.

**Architecture:** Extend shared contracts and backend schemas to include schedule impact and verification metadata, then enforce deterministic scoring after AI generation. Update goal-creation UX to present recommended vs original plans with concise reasons, and enforce mode-specific task verification with partner review plus time-window-only auto-approval.

**Tech Stack:** Next.js, React, Convex, FastAPI, Pydantic, Zod, Pinecone, Gemini 3 Flash

---

### Task 1: Extend Shared Contracts

**Files:**
- Modify: `packages/contracts/src/goalPlan.ts`
- Modify: `packages/contracts/src/goalCreation.ts`
- Modify: `src/schemas/goal.ts`
- Test: `src/schemas/__tests__/goalPlan.contract.test.ts`

**Step 1: Write the failing test**
- Add assertions for:
- `schedule_impact`
- `decision_trace`
- task verification fields (`verification_mode`, `verification_confidence`, `time_window_start`, `time_window_end`)

**Step 2: Run test to verify it fails**
- Run: `pnpm test src/schemas/__tests__/goalPlan.contract.test.ts`

**Step 3: Implement minimal schema changes**
- Add fields to Zod contracts and re-exports.

**Step 4: Run test to verify it passes**
- Run: `pnpm test src/schemas/__tests__/goalPlan.contract.test.ts`

**Step 5: Commit**
```bash
git add packages/contracts/src/goalPlan.ts packages/contracts/src/goalCreation.ts src/schemas/goal.ts src/schemas/__tests__/goalPlan.contract.test.ts
git commit -m "feat: extend goal contracts for v2 schedule and verification fields"
```

### Task 2: Extend Backend Schemas

**Files:**
- Modify: `backend/app/schemas/agent_crew.py`
- Modify: `backend/app/schemas/goal.py`
- Test: `backend/tests/contracts/test_goal_plan_contract.py`

**Step 1: Write the failing backend contract test**
- Assert v2 fields are accepted/returned.

**Step 2: Run test to verify it fails**
- Run: `pytest backend/tests/contracts/test_goal_plan_contract.py -v`

**Step 3: Implement minimal Pydantic updates**
- Add matching goal/task models for schedule impact and verification metadata.

**Step 4: Run test to verify it passes**
- Run: `pytest backend/tests/contracts/test_goal_plan_contract.py -v`

**Step 5: Commit**
```bash
git add backend/app/schemas/agent_crew.py backend/app/schemas/goal.py backend/tests/contracts/test_goal_plan_contract.py
git commit -m "feat: add v2 goal schemas for schedule impact and verification"
```

### Task 3: Add Deterministic Schedule Verifier

**Files:**
- Create: `backend/app/services/schedule_impact_service.py`
- Modify: `backend/app/services/goal_plan_adapter.py`
- Test: `backend/tests/unit/test_goal_plan_adapter.py`

**Step 1: Write failing tests**
- overload >10% flagged
- time-window conflicts flagged
- scaled alternative produced when needed

**Step 2: Run test to verify it fails**
- Run: `pytest backend/tests/unit/test_goal_plan_adapter.py -v`

**Step 3: Implement minimal verifier**
- Compute projected weekly load
- Compare against user capacity
- Emit `schedule_impact` and concise `decision_trace`

**Step 4: Run test to verify it passes**
- Run: `pytest backend/tests/unit/test_goal_plan_adapter.py -v`

**Step 5: Commit**
```bash
git add backend/app/services/schedule_impact_service.py backend/app/services/goal_plan_adapter.py backend/tests/unit/test_goal_plan_adapter.py
git commit -m "feat: add deterministic schedule impact verification"
```

### Task 4: Enforce Gemini 3 Flash-Only

**Files:**
- Modify: `backend/app/services/duotrak_crew_orchestrator.py`
- Modify: `backend/app/agents_v1/gemini_model_manager.py`
- Test: `backend/tests/unit/test_orchestrator_factory.py`

**Step 1: Write failing routing test**
- Assert planning path uses Gemini 3 Flash and rejects Pro.

**Step 2: Run test to verify it fails**
- Run: `pytest backend/tests/unit/test_orchestrator_factory.py -v`

**Step 3: Implement Flash-only policy**
- Lock model selection to Gemini 3 Flash.
- Add guardrail for non-Flash requests.

**Step 4: Run test to verify it passes**
- Run: `pytest backend/tests/unit/test_orchestrator_factory.py -v`

**Step 5: Commit**
```bash
git add backend/app/services/duotrak_crew_orchestrator.py backend/app/agents_v1/gemini_model_manager.py backend/tests/unit/test_orchestrator_factory.py
git commit -m "feat: enforce gemini 3 flash only routing"
```

### Task 5: Add Outcome-Only Pinecone Personalization

**Files:**
- Create: `backend/app/personalization/outcome_profile_store.py`
- Modify: `backend/app/personalization/context_engine.py`
- Modify: `backend/app/services/duotrak_crew_orchestrator.py`
- Test: `backend/tests/unit/test_goal_creation_session_store.py`

**Step 1: Write failing tests**
- Only outcome signals are included.
- 90-day retention window enforced.

**Step 2: Run test to verify it fails**
- Run: `pytest backend/tests/unit/test_goal_creation_session_store.py -v`

**Step 3: Implement minimal store/retrieval**
- Write/read completion, skips, streak breaks, check-in timing, reschedules.
- Exclude >90-day records.

**Step 4: Run test to verify it passes**
- Run: `pytest backend/tests/unit/test_goal_creation_session_store.py -v`

**Step 5: Commit**
```bash
git add backend/app/personalization/outcome_profile_store.py backend/app/personalization/context_engine.py backend/app/services/duotrak_crew_orchestrator.py backend/tests/unit/test_goal_creation_session_store.py
git commit -m "feat: add outcome-only 90-day pinecone personalization"
```

### Task 6: Add Verification Mode UX + Persistence

**Files:**
- Modify: `src/components/goal-creation-wizard.tsx`
- Modify: `convex/onboarding.ts`
- Modify: `convex/goals.ts`
- Test: `src/components/__tests__/goal-creation-wizard.test.tsx`

**Step 1: Write failing frontend test**
- Assert review UI shows recommended verification mode + reason per task.

**Step 2: Run test to verify it fails**
- Run: `pnpm test src/components/__tests__/goal-creation-wizard.test.tsx`

**Step 3: Implement minimal wiring**
- Render mode/reason/confidence.
- Persist mode + time-window metadata during save.

**Step 4: Run test to verify it passes**
- Run: `pnpm test src/components/__tests__/goal-creation-wizard.test.tsx`

**Step 5: Commit**
```bash
git add src/components/goal-creation-wizard.tsx convex/onboarding.ts convex/goals.ts src/components/__tests__/goal-creation-wizard.test.tsx
git commit -m "feat: add verification mode recommendations and persistence"
```

### Task 7: Implement Partner Review + Auto-Approval Rules

**Files:**
- Modify: `convex/tasks.ts`
- Modify: `backend/app/schemas/task.py`
- Create: `backend/tests/integration/test_time_window_auto_approval.py`

**Step 1: Write failing integration tests**
- Partner approval required for photo/voice.
- Auto-approval only for time-window tasks.
- Timeout 24h + confidence >=0.85 required.

**Step 2: Run test to verify it fails**
- Run: `pytest backend/tests/integration/test_time_window_auto_approval.py -v`

**Step 3: Implement minimal policy**
- Enforce mode-specific approval.
- Add timeout evaluator and confidence threshold gate.

**Step 4: Run test to verify it passes**
- Run: `pytest backend/tests/integration/test_time_window_auto_approval.py -v`

**Step 5: Commit**
```bash
git add convex/tasks.ts backend/app/schemas/task.py backend/tests/integration/test_time_window_auto_approval.py
git commit -m "feat: enforce partner review and time-window auto-approval policy"
```

### Task 8: Add Concise Transparency Messaging

**Files:**
- Modify: `src/components/goal-creation-wizard.tsx`
- Modify: `src/components/goal-invitation-review.tsx`
- Test: `src/components/__tests__/goal-creation-wizard.test.tsx`

**Step 1: Write failing UI test**
- Assert “Why this recommendation” panel shows max 3 concise reasons.

**Step 2: Run test to verify it fails**
- Run: `pnpm test src/components/__tests__/goal-creation-wizard.test.tsx`

**Step 3: Implement minimal UI**
- Add collapsed reasons panel and short supportive copy.

**Step 4: Run test to verify it passes**
- Run: `pnpm test src/components/__tests__/goal-creation-wizard.test.tsx`

**Step 5: Commit**
```bash
git add src/components/goal-creation-wizard.tsx src/components/goal-invitation-review.tsx src/components/__tests__/goal-creation-wizard.test.tsx
git commit -m "feat: add concise personalization transparency messaging"
```

### Task 9: Add Telemetry + Regression Coverage

**Files:**
- Modify: `backend/app/core/logging_config.py`
- Modify: `backend/app/api/v1/endpoints/goal_creation.py`
- Test: `backend/tests/api/v1/test_goal_creation_contract.py`

**Step 1: Write failing assertions**
- Validate structured events for plan selection, overload warnings, and review latency.

**Step 2: Run test to verify it fails**
- Run: `pytest backend/tests/api/v1/test_goal_creation_contract.py -v`

**Step 3: Implement minimal telemetry**
- Emit events in plan generation, selection, and verification transitions.

**Step 4: Run test to verify it passes**
- Run: `pytest backend/tests/api/v1/test_goal_creation_contract.py -v`

**Step 5: Commit**
```bash
git add backend/app/core/logging_config.py backend/app/api/v1/endpoints/goal_creation.py backend/tests/api/v1/test_goal_creation_contract.py
git commit -m "chore: add goal operation v2 telemetry and regression coverage"
```

### Task 10: Final Validation

**Files:**
- Validate: `src/components/__tests__/goal-creation-wizard.test.tsx`
- Validate: `backend/tests/contracts/test_goal_plan_contract.py`
- Validate: `backend/tests/integration/test_time_window_auto_approval.py`
- Validate: `backend/tests/api/v1/test_goal_creation_contract.py`
- Validate: `backend/tests/test_goal_creation_flow.py`

**Step 1: Run frontend tests**
- Run: `pnpm test src/components/__tests__/goal-creation-wizard.test.tsx`

**Step 2: Run backend tests**
- Run: `pytest backend/tests/contracts/test_goal_plan_contract.py backend/tests/integration/test_time_window_auto_approval.py backend/tests/api/v1/test_goal_creation_contract.py -v`

**Step 3: Run goal-flow smoke**
- Run: `pytest backend/tests/test_goal_creation_flow.py -v`

**Step 4: Commit validation baseline**
```bash
git add -A
git commit -m "test: validate goal operation v2 end-to-end"
```
