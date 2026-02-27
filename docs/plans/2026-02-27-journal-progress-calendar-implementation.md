# Journal + Progress Calendar and Workspace Tasks Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a mobile-first unified Journal calendar (entries + workspace tasks with partner assignment) and a Progress streak history calendar for both partners.

**Architecture:** Introduce a dedicated `journal_tasks` Convex table plus Journal calendar aggregation query to merge entries and tasks by day. Extend journal page editor with task blocks backed by task mutations. Add a separate progress streak-history query and render a new calendar section in the existing progress page container with mobile bottom-sheet drilldown.

**Tech Stack:** Next.js 15, React 18, TypeScript, Convex, Tailwind CSS, shadcn/ui, Jest + React Testing Library

---

### Task 1: Add Journal Task Schema and Types

**Files:**
- Modify: `convex/schema.ts`
- Modify: `src/hooks/useJournal.ts`
- Create: `src/lib/journal/calendarTypes.ts`

**Step 1: Write the failing test**

```ts
it("exposes journal task types and task hook signatures", () => {
  type _Task = import("@/lib/journal/calendarTypes").JournalTaskItem;
  expect(true).toBe(true);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/journal/__tests__/calendarTypes.contract.test.ts`  
Expected: FAIL because file/types do not exist.

**Step 3: Write minimal implementation**

Implement:
- `journal_tasks` table in `convex/schema.ts` with indexes:
  - `by_space_due_date`
  - `by_assignee_due_date`
  - `by_page_updated`
- Frontend type contracts in `src/lib/journal/calendarTypes.ts`.
- Placeholder hook exports in `src/hooks/useJournal.ts` for task APIs.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/journal/__tests__/calendarTypes.contract.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add convex/schema.ts src/lib/journal/calendarTypes.ts src/hooks/useJournal.ts src/lib/journal/__tests__/calendarTypes.contract.test.ts
git commit -m "feat: add journal task schema and calendar type contracts"
```

### Task 2: Implement Journal Task CRUD + Permission Rules

**Files:**
- Modify: `convex/journal.ts`
- Test: `convex/lib/__tests__/journalTasks.test.ts`

**Step 1: Write the failing test**

```ts
it("rejects assigning private-space task to partner", async () => {
  await expect(createPrivateTaskAssignedToPartner()).rejects.toThrow("Invalid assignee");
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- convex/lib/__tests__/journalTasks.test.ts`  
Expected: FAIL because task mutations are not implemented.

**Step 3: Write minimal implementation**

Add mutations:
- `createJournalTask`
- `updateJournalTask`
- `toggleJournalTaskStatus`
- `archiveJournalTask`

Validation:
- Access must match space permissions.
- Shared space assignee must be current user or active partner.
- Private space assignee must be current user.

**Step 4: Run test to verify it passes**

Run: `npm test -- convex/lib/__tests__/journalTasks.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add convex/journal.ts convex/lib/__tests__/journalTasks.test.ts
git commit -m "feat: implement journal task mutations with assignment guardrails"
```

### Task 3: Implement Journal Calendar Aggregation Query

**Files:**
- Modify: `convex/journal.ts`
- Test: `convex/lib/__tests__/journalCalendarAggregation.test.ts`

**Step 1: Write the failing test**

```ts
it("returns normalized items for entries and tasks in selected range", async () => {
  const items = await listCalendarItemsFixture();
  expect(items.some((i) => i.itemType === "entry")).toBe(true);
  expect(items.some((i) => i.itemType === "task")).toBe(true);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- convex/lib/__tests__/journalCalendarAggregation.test.ts`  
Expected: FAIL because aggregation query does not exist.

**Step 3: Write minimal implementation**

Add query `listJournalCalendarItems` with args:
- `startDate`
- `endDate`
- `spaceType`
- `includeEntries`
- `includeTasks`
- `assigneeFilter`

Return normalized records with shared/private metadata and author/assignee fields.

**Step 4: Run test to verify it passes**

Run: `npm test -- convex/lib/__tests__/journalCalendarAggregation.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add convex/journal.ts convex/lib/__tests__/journalCalendarAggregation.test.ts
git commit -m "feat: add unified journal calendar aggregation query"
```

### Task 4: Wire Journal Task Hooks and Editor Task Block Support

**Files:**
- Modify: `src/hooks/useJournal.ts`
- Modify: `src/components/journal/JournalPageEditor.tsx`
- Test: `src/components/__tests__/journal-page-task-block.test.tsx`

**Step 1: Write the failing test**

```tsx
it("creates a task block with assignee and due date inside shared page editor", async () => {
  render(<JournalPageEditor />);
  expect(await screen.findByText(/Add task/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/__tests__/journal-page-task-block.test.tsx`  
Expected: FAIL because task block controls are missing.

**Step 3: Write minimal implementation**

Implement:
- Hook wrappers for new mutations/query.
- Task block UI in page editor:
  - title
  - due date
  - assignee selector (shared only)
  - status toggle

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/__tests__/journal-page-task-block.test.tsx`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/hooks/useJournal.ts src/components/journal/JournalPageEditor.tsx src/components/__tests__/journal-page-task-block.test.tsx
git commit -m "feat: add workspace task block creation and editing in journal pages"
```

### Task 5: Build Journal Unified Calendar Components (Desktop + Mobile)

**Files:**
- Create: `src/components/journal/JournalCalendarPanel.tsx`
- Create: `src/components/journal/JournalCalendarMonth.tsx`
- Create: `src/components/journal/JournalAgendaList.tsx`
- Create: `src/components/journal/JournalDaySheet.tsx`
- Modify: `src/components/journal/JournalHome.tsx`
- Test: `src/components/__tests__/journal-calendar-mobile.test.tsx`

**Step 1: Write the failing test**

```tsx
it("defaults to agenda-first on mobile and can toggle to month view", async () => {
  setMobileViewport();
  render(<JournalHome />);
  expect(await screen.findByText(/Today/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/__tests__/journal-calendar-mobile.test.tsx`  
Expected: FAIL because calendar panel does not exist.

**Step 3: Write minimal implementation**

Implement:
- Journal calendar tab/panel in `JournalHome`.
- Mobile default mode `agenda`.
- Month toggle.
- Filter chips.
- Day detail drawer (desktop) / bottom sheet (mobile).

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/__tests__/journal-calendar-mobile.test.tsx`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/journal/JournalCalendarPanel.tsx src/components/journal/JournalCalendarMonth.tsx src/components/journal/JournalAgendaList.tsx src/components/journal/JournalDaySheet.tsx src/components/journal/JournalHome.tsx src/components/__tests__/journal-calendar-mobile.test.tsx
git commit -m "feat: add mobile-first unified calendar to journal"
```

### Task 6: Add Progress Streak History Query

**Files:**
- Modify: `convex/progress.ts`
- Modify: `src/lib/progress/types.ts`
- Test: `src/lib/progress/__tests__/streakHistory.test.ts`

**Step 1: Write the failing test**

```ts
it("returns day-level streak status for user and partner", async () => {
  const result = await getStreakHistoryFixture();
  expect(result.days[0]).toHaveProperty("userStatus");
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/progress/__tests__/streakHistory.test.ts`  
Expected: FAIL because streak history query/type does not exist.

**Step 3: Write minimal implementation**

Add query `getStreakHistoryCalendar`:
- computes `done`/`missed`/`no_plan` per day
- returns user totals and optional partner totals
- enforces safe date range bounds

Add corresponding frontend types.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/progress/__tests__/streakHistory.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add convex/progress.ts src/lib/progress/types.ts src/lib/progress/__tests__/streakHistory.test.ts
git commit -m "feat: add progress streak history calendar query and types"
```

### Task 7: Build Progress Streak Calendar UI (Desktop + Mobile)

**Files:**
- Create: `src/components/progress/StreakHistoryCalendar.tsx`
- Create: `src/components/progress/StreakDayDetailsSheet.tsx`
- Modify: `src/hooks/useProgressMetrics.ts`
- Modify: `src/app/(app)/progress/page.tsx`
- Test: `src/components/__tests__/progress-streak-calendar-mobile.test.tsx`

**Step 1: Write the failing test**

```tsx
it("renders streak history calendar and opens day detail on tap", async () => {
  render(<ProgressPage />);
  expect(await screen.findByText(/Streak History Calendar/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/__tests__/progress-streak-calendar-mobile.test.tsx`  
Expected: FAIL because streak calendar UI is missing.

**Step 3: Write minimal implementation**

Implement:
- streak history card in progress page
- preset support (`30d`, `90d`, `1y`)
- dual status indicators per day
- mobile bottom sheet drilldown

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/__tests__/progress-streak-calendar-mobile.test.tsx`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/progress/StreakHistoryCalendar.tsx src/components/progress/StreakDayDetailsSheet.tsx src/hooks/useProgressMetrics.ts src/app/(app)/progress/page.tsx src/components/__tests__/progress-streak-calendar-mobile.test.tsx
git commit -m "feat: add progress streak history calendar with mobile drilldown"
```

### Task 8: Calendar Empty/Error/Refresh UX Hardening

**Files:**
- Modify: `src/components/journal/JournalCalendarPanel.tsx`
- Modify: `src/components/progress/StreakHistoryCalendar.tsx`
- Test: `src/components/__tests__/calendar-states.test.tsx`

**Step 1: Write the failing test**

```tsx
it("shows stable cached data while refreshing and graceful empty states", async () => {
  render(<ProgressPage />);
  expect(await screen.findByText(/No calendar activity/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/__tests__/calendar-states.test.tsx`  
Expected: FAIL because state handling is incomplete.

**Step 3: Write minimal implementation**

Add:
- empty states for no entries/tasks and no streak data
- recoverable error UI with retry
- refresh indicators while preserving prior render state

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/__tests__/calendar-states.test.tsx`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/journal/JournalCalendarPanel.tsx src/components/progress/StreakHistoryCalendar.tsx src/components/__tests__/calendar-states.test.tsx
git commit -m "feat: harden calendar loading, empty, and error states"
```

### Task 9: Final Verification and Documentation

**Files:**
- Modify: `docs/journal-workspace.md`
- Modify: `docs/progress-tracking.md`
- Modify: `docs/dashboard.md`

**Step 1: Run targeted tests**

Run: `npm test -- src/lib/journal/__tests__/calendarTypes.contract.test.ts src/components/__tests__/journal-page-task-block.test.tsx src/components/__tests__/journal-calendar-mobile.test.tsx src/lib/progress/__tests__/streakHistory.test.ts src/components/__tests__/progress-streak-calendar-mobile.test.tsx src/components/__tests__/calendar-states.test.tsx`  
Expected: PASS.

**Step 2: Run lint**

Run: `npm run lint`  
Expected: PASS, or only unrelated pre-existing warnings.

**Step 3: Manual smoke checks**

Run: `npm run dev`  
Verify:
- create workspace task block in shared and private pages
- assign shared-space task to partner
- journal calendar shows entries and tasks together
- mobile Journal defaults to agenda-first
- progress streak calendar displays both partner statuses and day detail sheet

**Step 4: Update docs**

Document:
- new `journal_tasks` model and APIs
- Journal calendar UX and mobile behavior
- Progress streak history query and component structure

**Step 5: Commit**

```bash
git add docs/journal-workspace.md docs/progress-tracking.md docs/dashboard.md
git commit -m "docs: add journal workspace tasks and progress streak calendar documentation"
```
