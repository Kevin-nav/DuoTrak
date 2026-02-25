# Dashboard Mobile Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve dashboard mobile usability at 375px baseline by reducing wasted space, fixing crowded elements, and ensuring responsive card behavior without altering desktop UX.

**Architecture:** Apply mobile-first Tailwind refinements to existing dashboard components and navigation rather than introducing new feature architecture. Keep behavior and data flow unchanged while tuning spacing, layout stacking, typography scaling, and interaction affordances.

**Tech Stack:** Next.js 15, React 18, TypeScript, Tailwind CSS, Framer Motion

---

### Task 1: Tighten Dashboard Shell Spacing

**Files:**
- Modify: `src/components/dashboard-layout.tsx`

**Step 1: Identify mobile spacing waste**
- Confirm existing `px` and `pt/pb` values are desktop-biased.

**Step 2: Apply minimal responsive spacing changes**
- Reduce mobile paddings (`px-3`, lower top/bottom spacing).
- Preserve `sm+` and desktop spacing behavior.

**Step 3: Verify no layout regression**
- Run local visual check on dashboard route at mobile/desktop sizes.

**Step 4: Commit**

```bash
git add src/components/dashboard-layout.tsx
git commit -m "fix: optimize dashboard shell spacing for mobile screens"
```

### Task 2: Compact Hero and Welcome Sections

**Files:**
- Modify: `src/components/duo-streak-hero.tsx`
- Modify: `src/components/dashboard-content.tsx`

**Step 1: Reduce hero density on mobile**
- Lower padding, icon size, counter size, and ornament prominence.

**Step 2: Reduce welcome card waste**
- Tighten heading/body font sizes and card padding on mobile.

**Step 3: Keep desktop visual emphasis**
- Preserve larger values on `sm/md+`.

**Step 4: Commit**

```bash
git add src/components/duo-streak-hero.tsx src/components/dashboard-content.tsx
git commit -m "fix: compact hero and welcome sections for mobile dashboard"
```

### Task 3: Improve Card Responsiveness for Tasks and Goals

**Files:**
- Modify: `src/components/todays-tasks.tsx`
- Modify: `src/components/goals-highlights.tsx`

**Step 1: Make card internals mobile-first**
- Convert dense horizontal layouts to stacked/flexible arrangements on narrow widths.
- Add `min-w-0`/truncate protections for long text.

**Step 2: Improve action accessibility**
- Use full-width or wrapped action controls where needed on mobile.

**Step 3: Validate readability**
- Ensure labels/status text are not clipped at 375px.

**Step 4: Commit**

```bash
git add src/components/todays-tasks.tsx src/components/goals-highlights.tsx
git commit -m "fix: make dashboard task and goal cards mobile responsive"
```

### Task 4: Improve Journal Pulse and Partner Card Mobile Layout

**Files:**
- Modify: `src/components/dashboard-content.tsx`
- Modify: `src/components/journal/JournalEntryInteractions.tsx`

**Step 1: Tighten journal pulse grid and headers**
- Keep compact 1-column mobile summary and cleaner card spacing.

**Step 2: Make interaction controls mobile-safe**
- Ensure reaction chips wrap cleanly.
- Keep comment input/action usable without crowding.

**Step 3: Validate partner reflection cards**
- Ensure no overflow and button/CTA clarity on small widths.

**Step 4: Commit**

```bash
git add src/components/dashboard-content.tsx src/components/journal/JournalEntryInteractions.tsx
git commit -m "fix: optimize journal pulse and interactions for mobile"
```

### Task 5: Refine Quick Actions and Bottom Navigation

**Files:**
- Modify: `src/components/quick-actions.tsx`
- Modify: `src/components/layout/BottomNavbar.tsx`

**Step 1: Adjust quick action density**
- Keep one-column mobile layout and refine text/tap target balance.

**Step 2: Reduce bottom nav crowding**
- Lower icon size and per-tab padding for 6-tab fit.
- Keep active tab legible and tappable.

**Step 3: Validate at 375px and 390px**
- Ensure no overlap/clipping in nav labels/icons.

**Step 4: Commit**

```bash
git add src/components/quick-actions.tsx src/components/layout/BottomNavbar.tsx
git commit -m "fix: improve quick actions and bottom nav for mobile widths"
```

### Task 6: Final Validation and Docs Note

**Files:**
- Modify: `docs/dashboard.md`

**Step 1: Run checks**

Run: `npm run lint`  
Expected: PASS.

**Step 2: Manual responsive pass**
- Check dashboard at 375x812, 390x844, and desktop width.

**Step 3: Document mobile behavior updates**
- Add a short note in dashboard docs about mobile spacing and card responsiveness.

**Step 4: Commit**

```bash
git add docs/dashboard.md
git commit -m "docs: document dashboard mobile optimization behavior"
```
