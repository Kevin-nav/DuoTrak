# Goal Creation Friction Reduction Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship a suggestion-first goal creation flow with AI deep personalization, duo accountability defaults, timezone auto-detection for time-window proofs, and first-class habit goals.

**Architecture:** Keep Convex as the source of truth for goals/tasks while using the existing backend goal-creation pipeline to generate AI plans. Introduce template + motivation catalogs in frontend/domain and normalize output into Convex goal/task structures with explicit proof and window metadata. Enforce timezone-aware time-window validation server-side and remove manual timezone selection from goal creation.

**Tech Stack:** Next.js 15, React 18, TypeScript, Convex (schema/functions), FastAPI backend, Zod, React Hook Form, Jest/RTL

---

### Task 1: Add Goal Type + Proof Metadata Contracts

**Files:**
- Modify: `packages/contracts/src/goalCreation.ts`
- Modify: `packages/contracts/src/goalPlan.ts`
- Modify: `src/schemas/goal.ts`
- Test: `src/schemas/__tests__/goalPlan.contract.test.ts`

**Step 1: Write the failing test**

```ts
it("accepts habit goals without target deadline and task proof metadata", () => {
  const parsed = GoalPlanResponseSchema.parse({
    goal_type: "habit",
    target_deadline: null,
    tasks: [{
      task_name: "Wake up check-in",
      verification_mode: "time-window",
      time_window_start: "07:00",
      time_window_duration_minutes: 10
    }]
  });
  expect(parsed.goal_type).toBe("habit");
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/schemas/__tests__/goalPlan.contract.test.ts -t "habit goals"`  
Expected: FAIL because schemas do not support new fields/rules.

**Step 3: Write minimal implementation**

```ts
export const GoalTypeSchema = z.enum(["habit", "target-date", "milestone"]);
// deadline optional for non target-date
// add proof metadata fields for task shape
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/schemas/__tests__/goalPlan.contract.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/contracts/src/goalCreation.ts packages/contracts/src/goalPlan.ts src/schemas/goal.ts src/schemas/__tests__/goalPlan.contract.test.ts
git commit -m "feat: add goal type and proof metadata contracts"
```

### Task 2: Extend Convex Schema for New Goal/Task Fields

**Files:**
- Modify: `convex/schema.ts`
- Modify: `convex/goals.ts`
- Modify: `convex/tasks.ts`

**Step 1: Write the failing test**

```ts
it("stores habit goals without end_date and validates target-date goals with end_date", async () => {
  // create via mutation and assert validation behavior
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- packages/domain/src/__tests__/goals.test.ts -t "habit"`  
Expected: FAIL due missing schema fields/validation logic.

**Step 3: Write minimal implementation**

```ts
// convex/schema.ts
goals: defineTable({
  goal_type: v.optional(v.union(v.literal("habit"), v.literal("target-date"), v.literal("milestone"))),
  end_date: v.optional(v.number()),
  ...
})

tasks: defineTable({
  verification_mode: v.optional(v.string()),
  time_window_start: v.optional(v.string()),
  time_window_duration_minutes: v.optional(v.number()),
  requires_partner_review: v.optional(v.boolean()),
  ...
})
```

**Step 4: Run test to verify it passes**

Run: `npx convex dev --once`  
Expected: Schema validation succeeds and codegen completes.

**Step 5: Commit**

```bash
git add convex/schema.ts convex/goals.ts convex/tasks.ts convex/_generated/*
git commit -m "feat: extend goal/task persistence for habit and proof windows"
```

### Task 3: Timezone Auto-Detect Plumbing (No Manual Timezone in Goal Flow)

**Files:**
- Modify: `src/contexts/UserContext.tsx`
- Modify: `src/components/goal-creation-wizard.tsx`
- Modify: `src/components/onboarding/ProfileSetupStep.tsx`
- Test: `src/components/__tests__/goal-creation-wizard.test.tsx`

**Step 1: Write the failing test**

```tsx
it("does not render timezone input in goal creation and uses user timezone from context", async () => {
  render(<GoalCreationWizard />);
  expect(screen.queryByLabelText(/timezone/i)).not.toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/__tests__/goal-creation-wizard.test.tsx -t "timezone"`  
Expected: FAIL if timezone fields are still required in wizard flow.

**Step 3: Write minimal implementation**

```ts
const timezone = userDetails?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
// pass timezone in payloads; remove manual timezone UI from goal flow
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/__tests__/goal-creation-wizard.test.tsx`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/contexts/UserContext.tsx src/components/goal-creation-wizard.tsx src/components/onboarding/ProfileSetupStep.tsx src/components/__tests__/goal-creation-wizard.test.tsx
git commit -m "feat: use auto-detected timezone in goal creation flow"
```

### Task 4: Build Suggestion Catalog + Motivation Chips (Lean Launch Set)

**Files:**
- Create: `src/lib/goals/suggested-goals-catalog.ts`
- Create: `src/lib/goals/motivation-suggestions.ts`
- Modify: `src/components/goal-creation-wizard.tsx`
- Test: `src/components/__tests__/goal-creation-wizard.test.tsx`

**Step 1: Write the failing test**

```tsx
it("shows suggested goal cards and applies selected template into the form", async () => {
  render(<GoalCreationWizard />);
  await user.click(screen.getByText(/Morning Fitness Starter/i));
  expect(screen.getByDisplayValue(/Morning Fitness Starter/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/__tests__/goal-creation-wizard.test.tsx -t "suggested goal cards"`  
Expected: FAIL because catalog UI is missing.

**Step 3: Write minimal implementation**

```ts
export const SUGGESTED_GOALS = [{ id: "fitness_morning", category: "fitness", ... }];
export const MOTIVATION_CHIPS = ["Health", "Confidence", "Discipline", ...];
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/__tests__/goal-creation-wizard.test.tsx`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/lib/goals/suggested-goals-catalog.ts src/lib/goals/motivation-suggestions.ts src/components/goal-creation-wizard.tsx src/components/__tests__/goal-creation-wizard.test.tsx
git commit -m "feat: add suggestion-first catalog and motivation chips"
```

### Task 5: Add Suggestion Search + Filter UX

**Files:**
- Modify: `src/components/goal-creation-wizard.tsx`
- Create: `src/components/goals/SuggestionFilters.tsx`
- Test: `src/components/__tests__/goal-creation-wizard.test.tsx`

**Step 1: Write the failing test**

```tsx
it("filters suggestions by goal type and proof mode", async () => {
  render(<GoalCreationWizard />);
  await user.selectOptions(screen.getByLabelText(/goal type/i), "habit");
  await user.selectOptions(screen.getByLabelText(/proof mode/i), "time-window");
  expect(screen.getAllByTestId("goal-suggestion-card").length).toBeGreaterThan(0);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/__tests__/goal-creation-wizard.test.tsx -t "filters suggestions"`  
Expected: FAIL due missing filter component/state.

**Step 3: Write minimal implementation**

```tsx
<SuggestionFilters
  query={query}
  goalType={goalType}
  proofMode={proofMode}
  onChange={...}
/>
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/__tests__/goal-creation-wizard.test.tsx`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/goals/SuggestionFilters.tsx src/components/goal-creation-wizard.tsx src/components/__tests__/goal-creation-wizard.test.tsx
git commit -m "feat: add suggestion search and filtering in goal creation"
```

### Task 6: Deep Personalization Request + Section Regeneration Hooks

**Files:**
- Modify: `src/lib/api/goals.ts`
- Modify: `convex/goalCreation.ts`
- Modify: `backend/app/api/v1/endpoints/goal_creation.py`
- Modify: `backend/app/schemas/agent_crew.py`
- Test: `backend/tests/api/v1/test_goal_creation_contract.py`

**Step 1: Write the failing test**

```py
def test_goal_personalization_payload_supports_section_regeneration(client):
    payload = {"wizard_data": {"regenerate_section": "motivation", "goal_type": "habit"}}
    response = client.post("/api/v1/goal-creation/questions", json=payload)
    assert response.status_code in [200, 422]
```

**Step 2: Run test to verify it fails**

Run: `cd backend && pytest tests/api/v1/test_goal_creation_contract.py -k regeneration -v`  
Expected: FAIL due unsupported fields.

**Step 3: Write minimal implementation**

```py
class GoalWizardData(BaseModel):
    goal_type: Literal["habit", "target-date", "milestone"] | None = None
    regenerate_section: Literal["title", "motivation", "tasks", "accountability"] | None = None
```

**Step 4: Run test to verify it passes**

Run: `cd backend && pytest tests/api/v1/test_goal_creation_contract.py -k regeneration -v`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/lib/api/goals.ts convex/goalCreation.ts backend/app/api/v1/endpoints/goal_creation.py backend/app/schemas/agent_crew.py backend/tests/api/v1/test_goal_creation_contract.py
git commit -m "feat: support deep personalization and section regeneration contracts"
```

### Task 7: Habit Goal UX + Validation Rules

**Files:**
- Modify: `src/components/goal-creation-wizard.tsx`
- Modify: `src/schemas/goal.ts`
- Modify: `convex/goals.ts`
- Test: `src/components/__tests__/goal-creation-wizard.test.tsx`

**Step 1: Write the failing test**

```tsx
it("does not require target deadline for habit goals", async () => {
  render(<GoalCreationWizard />);
  await user.click(screen.getByLabelText(/Habit Goal/i));
  await user.click(screen.getByRole("button", { name: /Create Goal/i }));
  expect(screen.queryByText(/deadline is required/i)).not.toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/__tests__/goal-creation-wizard.test.tsx -t "habit goals"`  
Expected: FAIL due required deadline in validation path.

**Step 3: Write minimal implementation**

```ts
// zod refinement: deadline required only for target-date
if (goalType === "target-date" && !targetDeadline) addIssue(...)
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/__tests__/goal-creation-wizard.test.tsx`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/goal-creation-wizard.tsx src/schemas/goal.ts convex/goals.ts src/components/__tests__/goal-creation-wizard.test.tsx
git commit -m "feat: add first-class habit goal behavior and validation"
```

### Task 8: Duo Accountability Presets in Creation + Task Persistence

**Files:**
- Modify: `src/components/goal-creation-wizard.tsx`
- Modify: `convex/goals.ts`
- Modify: `convex/tasks.ts`
- Test: `packages/domain/src/__tests__/goals.test.ts`

**Step 1: Write the failing test**

```ts
it("persists partner review requirements for photo/voice/time-window tasks", async () => {
  // create goal with mixed proof tasks and assert stored flags
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- packages/domain/src/__tests__/goals.test.ts -t "partner review"`  
Expected: FAIL because persistence fields are absent/incomplete.

**Step 3: Write minimal implementation**

```ts
requires_partner_review: task.verification_mode === "photo" || task.verification_mode === "voice" || task.verification_mode === "time-window"
```

**Step 4: Run test to verify it passes**

Run: `npm test -- packages/domain/src/__tests__/goals.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/goal-creation-wizard.tsx convex/goals.ts convex/tasks.ts packages/domain/src/__tests__/goals.test.ts
git commit -m "feat: persist duo accountability defaults for generated tasks"
```

### Task 9: Time-Window Validation with User Timezone (Backend Safety)

**Files:**
- Modify: `convex/tasks.ts`
- Modify: `convex/users.ts`
- Test: `src/lib/api/__tests__/goals.contract.test.ts`

**Step 1: Write the failing test**

```ts
it("rejects check-in outside configured local time window", async () => {
  // set timezone + 07:00/10min window, simulate out-of-window check-in
  await expect(checkIn()).rejects.toThrow(/outside allowed window/i);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/api/__tests__/goals.contract.test.ts -t "outside configured local time window"`  
Expected: FAIL because check-in does not enforce timezone window.

**Step 3: Write minimal implementation**

```ts
const timezone = user.timezone ?? "UTC";
const inWindow = isNowWithinWindow({ timezone, start: task.time_window_start, durationMinutes: task.time_window_duration_minutes });
if (!inWindow) throw new Error("Check-in outside allowed window");
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/api/__tests__/goals.contract.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add convex/tasks.ts convex/users.ts src/lib/api/__tests__/goals.contract.test.ts
git commit -m "feat: enforce timezone-aware time-window check-in validation"
```

### Task 10: Final Regression, Lint, Typecheck, and Docs Sync

**Files:**
- Modify: `docs/goals-management.md`
- Modify: `docs/plans/2026-02-23-goal-creation-friction-reduction-design.md` (if implementation deltas appear)

**Step 1: Run focused tests**

Run:  
`npm test -- src/components/__tests__/goal-creation-wizard.test.tsx`  
`npm test -- src/schemas/__tests__/goalPlan.contract.test.ts`  
`cd backend && pytest tests/api/v1/test_goal_creation_contract.py -v`

Expected: PASS.

**Step 2: Run quality checks**

Run:  
`npm run lint`  
`npm run typecheck`  

Expected: PASS with zero blocking errors.

**Step 3: Sync docs**

```md
- update goals-management docs with goal types and timezone behavior
- confirm suggested catalog and personalization flow notes
```

**Step 4: Commit**

```bash
git add docs/goals-management.md docs/plans/2026-02-23-goal-creation-friction-reduction-design.md
git commit -m "docs: finalize goal creation friction reduction docs and validation notes"
```
