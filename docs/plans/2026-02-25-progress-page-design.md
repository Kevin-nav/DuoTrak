# Progress Page (Src App) Design

**Date:** 2026-02-25  
**Status:** Approved

## Goal
Build a fully functional, mobile-friendly `/progress` page in the main `src` application using real Convex data only, with full analytics and partner comparison support.

## Scope Decisions
- Source of truth is `src/` only; ignore `duotrak-ui` and other copies.
- Full analytics scope is required (not a minimal version).
- Real data only; no mock/fake values.
- Partner requirement is enforced by existing app-level gating and should remain authoritative.
- Mobile friendliness is required as a first-class design constraint.

## Architecture
Use a dedicated Convex analytics query as the canonical data source for the progress experience.

- Add `convex/progress.ts`.
- Add primary query: `progress.getDashboardMetrics({ startDate, endDate, includePartner })`.
- Query returns chart-ready and card-ready analytics blocks for both user and optional partner comparison.
- Frontend page `src/app/(app)/progress/page.tsx` becomes a container that fetches once and renders.
- UI components in `src/components/progress/*` remain presentational and consume typed props.

Rationale: centralizing calculations server-side avoids metric drift across widgets, simplifies frontend logic, and improves testability.

## Component Design
Create a focused progress feature set under `src/components/progress/`:

- `ProgressPageContainer`
- `ProgressHeader`
- `ProgressFilters`
- `ProgressKpiGrid`
- `ProgressTrendChart`
- `ProgressConsistencyChart`
- `GoalProgressTable` (desktop) and/or `GoalProgressCards` (mobile)
- `AchievementPanel`
- `ProgressLoadingState`
- `ProgressErrorState`
- `ProgressEmptyState`

Responsibilities:
- Container owns date-range and partner-comparison state and query invocation.
- Presentational components render metrics only; no business rules in charts/cards.

## Data Flow
1. User navigates to `/progress`.
2. Container initializes range (`last 30 days`) and `includePartner=true`.
3. Call `useQuery(api.progress.getDashboardMetrics, { startDate, endDate, includePartner })`.
4. Convex query resolves user and partner context, aggregates task/goal data by range, computes all metrics.
5. Page renders all sections from one normalized payload.
6. Changing filters/toggles re-runs the same query and updates all sections consistently.

## Planned Query Output Shape
- `summary`
- `trends`
- `consistency`
- `goalBreakdown`
- `achievements`
- `partnerComparison` (when enabled and available)

## Error Handling
- Query failure: dedicated error state with retry.
- No data in range: empty state with preset range shortcuts.
- Partner comparison mismatch/partial data: non-blocking warning card while showing personal analytics.
- Invalid ranges: guarded in UI and validated in Convex args.

## Mobile-First UX Requirements
- Single-column stacking by default.
- KPI cards: compact 2-column mobile layout, wider multi-column on desktop.
- Compact chart mode on small screens (reduced labels, shorter height).
- Goal breakdown as cards on mobile; table on desktop.
- Filter controls collapse into touch-friendly compact controls.
- Avoid heavy animation on mobile; prioritize responsive scrolling and tap targets.

## Testing Strategy
- Convex unit tests for analytics calculations (summary, trends, consistency, comparison, achievements).
- Component tests for loading/error/empty/success states.
- Responsive verification on at least one narrow viewport.
- Integration check for query refresh when range/toggle changes.

## Constraints and Non-Goals
- Do not rely on duplicated UI directories.
- Do not introduce mock data for missing metrics.
- Do not weaken existing partner gating behavior.

## Next Step
Create a detailed implementation plan using the `writing-plans` skill and save it as a separate plan document.
