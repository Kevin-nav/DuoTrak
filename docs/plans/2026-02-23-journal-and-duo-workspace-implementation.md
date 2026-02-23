# Duo Journal + Notion-Style Duo Workspace Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a duo-only journal and Notion-style workspace with shared/private spaces, block-based editing, and full-text search with filters.

**Architecture:** Extend the existing Convex-first runtime with new journal tables, strict duo/private authorization checks, and a dedicated journal UI surface in Next.js. Shared content is anchored to `partnership_id`; private content is anchored to `owner_user_id`. Search is implemented through indexed normalized text stored in Convex and queried with pagination/filter args.

**Tech Stack:** Next.js 15, React 18, TypeScript, Convex (queries/mutations/schema), Tailwind CSS, Jest/React Testing Library

---

### Task 1: Journal Schema Foundations

**Files:**
- Modify: `convex/schema.ts`
- Create: `convex/journal.ts`
- Modify: `convex/_generated/api.d.ts` (auto-generated via Convex codegen)

**Step 1: Write the failing test**

```ts
// src/lib/api/__tests__/journal.contract.test.ts
it("rejects access to shared journal when user is not in partnership", async () => {
  await expect(getSharedJournalForNonMember()).rejects.toThrow("Forbidden");
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/api/__tests__/journal.contract.test.ts`  
Expected: FAIL because journal API/schema does not exist.

**Step 3: Write minimal implementation**

```ts
// convex/schema.ts
journal_spaces: defineTable({ ... }),
journal_pages: defineTable({ ... }),
journal_blocks: defineTable({ ... }),
journal_entries: defineTable({ ... }),
journal_shares: defineTable({ ... }),
journal_search_index: defineTable({ ... })
```

```ts
// convex/journal.ts
export const getOrCreateSpaces = mutation({ ... });
export const getSharedHome = query({ ... });
export const getPrivateHome = query({ ... });
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/api/__tests__/journal.contract.test.ts`  
Expected: PASS for baseline permission and schema wiring.

**Step 5: Commit**

```bash
git add convex/schema.ts convex/journal.ts src/lib/api/__tests__/journal.contract.test.ts
git commit -m "feat: add journal schema and core duo/private access guards"
```

### Task 2: Journal Domain Types and API Client Hooks

**Files:**
- Create: `packages/domain/src/journal.ts`
- Modify: `packages/domain/src/index.ts`
- Create: `src/hooks/useJournal.ts`
- Modify: `src/lib/api/client.ts` (or Convex-only helper if this file is no longer active for new features)
- Test: `packages/domain/src/__tests__/journal.test.ts`

**Step 1: Write the failing test**

```ts
it("maps Convex journal entry to domain model with default fields", () => {
  expect(mapJournalEntryFromConvex(raw)).toEqual(expected);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- packages/domain/src/__tests__/journal.test.ts`  
Expected: FAIL because journal mapper/types do not exist.

**Step 3: Write minimal implementation**

```ts
export type JournalSpaceType = "shared" | "private";
export interface JournalEntry { ... }
export function mapJournalEntryFromConvex(raw: any): JournalEntry { ... }
```

```ts
export function useJournalHome(spaceType: JournalSpaceType) { ... }
export function useCreateJournalEntry(spaceType: JournalSpaceType) { ... }
```

**Step 4: Run test to verify it passes**

Run: `npm test -- packages/domain/src/__tests__/journal.test.ts`  
Expected: PASS.

**Step 5: Commit**

```bash
git add packages/domain/src/journal.ts packages/domain/src/index.ts src/hooks/useJournal.ts packages/domain/src/__tests__/journal.test.ts
git commit -m "feat: add journal domain models and hooks"
```

### Task 3: Journal Navigation and Route Shell

**Files:**
- Modify: `src/components/layout/BottomNavbar.tsx`
- Create: `src/app/(app)/journal/page.tsx`
- Create: `src/components/journal/JournalHome.tsx`
- Test: `src/components/__tests__/journal-navigation.test.tsx`

**Step 1: Write the failing test**

```tsx
it("shows Journal tab and routes to /journal", async () => {
  render(<BottomNavbar />);
  await user.click(screen.getByText("Journal"));
  expect(mockPush).toHaveBeenCalledWith("/journal");
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/__tests__/journal-navigation.test.tsx`  
Expected: FAIL because Journal tab/page is missing.

**Step 3: Write minimal implementation**

```tsx
// BottomNavbar.tsx
{ id: "journal", label: "Journal", icon: BookOpen, path: "/journal" }
```

```tsx
// src/app/(app)/journal/page.tsx
export default function JournalPage() { return <JournalHome />; }
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/__tests__/journal-navigation.test.tsx`  
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/layout/BottomNavbar.tsx src/app/(app)/journal/page.tsx src/components/journal/JournalHome.tsx src/components/__tests__/journal-navigation.test.tsx
git commit -m "feat: add journal route and app navigation entry"
```

### Task 4: Shared/Private Journal CRUD + Share Flow

**Files:**
- Modify: `convex/journal.ts`
- Create: `src/components/journal/JournalEditor.tsx`
- Create: `src/components/journal/JournalList.tsx`
- Test: `src/components/__tests__/journal-share-flow.test.tsx`

**Step 1: Write the failing test**

```tsx
it("shares a private entry into shared journal when partnership exists", async () => {
  await user.click(screen.getByRole("button", { name: /share with partner/i }));
  expect(await screen.findByText(/shared/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/__tests__/journal-share-flow.test.tsx`  
Expected: FAIL because share mutation/UI is missing.

**Step 3: Write minimal implementation**

```ts
// convex/journal.ts
export const createEntry = mutation({ ... });
export const updateEntry = mutation({ ... });
export const deleteEntry = mutation({ ... });
export const sharePrivateEntry = mutation({ ... });
```

```tsx
// JournalEditor.tsx
// create/edit long-form entry + block list + share action for private content
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/__tests__/journal-share-flow.test.tsx`  
Expected: PASS.

**Step 5: Commit**

```bash
git add convex/journal.ts src/components/journal/JournalEditor.tsx src/components/journal/JournalList.tsx src/components/__tests__/journal-share-flow.test.tsx
git commit -m "feat: implement journal CRUD and private-to-shared share flow"
```

### Task 5: Search and Filtered Discovery

**Files:**
- Modify: `convex/journal.ts`
- Create: `src/components/journal/JournalSearch.tsx`
- Modify: `src/components/journal/JournalHome.tsx`
- Test: `src/components/__tests__/journal-search.test.tsx`

**Step 1: Write the failing test**

```tsx
it("filters journal results by text, space type, and date", async () => {
  await user.type(screen.getByPlaceholderText(/search journals/i), "gratitude");
  expect(await screen.findByText(/results/i)).toBeInTheDocument();
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- src/components/__tests__/journal-search.test.tsx`  
Expected: FAIL because search query/UI is missing.

**Step 3: Write minimal implementation**

```ts
export const search = query({
  args: { q: v.string(), spaceType: v.optional(v.string()), authorId: v.optional(v.id("users")), dateFrom: v.optional(v.number()), dateTo: v.optional(v.number()), tags: v.optional(v.array(v.string())), cursor: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => { ... }
});
```

```tsx
// JournalSearch.tsx
// debounced search input + filter controls + paginated results
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/__tests__/journal-search.test.tsx`  
Expected: PASS.

**Step 5: Commit**

```bash
git add convex/journal.ts src/components/journal/JournalSearch.tsx src/components/journal/JournalHome.tsx src/components/__tests__/journal-search.test.tsx
git commit -m "feat: add journal search and filtering"
```

### Task 6: Documentation and Regression Validation

**Files:**
- Modify: `docs/dashboard.md`
- Create: `docs/journal-workspace.md`
- Modify: `docs/plans/2026-02-23-journal-and-duo-workspace-design.md`

**Step 1: Write the failing test**

```md
Manual verification checklist with expected outcomes for journal workflows.
```

**Step 2: Run verification to confirm gaps**

Run: `npm test -- src/components/__tests__/journal-*.test.tsx`  
Expected: Identify any remaining regressions.

**Step 3: Write minimal implementation**

```md
Document feature architecture, permissions, and test checklist.
```

**Step 4: Run test to verify it passes**

Run: `npm test -- src/components/__tests__/journal-*.test.tsx`  
Expected: PASS.

**Step 5: Commit**

```bash
git add docs/journal-workspace.md docs/dashboard.md docs/plans/2026-02-23-journal-and-duo-workspace-design.md
git commit -m "docs: add duo journal and workspace documentation"
```
