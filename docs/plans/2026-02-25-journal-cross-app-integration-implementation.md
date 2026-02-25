# Journal Cross-App Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Connect Journal to Dashboard, Partner, and Notifications with shared-entry reactions/comments, journal insight widgets, and high-touch notification loops.

**Architecture:** Extend Convex journal schema with interaction/event records and expose aggregate queries for Dashboard and Partner surfaces. Reuse a shared interaction UI component across Journal, Dashboard, and Partner pages. Route new journal notification types through the existing notification dispatcher with dedupe/cooldown guards.

**Tech Stack:** Next.js 15, React 18, TypeScript, Convex (queries/mutations/schema), Jest/RTL

---

### Task 1: Add Journal Interaction/Event Schema

**Files:**
- Modify: `convex/schema.ts`
- Test: `src/lib/api/__tests__/journal-interactions.contract.test.ts`

**Step 1: Write the failing test**

```ts
it("denies adding interaction to non-shared journal entry", async () => {
  await expect(addReactionAsNonMember()).rejects.toThrow("Forbidden");
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/api/__tests__/journal-interactions.contract.test.ts`  
Expected: FAIL because interaction schema/functions do not exist.

**Step 3: Write minimal implementation**

```ts
// convex/schema.ts
journal_interactions: defineTable({
  entry_id: v.id("journal_entries"),
  user_id: v.id("users"),
  type: v.string(),
  reaction_key: v.optional(v.string()),
  comment_text: v.optional(v.string()),
  created_at: v.number(),
  updated_at: v.number(),
}).index("by_entry_created", ["entry_id", "created_at"]),

journal_events: defineTable({
  event_type: v.string(),
  entry_id: v.optional(v.id("journal_entries")),
  actor_user_id: v.optional(v.id("users")),
  target_user_id: v.optional(v.id("users")),
  partnership_id: v.optional(v.id("partnerships")),
  metadata_json: v.optional(v.string()),
  created_at: v.number(),
}).index("by_entry_created", ["entry_id", "created_at"]);
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/api/__tests__/journal-interactions.contract.test.ts`  
Expected: PASS for schema wiring.

**Step 5: Commit**

```bash
git add convex/schema.ts src/lib/api/__tests__/journal-interactions.contract.test.ts
git commit -m "feat: add journal interaction and event schema"
```

### Task 2: Implement Shared Entry Reactions and Comments

**Files:**
- Modify: `convex/journal.ts`
- Test: `src/lib/api/__tests__/journal-interactions.contract.test.ts`

**Step 1: Write the failing test**

```ts
it("adds reaction and comment for shared entry by partnership member", async () => {
  await addReaction(sharedEntryId, "support");
  await addComment(sharedEntryId, "Proud of this progress.");
  const interactions = await getEntryInteractions(sharedEntryId);
  expect(interactions.some((i) => i.type === "reaction")).toBe(true);
  expect(interactions.some((i) => i.type === "comment")).toBe(true);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/api/__tests__/journal-interactions.contract.test.ts`  
Expected: FAIL because mutation/query methods do not exist.

**Step 3: Write minimal implementation**

```ts
export const addReaction = mutation({ ... });
export const removeReaction = mutation({ ... });
export const addComment = mutation({ ... });
export const getEntryInteractions = query({ ... });
```

Implementation constraints:
- Allow only shared-entry interactions.
- Require active partnership membership.
- Comment text length clamp (e.g., 1..280).
- Record `journal_events` rows for reaction/comment creation.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/api/__tests__/journal-interactions.contract.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add convex/journal.ts src/lib/api/__tests__/journal-interactions.contract.test.ts
git commit -m "feat: add shared journal reactions and comments"
```

### Task 3: Add Dashboard and Partner Aggregate Journal Queries

**Files:**
- Modify: `convex/journal.ts`
- Modify: `src/hooks/useJournal.ts`
- Test: `src/lib/api/__tests__/journal-aggregates.contract.test.ts`

**Step 1: Write the failing test**

```ts
it("returns dashboard pulse metrics and partner reflections for active partnership", async () => {
  const pulse = await getDashboardJournalPulse();
  expect(pulse).toEqual(
    expect.objectContaining({
      privateStreakDays: expect.any(Number),
      sharedThisWeek: expect.any(Number),
      pendingResponseCount: expect.any(Number),
    })
  );
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/api/__tests__/journal-aggregates.contract.test.ts`  
Expected: FAIL because aggregate queries do not exist.

**Step 3: Write minimal implementation**

```ts
export const getDashboardJournalPulse = query({ ... });
export const getPartnerJournalActivity = query({ ... });
export const getJournalAlerts = query({ ... });
```

```ts
export function useDashboardJournalPulse() { ... }
export function usePartnerJournalActivity() { ... }
export function useJournalAlerts() { ... }
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/api/__tests__/journal-aggregates.contract.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add convex/journal.ts src/hooks/useJournal.ts src/lib/api/__tests__/journal-aggregates.contract.test.ts
git commit -m "feat: add journal aggregate queries for dashboard and partner views"
```

### Task 4: Extend Notification Event Handling for Journal Interaction Loops

**Files:**
- Modify: `convex/notifications.ts`
- Test: `src/lib/api/__tests__/notifications-journal-events.contract.test.ts`

**Step 1: Write the failing test**

```ts
it("creates deduped journal reaction notification with cooldown", async () => {
  await dispatchJournalReaction();
  await dispatchJournalReaction();
  const rows = await listJournalReactionNotifications();
  expect(rows.length).toBe(1);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/api/__tests__/notifications-journal-events.contract.test.ts`  
Expected: FAIL because new event types and dedupe checks are missing.

**Step 3: Write minimal implementation**

Add new `dispatchEvent` cases:
- `journal_entry_reacted`
- `journal_entry_commented`
- `journal_streak_risk`
- `journal_partner_silence_nudge`

Add dedupe/cooldown helper query usage:

```ts
const exists = await ctx.runQuery(internal.notifications.hasRecentNotification, {
  userId: args.recipientUserId,
  type: payload.type,
  relatedEntityType: payload.related_entity_type,
  relatedEntityId: payload.related_entity_id,
  sinceMs: Date.now() - cooldownMs,
});
if (exists) return { ok: true, deduped: true };
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/api/__tests__/notifications-journal-events.contract.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add convex/notifications.ts src/lib/api/__tests__/notifications-journal-events.contract.test.ts
git commit -m "feat: add high-touch journal notification events with dedupe"
```

### Task 5: Build Reusable Shared Entry Interaction UI

**Files:**
- Create: `src/components/journal/JournalEntryInteractions.tsx`
- Modify: `src/components/journal/JournalEntriesList.tsx`
- Test: `src/components/__tests__/journal-entry-interactions.test.tsx`

**Step 1: Write the failing test**

```tsx
it("submits a reaction and comment from shared entry card", async () => {
  render(<JournalEntryInteractions entryId="e1" ... />);
  await user.click(screen.getByRole("button", { name: /support/i }));
  await user.type(screen.getByPlaceholderText(/add a quick comment/i), "Nice work");
  await user.click(screen.getByRole("button", { name: /send/i }));
  expect(mockAddReaction).toHaveBeenCalled();
  expect(mockAddComment).toHaveBeenCalled();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/__tests__/journal-entry-interactions.test.tsx`  
Expected: FAIL because component does not exist.

**Step 3: Write minimal implementation**

```tsx
export default function JournalEntryInteractions({ entryId, ...props }) {
  // reaction chips + short comment input + compact interaction list
}
```

Integrate this component into shared entries in `JournalEntriesList`.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/__tests__/journal-entry-interactions.test.tsx`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/journal/JournalEntryInteractions.tsx src/components/journal/JournalEntriesList.tsx src/components/__tests__/journal-entry-interactions.test.tsx
git commit -m "feat: add reusable shared journal interaction component"
```

### Task 6: Integrate Journal Pulse and Partner Reflections into Dashboard

**Files:**
- Modify: `src/components/dashboard-content.tsx`
- Modify: `src/components/quick-actions.tsx`
- Test: `src/components/__tests__/dashboard-journal-pulse.test.tsx`

**Step 1: Write the failing test**

```tsx
it("renders journal pulse metrics and partner reflections on dashboard", async () => {
  render(<DashboardContent ... />);
  expect(await screen.findByText(/Journal Pulse/i)).toBeInTheDocument();
  expect(await screen.findByText(/Partner Reflections/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/__tests__/dashboard-journal-pulse.test.tsx`  
Expected: FAIL because widgets are missing.

**Step 3: Write minimal implementation**

- Add `Journal Pulse` card section wired to `useDashboardJournalPulse`.
- Add `Partner Reflections` list wired to `usePartnerJournalActivity`.
- Add dashboard quick actions for Journal flows.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/__tests__/dashboard-journal-pulse.test.tsx`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/dashboard-content.tsx src/components/quick-actions.tsx src/components/__tests__/dashboard-journal-pulse.test.tsx
git commit -m "feat: integrate journal pulse and partner reflections into dashboard"
```

### Task 7: Integrate Journal Activity into Partner Page

**Files:**
- Modify: `src/components/partner-view.tsx`
- Test: `src/components/__tests__/partner-journal-activity.test.tsx`

**Step 1: Write the failing test**

```tsx
it("shows journal activity items with quick interaction controls in partner page", async () => {
  render(<PartnerView ... />);
  await user.click(screen.getByRole("button", { name: /activity feed/i }));
  expect(await screen.findByText(/Journal Activity/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/__tests__/partner-journal-activity.test.tsx`  
Expected: FAIL because journal activity integration is missing.

**Step 3: Write minimal implementation**

- Add journal activity segment in Partner activity tab.
- Reuse `JournalEntryInteractions` for consistent reaction/comment behavior.
- Keep deep links to `/journal` context for full details.

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/__tests__/partner-journal-activity.test.tsx`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/partner-view.tsx src/components/__tests__/partner-journal-activity.test.tsx
git commit -m "feat: add journal activity loop to partner page"
```

### Task 8: Add Journal Notification Deep-Link Routing in Notification Center

**Files:**
- Modify: `src/components/notification-center.tsx`
- Test: `src/components/__tests__/notification-journal-deeplink.test.tsx`

**Step 1: Write the failing test**

```tsx
it("navigates to journal entry context from journal notification", async () => {
  render(<NotificationCenter />);
  await user.click(screen.getByText(/New Shared Journal Entry/i));
  expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("/journal"));
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/__tests__/notification-journal-deeplink.test.tsx`  
Expected: FAIL because journal deep-link handling is missing.

**Step 3: Write minimal implementation**

- Parse `related_entity_type`/`related_entity_id` for journal notifications.
- Add click CTA (`Open entry`) that routes to `/journal` (or `/journal/pages/...` when page context exists).

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/__tests__/notification-journal-deeplink.test.tsx`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/notification-center.tsx src/components/__tests__/notification-journal-deeplink.test.tsx
git commit -m "feat: add journal deep-link actions in notification center"
```

### Task 9: Documentation and Regression Validation

**Files:**
- Modify: `docs/journal-workspace.md`
- Modify: `docs/dashboard.md`
- Modify: `docs/partner-management.md`
- Modify: `docs/notifications.md`

**Step 1: Write verification checklist**

```md
- Share private entry -> partner receives notification
- Partner reacts/comments -> actor receives notification
- Dashboard pulse updates after interaction
- Partner activity feed reflects shared journal events
- Notification deep links open journal context
```

**Step 2: Run regression tests**

Run: `npm test -- src/components/__tests__/journal-*.test.tsx src/components/__tests__/dashboard-journal-pulse.test.tsx src/components/__tests__/partner-journal-activity.test.tsx src/components/__tests__/notification-journal-deeplink.test.tsx`  
Expected: PASS.

**Step 3: Update docs with final behavior and limits**

Document:
- Interaction permissions
- Notification cooldown policy
- Dashboard/Partner journal widgets

**Step 4: Run final focused checks**

Run: `npm run lint`  
Expected: PASS or only pre-existing unrelated warnings.

**Step 5: Commit**

```bash
git add docs/journal-workspace.md docs/dashboard.md docs/partner-management.md docs/notifications.md
git commit -m "docs: add journal cross-app integration behavior and validation checklist"
```
