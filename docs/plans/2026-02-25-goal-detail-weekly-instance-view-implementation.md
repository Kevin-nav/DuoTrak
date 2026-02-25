# Goal Detail Weekly Instance View Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Goal Detail weekly task display with real `task_instances` execution data, add an `All Tasks` timeline tab, and align notification summaries/reminders with instance outcomes.

**Architecture:** Add a goal-scoped execution query in Convex that returns week and timeline instance data with task metadata. Refactor Goal Detail tabs to consume this query through a dedicated hook. Keep Full Plan and Settings behavior unchanged and preserve verification flow compatibility.

**Tech Stack:** Next.js 15, React 18, TypeScript, Convex, Tailwind CSS

---

### Task 1: Add Goal-Scoped Execution Query in Convex

**Files:**
- Modify: `convex/taskInstances.ts`

**Step 1: Define query contract**
- Add query args for `goal_id`, optional pagination/filter.

**Step 2: Implement minimal query**
- Return:
  - current-week instances for goal
  - timeline instance page
  - week status summary
- Join each instance with related task metadata.

**Step 3: Validate**

Run: `npm run lint`  
Expected: PASS.

**Step 4: Commit**

```bash
git add convex/taskInstances.ts
git commit -m "feat: add goal-scoped task instance execution query"
```

### Task 2: Add Frontend Hook for Goal Execution Data

**Files:**
- Create: `src/hooks/useGoalExecution.ts`

**Step 1: Implement hook wiring**
- Query Convex execution endpoint.
- Expose typed `weekInstances`, `allInstances`, `weekSummary`, loading state.

**Step 2: Validate**

Run: `npm run lint`  
Expected: PASS.

**Step 3: Commit**

```bash
git add src/hooks/useGoalExecution.ts
git commit -m "feat: add hook for goal execution instance data"
```

### Task 3: Update Goal Tabs to Include All Tasks

**Files:**
- Modify: `src/components/goal-detail/GoalTabs.tsx`
- Modify: `src/components/goal-detail/types.ts`

**Step 1: Add new tab key**
- Extend tab union with `all-tasks`.

**Step 2: Add tab UI**
- Insert `All Tasks` button while keeping layout responsive.

**Step 3: Validate**

Run: `npm run lint`  
Expected: PASS.

**Step 4: Commit**

```bash
git add src/components/goal-detail/GoalTabs.tsx src/components/goal-detail/types.ts
git commit -m "feat: add all tasks tab to goal detail navigation"
```

### Task 4: Refactor This Week Tab to Use Instance Data

**Files:**
- Modify: `src/components/goal-detail/ThisWeekTab.tsx`
- Modify: `src/components/goal-detail/useGoalDetailState.ts`

**Step 1: Remove created_at-based grouping logic**
- Stop deriving week groups from `goal.tasks`.

**Step 2: Render week buckets from instance payload**
- Show per-day instance states and timestamps.
- Keep existing action CTA style where applicable.

**Step 3: Validate**

Run: `npm run lint`  
Expected: PASS.

**Step 4: Commit**

```bash
git add src/components/goal-detail/ThisWeekTab.tsx src/components/goal-detail/useGoalDetailState.ts
git commit -m "refactor: drive this week tab from task instances"
```

### Task 5: Add All Tasks Timeline Tab Component

**Files:**
- Create: `src/components/goal-detail/AllTasksTab.tsx`
- Modify: `src/components/goal-detail/GoalDetailView.tsx`

**Step 1: Implement timeline UI**
- Add filters: All/Past/Today/Future.
- Show status + scheduled date + completion/review timestamps.

**Step 2: Wire into orchestrator**
- Render new tab content when `activeTab === "all-tasks"`.

**Step 3: Validate**

Run: `npm run lint`  
Expected: PASS.

**Step 4: Commit**

```bash
git add src/components/goal-detail/AllTasksTab.tsx src/components/goal-detail/GoalDetailView.tsx
git commit -m "feat: add all tasks timeline tab in goal detail view"
```

### Task 6: Align Notification Weekly Summary/Reminders to Instance Outcomes

**Files:**
- Modify: `convex/notifications.ts`

**Step 1: Update sweep data source**
- Prefer `task_instances` for weekly completion counts and task-state checks.

**Step 2: Ensure context payloads include deep-link fields**
- Include `goalId`, `taskId`, `instanceDate` where available.

**Step 3: Validate**

Run: `npm run lint`  
Expected: PASS.

**Step 4: Commit**

```bash
git add convex/notifications.ts
git commit -m "feat: align task reminder and summary notifications with instances"
```

### Task 7: Final Verification and Docs Update

**Files:**
- Modify: `docs/notifications.md`
- Modify: `docs/goals-management.md`

**Step 1: Run validation**

Run: `npm run lint`  
Expected: PASS.

**Step 2: Manual behavior checks**
- Verify week tab accuracy against instance records.
- Verify timeline filters.
- Verify notification context/deep-link behavior.

**Step 3: Update docs**
- Document instance-driven weekly tracking and all-tasks timeline behavior.

**Step 4: Commit**

```bash
git add docs/notifications.md docs/goals-management.md
git commit -m "docs: document instance-driven goal detail tracking and notifications"
```
