# Dashboard Mobile Optimization Design

**Date:** 2026-02-25  
**Status:** Approved

## Goal
Make the dashboard feel native on mobile (baseline 375px width) by reducing wasted spacing, improving information density, and preserving readability and tap accuracy.

## Scope
- Dashboard-specific UI optimization for mobile and small tablet widths.
- Keep existing visual language and component structure.
- Improve spacing, sizing, card layout behavior, nav density, and touch affordances.

## UX Principles
- Prioritize content over decoration on mobile.
- Avoid horizontal overflow entirely.
- Keep tap targets >= 40px visual height.
- Maintain clear hierarchy with compact but readable typography.

## Component-Level Changes
### Dashboard Layout
- Reduce mobile page padding and excessive vertical spacing.
- Keep desktop spacing unchanged.

### Hero + Welcome
- Compact hero height and animated ornament density for mobile.
- Scale down headline and streak numerals on small screens.
- Reduce top/bottom card padding while preserving emphasis.

### Core Cards (Tasks, Goals, Journal Pulse, Partner)
- Replace wide rows with mobile-first stacked layouts where needed.
- Ensure `min-w-0`, text truncation, and controlled wrapping in headers.
- Reduce internal padding from desktop-heavy values.

### Quick Actions
- Keep single column at mobile widths.
- Increase button touch comfort while limiting visual bloat.
- Limit description text lines to avoid long card heights.

### Bottom Navigation
- Shrink icon/label footprint to fit 6 tabs cleanly.
- Reduce horizontal button padding to prevent crowding.
- Keep active-state clarity.

## Additional Mobile Optimizations
- Reduce hover-only transforms that cause jitter on touch devices.
- Tighten motion durations and distances for smaller screens.
- Ensure buttons align with thumb ergonomics (full-width where appropriate).
- Normalize section spacing rhythm (`space-y-4` mobile, larger on desktop).

## Non-goals
- No dashboard IA redesign (no new tabs/flows in this pass).
- No backend data model changes.
- No major visual theme changes.

## Validation
- Manual viewport checks:
  - 375x812
  - 390x844
  - 768x1024
- Verify:
  - no horizontal scrolling
  - no clipped labels/buttons
  - no cramped bottom nav
  - tap targets remain usable
  - desktop layout unaffected
