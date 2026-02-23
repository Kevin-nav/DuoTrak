# Duo Journal + Notion-Style Duo Workspace Design

**Date:** 2026-02-23  
**Status:** Approved

## Goal
Add a dedicated journaling and workspace experience to DuoTrak that supports rich long-form writing, Notion-like block editing, strong search/filtering, and strict duo-first privacy.

## Product Scope
- Dedicated top-level `Journal` area in app navigation.
- Two primary spaces:
- Shared Journal (exactly two users in active partnership)
- My Private Journal (owner-only, optionally share specific entries/pages)
- Notion-like authoring:
- Block editor with headings, paragraph, checklist, quote, toggle, callout, image, and link references.
- Search and discovery:
- Full-text search over title and content
- Filters for space type, author, tags, date range, and linked goals/tasks.

## Architecture
- Convex is the primary runtime for this feature (existing DuoTrak pattern).
- New journal tables and mutations/queries are added in Convex with permission checks in every operation.
- Shared content is keyed to `partnership_id`; private content is keyed to `owner_user_id`.
- Search runs against pre-normalized indexed text per page/entry to support fast filterable querying.

## Data Model
### New Tables
- `journal_spaces`
- `type`: `shared` | `private`
- `partnership_id?`
- `owner_user_id?`
- `name`, `created_at`, `updated_at`
- `journal_pages`
- `space_id`, `title`, `icon?`, `is_archived`, `created_by`, `created_at`, `updated_at`
- `journal_blocks`
- `page_id`, `type`, `position`, `content`, `meta?`, `created_by`, `updated_at`
- `journal_entries`
- Daily/long-form entry records with `space_id`, `title`, `body`, `mood?`, `tags[]`, `entry_date`, `linked_goal_ids[]`, `linked_task_ids[]`, `created_by`, `updated_at`
- `journal_shares`
- Records private-to-shared sharing events, author/source linkage, `shared_at`
- `journal_search_index`
- `entity_type`, `entity_id`, normalized text fields, filters, timestamps.

## Permissions
- Shared operations allowed only if requester is one of the two users in the active partnership tied to that shared space.
- Private operations allowed only to `owner_user_id`.
- Sharing from private to shared requires both:
- requester owns private content
- requester has an active partnership and target shared space.

## UX Placement
- Add `Journal` in bottom navigation.
- Journal Home tabs:
- `Shared Journal`
- `My Private Journal`
- Primary actions:
- New Page
- New Entry
- Search
- Apply Filters
- Share Entry with Partner (private only)

## Data Flow
### Create Private Entry
1. User opens `Journal > My Private Journal`.
2. User creates entry/page via block editor.
3. Client calls Convex mutation to persist content and update search index.
4. UI updates optimistically.

### Create/Edit Shared Content
1. User opens `Journal > Shared Journal`.
2. User edits page/entry blocks.
3. Convex validates active partnership membership.
4. Content and index update in real time for both partners.

### Share Private Entry
1. User clicks `Share with Partner` on private content.
2. Mutation validates ownership + active partnership.
3. Creates shared copy/reference + share audit record.
4. Shared journal list updates for both users.

### Search
1. User types in Journal search.
2. Query runs with debounce.
3. Convex returns paginated matches with filter metadata.
4. UI presents grouped results (shared/private/pages/entries).

## Error Handling
- Typed errors and UX states for:
- `forbidden`
- `not_found`
- `invalid_block`
- `search_query_too_short`
- `partnership_required`
- Editor shows inline error toast + retry where possible.

## Testing Strategy
- Convex permission tests (shared/private access and sharing).
- Search tests (text relevance + filters).
- UI tests for journal routing, create/edit/share flow, and search UX.
- Regression checks to ensure existing partner/chat flows are unaffected.

## Rollout
### Phase 1
- Schema + permissions + Journal navigation + base editor + shared/private separation.

### Phase 2
- Search/filter system + list/calendar views + tags.

### Phase 3
- Templates, activity feed, version history, richer blocks and mentions.

## Non-Goals (v1)
- Multi-member shared spaces (>2 users)
- Third-party collaborative editing backends
- Complex docs permission matrices beyond duo/private
