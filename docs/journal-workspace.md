# Journal + Duo Workspace

This feature adds a dedicated journal surface with both private and shared spaces for a two-person partnership.

## Primary user-facing features
- Shared Journal for duo collaboration.
- Private Journal for personal writing.
- Share private entry to partner.
- Search journals by text, tag, space type, and date.
- Notion-style workspace pages (foundational support).

## Key routes
- `src/app/(app)/journal/page.tsx`

## Core frontend components
- `src/components/journal/JournalHome.tsx`
- `src/components/journal/JournalSearch.tsx`
- `src/components/journal/JournalComposer.tsx`
- `src/components/journal/JournalEntriesList.tsx`
- `src/components/journal/JournalPagesPanel.tsx`

## Convex backend
- `convex/schema.ts` (journal tables)
- `convex/journal.ts` (queries and mutations)

## Permission model
- Private space: owner-only access.
- Shared space: exactly two users in an active partnership.
- Share action: private owner can publish an entry to shared space.

## Notion-style foundation included
- `journal_pages` and `journal_blocks` tables.
- APIs to create/list pages and replace page blocks.
- This enables future rich block editor UX without schema redesign.
