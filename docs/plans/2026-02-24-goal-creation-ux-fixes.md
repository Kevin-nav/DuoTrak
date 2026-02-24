# Goal Creation UX Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove major friction and blockers in manual + AI goal creation flows across mobile and desktop.

**Architecture:** Patch the active production flow components in `src/components/goals/wizard/*` and onboarding flow in `src/components/onboarding/*`, keeping API contracts unchanged. Prioritize safe validation and state fixes first, then mobile interaction/accessibility improvements.

**Tech Stack:** Next.js App Router, React, TypeScript, react-hook-form + zod, Convex, Tailwind CSS.

---

### Task 1: Fix custom-goal onboarding finish blocker (P0)

**Files:**
- Modify: `src/components/onboarding/InviteeOnboardingFlow.tsx`

**Step 1: Write the failing test**
- Add/extend onboarding flow test to cover custom-goal path where plan is generated and finish should not require `selectedGoal`.

**Step 2: Run test to verify it fails**
- Run: `npm test -- InviteeOnboardingFlow` (or project equivalent)
- Expected: failure showing "Please select a goal first" in custom path.

**Step 3: Write minimal implementation**
- Store custom goal metadata when plan is generated, and use fallback goal source at finish.

**Step 4: Run test to verify it passes**
- Re-run focused onboarding test.

**Step 5: Commit**
- `git add src/components/onboarding/InviteeOnboardingFlow.tsx`
- `git commit -m "fix: unblock custom goal onboarding completion"`

### Task 2: Make goal card actions accessible on touch devices (P0)

**Files:**
- Modify: `src/components/goals-home.tsx`

**Step 1: Write the failing test**
- Add UI assertion for action buttons visibility at non-hover/mobile state (or snapshot/class-level test).

**Step 2: Run test to verify it fails**
- Run goals-home test or lint/type checks for expected class behavior.

**Step 3: Write minimal implementation**
- Show actions by default on small screens; keep hover reveal behavior for desktop.

**Step 4: Run test to verify it passes**
- Re-run focused test/check.

**Step 5: Commit**
- `git add src/components/goals-home.tsx`
- `git commit -m "fix: expose goal actions on mobile"`

### Task 3: Enforce time window when time-bound accountability is selected (P0)

**Files:**
- Modify: `src/components/goals/wizard/types.ts`

**Step 1: Write the failing test**
- Add zod schema test case: `time_bound_action` + empty `timeWindow` should fail.

**Step 2: Run test to verify it fails**
- Run focused schema test.

**Step 3: Write minimal implementation**
- Extend `superRefine` to require `timeWindow` for `time_bound_action`.

**Step 4: Run test to verify it passes**
- Re-run focused schema test.

**Step 5: Commit**
- `git add src/components/goals/wizard/types.ts`
- `git commit -m "fix: require time window for time-bound accountability"`

### Task 4: Fix timezone handling for `datetime-local` defaults/min (P0)

**Files:**
- Modify: `src/components/onboarding/FirstTaskStep.tsx`

**Step 1: Write the failing test**
- Add utility/unit test for local datetime string generation (no UTC offset shift).

**Step 2: Run test to verify it fails**
- Run focused test.

**Step 3: Write minimal implementation**
- Replace direct `toISOString().slice(0, 16)` usage with local datetime formatter helper.

**Step 4: Run test to verify it passes**
- Re-run focused test.

**Step 5: Commit**
- `git add src/components/onboarding/FirstTaskStep.tsx`
- `git commit -m "fix: use local time for onboarding datetime-local fields"`

### Task 5: Verify and stabilize

**Files:**
- Modify if needed: impacted test files

**Step 1: Run targeted checks**
- Run: wizard/onboarding related tests.

**Step 2: Run lightweight project checks**
- Run: lint/typecheck subset if available.

**Step 3: Address regressions minimally**
- Only patch regressions directly tied to the above fixes.

**Step 4: Final validation**
- Manual pass through `/goals/new`, `/goals`, onboarding custom-goal path.

**Step 5: Commit**
- `git add ...`
- `git commit -m "test: validate goal-creation ux p0 fixes"`

### P1 Follow-up (next wave)
- Unify manual vs AI mode discoverability before template selection.
- Reduce duplicate mobile CTAs (`Create Goal` button + FAB).
- Improve copy consistency when user chooses manual path.
- Improve personalization fallback (allow free text when AI options are narrow).
