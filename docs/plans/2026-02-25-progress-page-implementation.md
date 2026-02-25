# Progress Page (Src App) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the placeholder `/progress` route in `src` with a fully functional, mobile-friendly analytics page powered by real Convex data and partner comparison.

**Architecture:** Add a new server-side aggregation query in Convex (`progress.getDashboardMetrics`) that computes all metrics for a date range (user + optional partner). Keep the Next.js page as a thin container that manages filters and renders presentational components from one normalized payload. Implement mobile-first UI sections with dedicated loading/error/empty states.

**Tech Stack:** Next.js 15, React 18, TypeScript, Convex, Jest + React Testing Library, Tailwind CSS, Recharts

---

### Task 1: Add Progress Analytics Contract and Type Definitions

**Files:**
- Create: `src/lib/progress/types.ts`
- Create: `src/lib/progress/dateRange.ts`
- Test: `src/lib/progress/__tests__/dateRange.test.ts`

**Step 1: Write the failing test**

```ts
import { normalizeDateRange } from "@/lib/progress/dateRange";

it("normalizes start/end to day boundaries and rejects inverted ranges", () => {
  expect(() =>
    normalizeDateRange({ startDate: 2000, endDate: 1000 }),
  ).toThrow("Invalid date range");
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/progress/__tests__/dateRange.test.ts`  
Expected: FAIL because files/functions do not exist.

**Step 3: Write minimal implementation**

```ts
export function normalizeDateRange(input: { startDate: number; endDate: number }) {
  if (input.endDate < input.startDate) throw new Error("Invalid date range");
  return { startDate: input.startDate, endDate: input.endDate };
}
```

Also define typed response interfaces in `types.ts` for:
- `ProgressSummary`
- `ProgressTrendPoint`
- `ProgressConsistencyPoint`
- `GoalBreakdownItem`
- `AchievementItem`
- `ProgressDashboardMetrics`

**Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/progress/__tests__/dateRange.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/lib/progress/types.ts src/lib/progress/dateRange.ts src/lib/progress/__tests__/dateRange.test.ts
git commit -m "feat: add progress analytics type contracts and range normalization"
```

### Task 2: Implement Convex Progress Query (User Metrics)

**Files:**
- Create: `convex/progress.ts`
- Modify: `convex/_generated/api.d.ts` (generated via Convex codegen)
- Test: `src/lib/progress/__tests__/metrics-summary.test.ts`

**Step 1: Write the failing test**

```ts
it("computes completion metrics for a user range", async () => {
  const result = await getDashboardMetricsForFixture();
  expect(result.summary.totalTasks).toBeGreaterThan(0);
  expect(result.summary.completionRate).toBeGreaterThanOrEqual(0);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/progress/__tests__/metrics-summary.test.ts`  
Expected: FAIL because query/metrics calculator does not exist.

**Step 3: Write minimal implementation**

Implement query:

```ts
export const getDashboardMetrics = query({
  args: { startDate: v.number(), endDate: v.number(), includePartner: v.optional(v.boolean()) },
  handler: async (ctx, args) => { /* aggregate user task_instances + goals */ }
});
```

Initial metrics (user only):
- total/completed task instances in range
- completion rate
- active goals
- goals completed in range
- daily trend points
- consistency points
- per-goal breakdown
- achievement derivation

**Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/progress/__tests__/metrics-summary.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add convex/progress.ts src/lib/progress/__tests__/metrics-summary.test.ts convex/_generated/api.d.ts
git commit -m "feat: add convex progress dashboard query for user analytics"
```

### Task 3: Extend Convex Query for Partner Comparison

**Files:**
- Modify: `convex/progress.ts`
- Test: `src/lib/progress/__tests__/metrics-partner-comparison.test.ts`

**Step 1: Write the failing test**

```ts
it("returns partner comparison block when includePartner=true", async () => {
  const result = await getDashboardMetricsWithPartnerFixture();
  expect(result.partnerComparison).toBeDefined();
  expect(result.partnerComparison?.partnerSummary.totalTasks).toBeGreaterThanOrEqual(0);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/progress/__tests__/metrics-partner-comparison.test.ts`  
Expected: FAIL because partner block is not implemented.

**Step 3: Write minimal implementation**

Add partner resolution from active partnership and return:
- partner summary KPIs
- partner trend series aligned by date
- comparison deltas (completion rate and completed tasks)

Guard behavior:
- if includePartner is false: omit block
- if partner data unavailable: return user data with `partnerComparison: null` and a warning flag

**Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/progress/__tests__/metrics-partner-comparison.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add convex/progress.ts src/lib/progress/__tests__/metrics-partner-comparison.test.ts
git commit -m "feat: add partner comparison metrics to progress query"
```

### Task 4: Create Progress Hooks and Route Container

**Files:**
- Create: `src/hooks/useProgressMetrics.ts`
- Modify: `src/app/(app)/progress/page.tsx`
- Test: `src/components/__tests__/progress-page-container.test.tsx`

**Step 1: Write the failing test**

```tsx
it("loads and renders KPI section for default 30-day range", async () => {
  render(<ProgressPage />);
  expect(await screen.findByText(/Completion Rate/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/__tests__/progress-page-container.test.tsx`  
Expected: FAIL because page is still placeholder.

**Step 3: Write minimal implementation**

- Build `useProgressMetrics` wrapper around `useQuery(api.progress.getDashboardMetrics, ...)`.
- Replace placeholder page with container logic:
  - default range: 30 days
  - partner toggle state
  - loading/error/empty branching

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/__tests__/progress-page-container.test.tsx`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/hooks/useProgressMetrics.ts src/app/(app)/progress/page.tsx src/components/__tests__/progress-page-container.test.tsx
git commit -m "feat: replace progress placeholder with convex-backed container"
```

### Task 5: Build Mobile-First Progress UI Sections

**Files:**
- Create: `src/components/progress/ProgressHeader.tsx`
- Create: `src/components/progress/ProgressFilters.tsx`
- Create: `src/components/progress/ProgressKpiGrid.tsx`
- Create: `src/components/progress/ProgressTrendChart.tsx`
- Create: `src/components/progress/ProgressConsistencyChart.tsx`
- Create: `src/components/progress/GoalProgressCards.tsx`
- Create: `src/components/progress/GoalProgressTable.tsx`
- Create: `src/components/progress/AchievementPanel.tsx`
- Test: `src/components/__tests__/progress-mobile-layout.test.tsx`

**Step 1: Write the failing test**

```tsx
it("uses card-based goal breakdown and compact filters on mobile viewport", async () => {
  setMobileViewport();
  render(<ProgressPage />);
  expect(await screen.findByTestId("goal-progress-cards")).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/__tests__/progress-mobile-layout.test.tsx`  
Expected: FAIL because components are missing.

**Step 3: Write minimal implementation**

Implement responsive behavior:
- single-column stacking base
- compact mobile filter controls
- goal cards on mobile, table on desktop
- chart wrappers with reduced heights/labels on mobile

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/__tests__/progress-mobile-layout.test.tsx`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/progress/*.tsx src/components/__tests__/progress-mobile-layout.test.tsx
git commit -m "feat: add mobile-first progress analytics UI sections"
```

### Task 6: Add Loading, Error, and Empty States

**Files:**
- Create: `src/components/progress/ProgressLoadingState.tsx`
- Create: `src/components/progress/ProgressErrorState.tsx`
- Create: `src/components/progress/ProgressEmptyState.tsx`
- Modify: `src/app/(app)/progress/page.tsx`
- Test: `src/components/__tests__/progress-states.test.tsx`

**Step 1: Write the failing test**

```tsx
it("renders empty state with quick range actions when range has no data", async () => {
  mockProgressNoData();
  render(<ProgressPage />);
  expect(await screen.findByText(/No activity in this range/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/__tests__/progress-states.test.tsx`  
Expected: FAIL because states are not implemented.

**Step 3: Write minimal implementation**

- Add dedicated state components.
- Wire retry callback in error state.
- Add quick range action buttons in empty state.
- Display non-blocking partner warning card when partner block is unavailable.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/__tests__/progress-states.test.tsx`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/progress/ProgressLoadingState.tsx src/components/progress/ProgressErrorState.tsx src/components/progress/ProgressEmptyState.tsx src/app/(app)/progress/page.tsx src/components/__tests__/progress-states.test.tsx
git commit -m "feat: add progress loading, empty, and error states"
```

### Task 7: Integration Wiring and Navigation Validation

**Files:**
- Modify: `src/components/layout/BottomNavbar.tsx` (if needed for active-state behavior only)
- Modify: `src/components/quick-actions.tsx` (if needed for consistency)
- Test: `src/components/__tests__/progress-navigation.test.tsx`

**Step 1: Write the failing test**

```tsx
it("navigates to functional /progress page from quick actions", async () => {
  render(<QuickActions hasPartner />);
  await user.click(screen.getByText(/View Progress/i));
  expect(mockPush).toHaveBeenCalledWith("/progress");
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/__tests__/progress-navigation.test.tsx`  
Expected: FAIL only if wiring/active state is inconsistent.

**Step 3: Write minimal implementation**

- Ensure route is consistently linked and active-state styling is correct.
- Keep partner gating behavior unchanged.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/__tests__/progress-navigation.test.tsx`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/layout/BottomNavbar.tsx src/components/quick-actions.tsx src/components/__tests__/progress-navigation.test.tsx
git commit -m "chore: validate progress route navigation and active state"
```

### Task 8: Final Verification and Documentation

**Files:**
- Modify: `docs/progress-tracking.md`
- Modify: `docs/dashboard.md` (cross-link where relevant)

**Step 1: Run targeted test suite**

Run: `npm test -- src/lib/progress/__tests__/dateRange.test.ts src/lib/progress/__tests__/metrics-summary.test.ts src/lib/progress/__tests__/metrics-partner-comparison.test.ts src/components/__tests__/progress-page-container.test.tsx src/components/__tests__/progress-mobile-layout.test.tsx src/components/__tests__/progress-states.test.tsx src/components/__tests__/progress-navigation.test.tsx`  
Expected: PASS.

**Step 2: Run lint**

Run: `npm run lint`  
Expected: PASS, or only unrelated pre-existing warnings.

**Step 3: Update docs**

Document:
- New Convex query contract
- `/progress` component structure
- Mobile behavior and partner comparison behavior

**Step 4: Manual smoke test**

Run: `npm run dev`  
Verify:
- `/progress` loads real metrics
- range changes update all widgets
- partner comparison toggle updates charts/cards
- mobile viewport renders compact layout

**Step 5: Commit**

```bash
git add docs/progress-tracking.md docs/dashboard.md
git commit -m "docs: update progress tracking for convex analytics and mobile behavior"
```
