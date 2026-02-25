# Progress Tracking

## Description
The Progress Tracking feature provides a full analytics view for partnered users in the main `src` app. It renders completion metrics, trends, consistency, goal-level progress, and achievement signals from real Convex data.

## Frontend Implementation

### Pages/Routes
- `src/app/(app)/progress/page.tsx`:
    - **Purpose:** Entry point for progress analytics.
    - **Mechanism:** Client container that manages date presets (`7d/30d/90d`), partner comparison toggle, and renders loading/empty/error/success states.
    - **Data Source:** `api.progress.getDashboardMetrics`.
    - **Mobile:** Mobile-first layout with stacked sections and goal cards on small screens.

### Components
- `src/components/progress/ProgressHeader.tsx`
- `src/components/progress/ProgressFilters.tsx`
- `src/components/progress/ProgressKpiGrid.tsx`
- `src/components/progress/ProgressTrendChart.tsx`
- `src/components/progress/ProgressConsistencyChart.tsx`
- `src/components/progress/GoalProgressCards.tsx` (mobile)
- `src/components/progress/GoalProgressTable.tsx` (desktop)
- `src/components/progress/AchievementPanel.tsx`
- `src/components/progress/ProgressLoadingState.tsx`
- `src/components/progress/ProgressErrorState.tsx`
- `src/components/progress/ProgressEmptyState.tsx`

### Contexts/Hooks/Libs
- `src/hooks/useProgressMetrics.ts`: Convex query wrapper for progress payload.
- `src/lib/progress/dateRange.ts`: Preset and range normalization helpers.
- `src/lib/progress/types.ts`: Typed contracts for metrics payload and component props.

### Data Flow (Frontend)
1. Page selects preset range and partner comparison preference.
2. Hook calls `api.progress.getDashboardMetrics({ startDate, endDate, includePartner })`.
3. UI renders:
   - Summary KPI grid
   - Daily trend chart
   - Weekly consistency chart
   - Goal progress breakdown
   - Achievement panel
4. Changing filters re-runs the same query and updates all widgets.

## Backend Implementation
- `convex/progress.ts`
  - Query: `getDashboardMetrics`
  - Aggregates user task instances and goals for a date range.
  - Computes summary metrics, trend points, consistency points, per-goal breakdown, and achievements.
  - Optionally computes partner comparison metrics when requested and available.

## Dependencies/Integrations
- Convex query runtime (`convex/progress.ts`)
- Recharts for trend/consistency visuals
- Existing app partner gating in `src/app/(app)/layout.tsx` remains authoritative
