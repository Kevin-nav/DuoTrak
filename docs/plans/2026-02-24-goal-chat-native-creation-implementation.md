# Goal Chat-Native Creation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a new AI-led chat goal creation flow as the primary path, with strict validation, mandatory partner accountability, review gate, and goal persistence.

**Architecture:** Implement a new backend `/goal-chat` API surface with dedicated conversation/profile/strategy/composer services, then add a full-page frontend chat client at `/goals/new-ai` that drives session turns, strict finalization, and create. Keep existing wizard only as fallback during development.

**Tech Stack:** FastAPI, Pydantic, existing backend service patterns, Next.js App Router, React Query, existing API client boundary, Jest/Pytest.

---

### Task 1: Add Goal Chat Contracts and Router Surface

**Files:**
- Modify: `backend/app/api/v1/endpoints/__init__.py`
- Modify: `backend/app/api/v1/router.py`
- Create: `backend/app/schemas/goal_chat.py`
- Test: `backend/tests/api/v1/test_goal_chat_route_surface.py`

**Step 1: Write the failing test**

```python
def test_goal_chat_routes_registered(client):
    response = client.options("/api/v1/goal-chat/sessions")
    assert response.status_code != 404
```

**Step 2: Run test to verify it fails**

Run: `pytest backend/tests/api/v1/test_goal_chat_route_surface.py -v`
Expected: FAIL with 404/not registered route.

**Step 3: Write minimal implementation**

```python
# backend/app/api/v1/router.py
from app.api.v1.endpoints import goal_chat
api_router.include_router(goal_chat.router, prefix="/goal-chat", tags=["goal-chat"])
```

```python
# backend/app/schemas/goal_chat.py
class GoalChatCreateSessionRequest(BaseModel): ...
class GoalChatTurnRequest(BaseModel): ...
class GoalChatFinalizeRequest(BaseModel): ...
class GoalChatCreateRequest(BaseModel): ...
```

**Step 4: Run test to verify it passes**

Run: `pytest backend/tests/api/v1/test_goal_chat_route_surface.py -v`
Expected: PASS.

**Step 5: Commit**

```bash
git add backend/app/api/v1/endpoints/__init__.py backend/app/api/v1/router.py backend/app/schemas/goal_chat.py backend/tests/api/v1/test_goal_chat_route_surface.py
git commit -m "feat: register goal-chat API surface and contracts"
```

### Task 2: Implement Session Create Endpoint

**Files:**
- Create: `backend/app/api/v1/endpoints/goal_chat.py`
- Create: `backend/app/services/goal_chat_session_service.py`
- Modify: `backend/app/core/config.py`
- Test: `backend/tests/api/v1/test_goal_chat_session_create.py`

**Step 1: Write the failing test**

```python
def test_create_goal_chat_session_returns_session_payload(client):
    payload = {"user_id": "u_123"}
    response = client.post("/api/v1/goal-chat/sessions", json=payload, headers={"X-Internal-API-Key": "test"})
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert data["missing_slots"]
```

**Step 2: Run test to verify it fails**

Run: `pytest backend/tests/api/v1/test_goal_chat_session_create.py -v`
Expected: FAIL, endpoint missing.

**Step 3: Write minimal implementation**

```python
@router.post("/sessions", response_model=GoalChatSessionResponse)
async def create_session(request: GoalChatCreateSessionRequest):
    return await goal_chat_session_service.create_session(request.user_id)
```

Include defaults:
- profile question prompts (3)
- initial missing slots
- draft plan shell
- session TTL from config

**Step 4: Run test to verify it passes**

Run: `pytest backend/tests/api/v1/test_goal_chat_session_create.py -v`
Expected: PASS.

**Step 5: Commit**

```bash
git add backend/app/api/v1/endpoints/goal_chat.py backend/app/services/goal_chat_session_service.py backend/app/core/config.py backend/tests/api/v1/test_goal_chat_session_create.py
git commit -m "feat: add goal-chat session creation endpoint"
```

### Task 3: Implement Turn Processing with Slot Tracking

**Files:**
- Create: `backend/app/services/goal_chat/conversation_manager.py`
- Create: `backend/app/services/goal_chat/slot_tracker.py`
- Modify: `backend/app/api/v1/endpoints/goal_chat.py`
- Test: `backend/tests/unit/test_goal_chat_slot_tracker.py`
- Test: `backend/tests/api/v1/test_goal_chat_turns.py`

**Step 1: Write the failing tests**

```python
def test_slot_tracker_marks_deadline_required_only_for_target_date():
    ...
```

```python
def test_turn_endpoint_returns_assistant_reply_and_missing_slots(client):
    ...
```

**Step 2: Run tests to verify they fail**

Run: `pytest backend/tests/unit/test_goal_chat_slot_tracker.py backend/tests/api/v1/test_goal_chat_turns.py -v`
Expected: FAIL.

**Step 3: Write minimal implementation**

Implement:
- extraction from user turn to normalized facts
- required slots logic:
  - always required slots
  - conditional deadline/review slots by goal type
- response payload:
  - `assistant_message`
  - `extracted_facts`
  - `missing_slots`
  - `draft_plan`

**Step 4: Run tests to verify they pass**

Run: `pytest backend/tests/unit/test_goal_chat_slot_tracker.py backend/tests/api/v1/test_goal_chat_turns.py -v`
Expected: PASS.

**Step 5: Commit**

```bash
git add backend/app/services/goal_chat/conversation_manager.py backend/app/services/goal_chat/slot_tracker.py backend/app/api/v1/endpoints/goal_chat.py backend/tests/unit/test_goal_chat_slot_tracker.py backend/tests/api/v1/test_goal_chat_turns.py
git commit -m "feat: implement goal-chat turns and strict slot tracking"
```

### Task 4: Add Personality Profile Engine (Behavioral + Self-Profile)

**Files:**
- Create: `backend/app/services/goal_chat/profile_engine.py`
- Modify: `backend/app/services/goal_chat/conversation_manager.py`
- Test: `backend/tests/unit/test_goal_chat_profile_engine.py`

**Step 1: Write the failing test**

```python
def test_profile_engine_merges_behavioral_and_self_profile_answers():
    ...
```

**Step 2: Run test to verify it fails**

Run: `pytest backend/tests/unit/test_goal_chat_profile_engine.py -v`
Expected: FAIL.

**Step 3: Write minimal implementation**

Implement merge logic:
- behavioral signals from existing goals/performance
- 3 self-profile answers
- merged personality profile used by planner

**Step 4: Run test to verify it passes**

Run: `pytest backend/tests/unit/test_goal_chat_profile_engine.py -v`
Expected: PASS.

**Step 5: Commit**

```bash
git add backend/app/services/goal_chat/profile_engine.py backend/app/services/goal_chat/conversation_manager.py backend/tests/unit/test_goal_chat_profile_engine.py
git commit -m "feat: add hybrid personality profile engine for goal-chat"
```

### Task 5: Enforce Mandatory Partner Accountability in Finalize

**Files:**
- Create: `backend/app/services/goal_chat/plan_validator.py`
- Modify: `backend/app/api/v1/endpoints/goal_chat.py`
- Test: `backend/tests/api/v1/test_goal_chat_finalize_validation.py`
- Test: `backend/tests/unit/test_goal_chat_plan_validator.py`

**Step 1: Write the failing tests**

```python
def test_finalize_fails_when_partner_missing(client):
    ...
```

```python
def test_finalize_fails_when_any_task_missing_partner_review_requirement():
    ...
```

**Step 2: Run tests to verify they fail**

Run: `pytest backend/tests/api/v1/test_goal_chat_finalize_validation.py backend/tests/unit/test_goal_chat_plan_validator.py -v`
Expected: FAIL.

**Step 3: Write minimal implementation**

Enforce:
- active partner relationship required
- each task has partner accountability metadata
- conditional deadline rules by goal type
- finalize only with zero missing slots

**Step 4: Run tests to verify they pass**

Run: `pytest backend/tests/api/v1/test_goal_chat_finalize_validation.py backend/tests/unit/test_goal_chat_plan_validator.py -v`
Expected: PASS.

**Step 5: Commit**

```bash
git add backend/app/services/goal_chat/plan_validator.py backend/app/api/v1/endpoints/goal_chat.py backend/tests/api/v1/test_goal_chat_finalize_validation.py backend/tests/unit/test_goal_chat_plan_validator.py
git commit -m "feat: enforce strict finalize and partner accountability rules"
```

### Task 6: Implement Create Endpoint with Goal/Task Persistence

**Files:**
- Modify: `backend/app/api/v1/endpoints/goal_chat.py`
- Create: `backend/app/services/goal_chat/create_goal_adapter.py`
- Test: `backend/tests/api/v1/test_goal_chat_create.py`

**Step 1: Write the failing test**

```python
def test_create_persists_goal_and_tasks_after_finalize(client):
    ...
```

**Step 2: Run test to verify it fails**

Run: `pytest backend/tests/api/v1/test_goal_chat_create.py -v`
Expected: FAIL.

**Step 3: Write minimal implementation**

Implement:
- require finalized session
- transform draft plan to existing create-goal contract
- persist goal and tasks
- return created IDs

**Step 4: Run test to verify it passes**

Run: `pytest backend/tests/api/v1/test_goal_chat_create.py -v`
Expected: PASS.

**Step 5: Commit**

```bash
git add backend/app/api/v1/endpoints/goal_chat.py backend/app/services/goal_chat/create_goal_adapter.py backend/tests/api/v1/test_goal_chat_create.py
git commit -m "feat: persist finalized goal-chat plans to goals and tasks"
```

### Task 7: Add Frontend API Client Boundary for Goal Chat

**Files:**
- Create: `src/lib/api/goal-chat.ts`
- Modify: `src/lib/api/client.ts`
- Test: `src/lib/api/__tests__/goal-chat.test.ts`

**Step 1: Write the failing test**

```ts
it("maps goal-chat turn response contract to frontend type", async () => {
  ...
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/api/__tests__/goal-chat.test.ts`
Expected: FAIL.

**Step 3: Write minimal implementation**

Create typed wrappers:
- `createGoalChatSession`
- `sendGoalChatTurn`
- `finalizeGoalChatPlan`
- `createGoalFromGoalChat`

**Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/api/__tests__/goal-chat.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/lib/api/goal-chat.ts src/lib/api/client.ts src/lib/api/__tests__/goal-chat.test.ts
git commit -m "feat: add frontend goal-chat API boundary"
```

### Task 8: Build Full-Page Goal Chat UI at `/goals/new-ai`

**Files:**
- Create: `src/app/(app)/goals/new-ai/page.tsx`
- Create: `src/components/goals/chat/GoalChatPage.tsx`
- Create: `src/components/goals/chat/GoalChatComposer.tsx`
- Create: `src/components/goals/chat/GoalChatThread.tsx`
- Create: `src/components/goals/chat/GoalPlanPreviewPanel.tsx`
- Create: `src/components/goals/chat/useGoalChatFlow.ts`
- Test: `src/components/goals/chat/__tests__/goal-chat-flow.test.tsx`

**Step 1: Write the failing test**

```tsx
it("disables finalize until all required slots are complete", async () => {
  ...
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/goals/chat/__tests__/goal-chat-flow.test.tsx`
Expected: FAIL.

**Step 3: Write minimal implementation**

Implement:
- chat thread + composer
- turn submissions
- live missing-slot checklist
- finalize gate
- review panel before create

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/goals/chat/__tests__/goal-chat-flow.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/app/(app)/goals/new-ai/page.tsx src/components/goals/chat
git commit -m "feat: add full-page AI goal chat creation experience"
```

### Task 9: Add In-App Entry Point to New Goal Chat Flow

**Files:**
- Modify: `src/components/goals-home.tsx`
- Modify: `src/app/(app)/goals/page.tsx`
- Optional Modify: `src/components/layout/BottomNavbar.tsx`
- Test: `src/components/__tests__/goals-home-chat-entry.test.tsx`

**Step 1: Write the failing test**

```tsx
it("renders Create Goal with AI entry that links to /goals/new-ai", () => {
  ...
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/__tests__/goals-home-chat-entry.test.tsx`
Expected: FAIL.

**Step 3: Write minimal implementation**

Add prominent CTA in goals area:
- label: `Create Goal with AI`
- description: `Chat to build a personalized accountable goal`
- route: `/goals/new-ai`

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/__tests__/goals-home-chat-entry.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/goals-home.tsx src/app/(app)/goals/page.tsx src/components/layout/BottomNavbar.tsx src/components/__tests__/goals-home-chat-entry.test.tsx
git commit -m "feat: add in-app entry point for AI goal chat flow"
```

### Task 10: Regression Suite, Docs, and Fallback Toggle

**Files:**
- Modify: `backend/app/core/config.py`
- Modify: `src/app/(app)/goals/new/page.tsx`
- Create: `docs/plans/2026-02-24-goal-chat-native-cutover-checklist.md`
- Test: `backend/tests/api/v1/test_goal_chat_route_surface.py`
- Test: `src/components/goals/chat/__tests__/goal-chat-flow.test.tsx`
- Test: `src/components/__tests__/goal-creation-wizard.test.tsx`

**Step 1: Write/adjust failing tests**

```python
def test_goal_chat_enabled_flag_defaults_true_in_dev():
    ...
```

```tsx
it("keeps legacy wizard route working as fallback", () => {
  ...
})
```

**Step 2: Run tests to verify current failures**

Run: `pytest backend/tests/api/v1/test_goal_chat_route_surface.py -v`
Run: `npm test -- src/components/goals/chat/__tests__/goal-chat-flow.test.tsx src/components/__tests__/goal-creation-wizard.test.tsx`
Expected: FAIL where missing.

**Step 3: Write minimal implementation**

Implement:
- feature toggle (`GOAL_CHAT_V2_ENABLED`) default-on in dev
- keep legacy wizard route as fallback while validation runs
- add cutover checklist doc

**Step 4: Run full targeted verification**

Run: `pytest backend/tests/api/v1/test_goal_chat_*.py backend/tests/unit/test_goal_chat_*.py -v`
Run: `npm test -- src/components/goals/chat/__tests__/goal-chat-flow.test.tsx src/components/__tests__/goals-home-chat-entry.test.tsx src/components/__tests__/goal-creation-wizard.test.tsx`
Expected: PASS.

**Step 5: Commit**

```bash
git add backend/app/core/config.py src/app/(app)/goals/new/page.tsx docs/plans/2026-02-24-goal-chat-native-cutover-checklist.md backend/tests/api/v1 src/components/goals/chat src/components/__tests__
git commit -m "chore: add goal-chat cutover toggle and validation checklist"
```

### Task 11: Final Quality Gate

**Files:**
- Modify: any files flagged by lint/type/test as needed.

**Step 1: Run backend quality commands**

Run: `pytest backend/tests/api/v1/test_goal_chat_*.py backend/tests/unit/test_goal_chat_*.py -v`
Expected: PASS.

**Step 2: Run frontend quality commands**

Run: `npm test -- src/components/goals/chat/__tests__/goal-chat-flow.test.tsx src/components/__tests__/goals-home-chat-entry.test.tsx`
Run: `npm run lint`
Expected: PASS (or only accepted existing warnings).

**Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS.

**Step 4: Commit final polish**

```bash
git add -A
git commit -m "chore: stabilize goal chat-native creation flow"
```
