# Goal Detail View Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Break `goal-detail-view.tsx` into smaller maintainable modules while preserving behavior and enabling safer future logic edits.

**Architecture:** Introduce a feature-sliced `goal-detail/` folder where state and pure helpers are isolated from presentational tab sections. Keep a compatibility export at the original file path to avoid consumer breakage. Perform a safe cleanup pass only after the split is functional.

**Tech Stack:** Next.js 15, React 18, TypeScript, Framer Motion, Tailwind CSS

---

### Task 1: Extract Shared Types and Utilities

**Files:**
- Create: `src/components/goal-detail/types.ts`
- Create: `src/components/goal-detail/utils.ts`
- Modify: `src/components/goal-detail-view.tsx`

**Step 1: Write the failing test**
- Add/adjust a tiny unit check (or temporary type import check) that references moved helpers/types.

**Step 2: Run test/check to verify it fails**

Run: `npm run lint`  
Expected: FAIL or unresolved import until helpers are moved.

**Step 3: Write minimal implementation**
- Move:
  - `TabKey`, `WeekGroup`, `GoalDetailViewProps` to `types.ts`
  - `resolveVerificationMode`, `actionLabelForMode`, `dayName` to `utils.ts`
- Re-import into existing file without behavior changes.

**Step 4: Run verification**

Run: `npm run lint`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/goal-detail/types.ts src/components/goal-detail/utils.ts src/components/goal-detail-view.tsx
git commit -m "refactor: extract goal detail view types and utilities"
```

### Task 2: Extract State and Handlers Into Hook

**Files:**
- Create: `src/components/goal-detail/useGoalDetailState.ts`
- Modify: `src/components/goal-detail-view.tsx`

**Step 1: Write failing check**
- Introduce hook import references and verify old inline state usage is no longer complete.

**Step 2: Run verification to confirm transition need**

Run: `npm run lint`  
Expected: FAIL until state is moved and wired.

**Step 3: Implement hook**
- Move state and handlers:
  - `activeTab`, `proofModal`, `profileDraft`, `collapsedMilestones`, `showCelebration`, `isSavingProfile`
  - `toggleMilestone`, `handleTaskAction`, `handleProofSubmit`, `saveProfile`, `triggerCelebration`
- Keep dependencies explicit (`goal`, `updateGoal`, `toast`).

**Step 4: Run verification**

Run: `npm run lint`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/goal-detail/useGoalDetailState.ts src/components/goal-detail-view.tsx
git commit -m "refactor: move goal detail state and handlers into dedicated hook"
```

### Task 3: Extract Header, Tabs, and Overlay Components

**Files:**
- Create: `src/components/goal-detail/GoalHeaderCard.tsx`
- Create: `src/components/goal-detail/GoalTabs.tsx`
- Create: `src/components/goal-detail/CelebrationOverlay.tsx`
- Modify: `src/components/goal-detail-view.tsx`

**Step 1: Write failing check**
- Wire component imports first so lint/type check fails until files are created.

**Step 2: Run check**

Run: `npm run lint`  
Expected: FAIL with missing modules.

**Step 3: Implement components**
- Move exact JSX blocks with minimal className changes.
- Keep props explicit and focused.

**Step 4: Run check**

Run: `npm run lint`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/goal-detail/GoalHeaderCard.tsx src/components/goal-detail/GoalTabs.tsx src/components/goal-detail/CelebrationOverlay.tsx src/components/goal-detail-view.tsx
git commit -m "refactor: extract goal detail header tabs and celebration overlay"
```

### Task 4: Extract Tab Content Components

**Files:**
- Create: `src/components/goal-detail/ThisWeekTab.tsx`
- Create: `src/components/goal-detail/FullPlanTab.tsx`
- Create: `src/components/goal-detail/GoalSettingsTab.tsx`
- Modify: `src/components/goal-detail-view.tsx`

**Step 1: Write failing check**
- Replace inline tab sections with imports/placeholders before component files exist.

**Step 2: Run check**

Run: `npm run lint`  
Expected: FAIL until components are implemented.

**Step 3: Implement tab components**
- Move each tab block fully.
- Pass only required props.
- Preserve behavior and tab switch output.

**Step 4: Run check**

Run: `npm run lint`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/goal-detail/ThisWeekTab.tsx src/components/goal-detail/FullPlanTab.tsx src/components/goal-detail/GoalSettingsTab.tsx src/components/goal-detail-view.tsx
git commit -m "refactor: split goal detail tab sections into dedicated components"
```

### Task 5: Create New Orchestrator and Compatibility Wrapper

**Files:**
- Create: `src/components/goal-detail/GoalDetailView.tsx`
- Create: `src/components/goal-detail/index.ts`
- Modify: `src/components/goal-detail-view.tsx`

**Step 1: Write failing check**
- Update imports to resolve from new orchestrator path.

**Step 2: Run check**

Run: `npm run lint`  
Expected: FAIL until orchestrator/wrapper wiring is complete.

**Step 3: Implement**
- Compose all extracted pieces in `GoalDetailView.tsx`.
- Make `goal-detail-view.tsx` export wrapper:
  - `import GoalDetailView from "./goal-detail/GoalDetailView"`
  - `export default GoalDetailView`

**Step 4: Run check**

Run: `npm run lint`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/goal-detail/GoalDetailView.tsx src/components/goal-detail/index.ts src/components/goal-detail-view.tsx
git commit -m "refactor: introduce goal-detail orchestrator with compatibility export"
```

### Task 6: Safe Cleanup Pass and Verification

**Files:**
- Modify: `src/components/goal-detail/*` (as needed for minor dedup and readability)
- Modify: `docs/plans/2026-02-25-goal-detail-view-refactor-design.md` (optional status note)

**Step 1: Perform safe cleanup**
- Remove repeated micro-UI patterns where trivial.
- Keep behavior and contracts unchanged.

**Step 2: Run verification**

Run: `npm run lint`  
Expected: PASS.

**Step 3: Manual behavior checks**
- Verify tab switching, modal interactions, settings save, milestone collapse.

**Step 4: Commit**

```bash
git add src/components/goal-detail src/components/goal-detail-view.tsx
git commit -m "refactor: finalize goal detail split with safe cleanup"
```
