# Implementation Plan - Journal Workspace UX Refactor

## Phase 1: Shell Refactor (Layout & Navigation)
- [x] Install `react-resizable-panels` and `vaul` (if not already present).
- [x] Refactor `JournalHome.tsx` to use a 3-column grid/panel layout on desktop.
- [x] Move `JournalPagesPanel` into the left sidebar.
- [x] Move `JournalCalendarPanel` into the right sidebar.
- [x] Implement a mobile-only FAB for entry creation.
- [x] Implement mobile drawers for Calendar and Pages.

## Phase 2: Writing & Expressiveness
- [x] Integrate simulated Rich Text editor/toolbar into `JournalComposer`.
- [x] Update `JournalEntriesList` to render rich content and display moods.
- [x] Add visual Mood Selector to the composer.
- [ ] Implement Mood Pulse sparkline (basic version).

## Phase 3: Duo Partnership Features
- [x] Implement "Duo Prompt" of the day in the Shared Space.
- [x] Update composer to allow linking entries to active Goals.
- [x] Add "Partner Activity" indicators to the right sidebar.

## Verification
- [ ] Test desktop layout responsiveness (resizing panels).
- [ ] Test mobile drawer interactions and FAB.
- [ ] Verify that Shared vs. Private context switching is clear and persistent.
