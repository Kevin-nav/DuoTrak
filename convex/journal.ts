import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

type SpaceType = "shared" | "private";
const COMMENT_MAX_LENGTH = 280;

async function getCurrentUserOrThrow(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_firebase_uid", (q: any) => q.eq("firebase_uid", identity.subject))
    .first();

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

async function getActivePartnershipForUser(ctx: any, userId: Id<"users">) {
  const p1 = await ctx.db
    .query("partnerships")
    .withIndex("by_user1", (q: any) => q.eq("user1_id", userId))
    .filter((q: any) => q.eq(q.field("status"), "active"))
    .first();

  if (p1) return p1;

  return await ctx.db
    .query("partnerships")
    .withIndex("by_user2", (q: any) => q.eq("user2_id", userId))
    .filter((q: any) => q.eq(q.field("status"), "active"))
    .first();
}

async function getOrCreatePrivateSpace(ctx: any, userId: Id<"users">) {
  const existing = await ctx.db
    .query("journal_spaces")
    .withIndex("by_owner_type", (q: any) => q.eq("owner_user_id", userId).eq("type", "private"))
    .first();

  if (existing) return existing;

  const now = Date.now();
  const id = await ctx.db.insert("journal_spaces", {
    type: "private",
    name: "My Private Journal",
    owner_user_id: userId,
    created_by: userId,
    created_at: now,
    updated_at: now,
  });
  return await ctx.db.get(id);
}

async function getOrCreateSharedSpace(ctx: any, userId: Id<"users">) {
  const partnership = await getActivePartnershipForUser(ctx, userId);
  if (!partnership) return null;

  const existing = await ctx.db
    .query("journal_spaces")
    .withIndex("by_partnership_type", (q: any) =>
      q.eq("partnership_id", partnership._id).eq("type", "shared")
    )
    .first();

  if (existing) return existing;

  const now = Date.now();
  const id = await ctx.db.insert("journal_spaces", {
    type: "shared",
    name: "Shared Journal",
    partnership_id: partnership._id,
    created_by: userId,
    created_at: now,
    updated_at: now,
  });
  return await ctx.db.get(id);
}

async function canAccessSpace(ctx: any, userId: Id<"users">, space: any) {
  if (space.type === "private") {
    return space.owner_user_id === userId;
  }
  if (space.type === "shared") {
    if (!space.partnership_id) return false;
    const partnership = (await ctx.db.get(space.partnership_id)) as any;
    if (!partnership || partnership.status !== "active") return false;
    return partnership.user1_id === userId || partnership.user2_id === userId;
  }
  return false;
}

function toDayKey(ts: number) {
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function getEntrySharedContextOrThrow(ctx: any, userId: Id<"users">, entryId: Id<"journal_entries">) {
  const entry = await ctx.db.get(entryId);
  if (!entry) throw new Error("Not found");
  const space = await ctx.db.get(entry.space_id);
  if (!space) throw new Error("Not found");
  const allowed = await canAccessSpace(ctx, userId, space);
  if (!allowed) throw new Error("Forbidden");
  if (space.type !== "shared") throw new Error("Only shared entries support this action");
  if (!space.partnership_id) throw new Error("Partnership required");
  const partnership = (await ctx.db.get(space.partnership_id)) as any;
  if (!partnership || partnership.status !== "active") throw new Error("Partnership required");
  const partnerUserId =
    partnership.user1_id === userId ? partnership.user2_id : partnership.user1_id;

  return { entry, space, partnership, partnerUserId };
}

async function recomputeInteractionCounters(ctx: any, entryId: Id<"journal_entries">) {
  const interactions = await ctx.db
    .query("journal_interactions")
    .withIndex("by_entry_created", (q: any) => q.eq("entry_id", entryId))
    .collect();

  const reactionCount = interactions.filter((i: any) => i.type === "reaction").length;
  const commentCount = interactions.filter((i: any) => i.type === "comment").length;
  const lastInteractionAt = interactions.length
    ? Math.max(...interactions.map((i: any) => i.created_at))
    : undefined;

  await ctx.db.patch(entryId, {
    reaction_count: reactionCount,
    comment_count: commentCount,
    last_interaction_at: lastInteractionAt,
    updated_at: Date.now(),
  });
}

async function createJournalEvent(ctx: any, payload: {
  event_type: string;
  entry_id?: Id<"journal_entries">;
  actor_user_id?: Id<"users">;
  target_user_id?: Id<"users">;
  partnership_id?: Id<"partnerships">;
  metadata_json?: string;
}) {
  await ctx.db.insert("journal_events", {
    ...payload,
    created_at: Date.now(),
  });
}

export const ensureSpaces = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    const privateSpace = await getOrCreatePrivateSpace(ctx, user._id);
    const sharedSpace = await getOrCreateSharedSpace(ctx, user._id);
    return {
      privateSpaceId: privateSpace?._id ?? null,
      sharedSpaceId: sharedSpace?._id ?? null,
      hasSharedSpace: !!sharedSpace,
    };
  },
});

export const getHome = query({
  args: {
    spaceType: v.string(), // 'shared' | 'private'
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const limit = Math.min(args.limit ?? 25, 100);
    const normalizedType = (args.spaceType === "shared" ? "shared" : "private") as SpaceType;

    let space: any = null;
    if (normalizedType === "private") {
      space = await getOrCreatePrivateSpace(ctx, user._id);
    } else {
      space = await getOrCreateSharedSpace(ctx, user._id);
      if (!space) {
        return {
          space: null,
          entries: [],
          message: "No active partner yet. Shared journal will appear once partnership is active.",
        };
      }
    }

    const allowed = await canAccessSpace(ctx, user._id, space);
    if (!allowed) {
      throw new Error("Forbidden");
    }

    const entries = await ctx.db
      .query("journal_entries")
      .withIndex("by_space_updated", (q: any) => q.eq("space_id", space._id))
      .order("desc")
      .take(limit);

    const entriesWithAuthors = await Promise.all(
      entries.map(async (entry: any) => {
        const author = (await ctx.db.get(entry.created_by)) as any;
        return {
          ...entry,
          author_name: author?.full_name || author?.nickname || author?.email || "Unknown",
        };
      })
    );

    return {
      space,
      entries: entriesWithAuthors,
      message: null,
    };
  },
});

export const getEntriesPage = query({
  args: {
    spaceType: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const normalizedType = (args.spaceType === "shared" ? "shared" : "private") as SpaceType;

    let space: any = null;
    if (normalizedType === "private") {
      space = await getOrCreatePrivateSpace(ctx, user._id);
    } else {
      space = await getOrCreateSharedSpace(ctx, user._id);
      if (!space) {
        return {
          page: [],
          isDone: true,
          continueCursor: "",
        };
      }
    }

    const allowed = await canAccessSpace(ctx, user._id, space);
    if (!allowed) {
      throw new Error("Forbidden");
    }

    const paginated = await ctx.db
      .query("journal_entries")
      .withIndex("by_space_updated", (q: any) => q.eq("space_id", space._id))
      .order("desc")
      .paginate(args.paginationOpts);

    const page = await Promise.all(
      paginated.page.map(async (entry: any) => {
        const author = (await ctx.db.get(entry.created_by)) as any;
        return {
          ...entry,
          author_name: author?.full_name || author?.nickname || author?.email || "Unknown",
        };
      })
    );

    return {
      ...paginated,
      page,
    };
  },
});

export const createEntry = mutation({
  args: {
    spaceType: v.string(),
    title: v.string(),
    body: v.string(),
    mood: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    entry_date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const normalizedType = (args.spaceType === "shared" ? "shared" : "private") as SpaceType;
    const space =
      normalizedType === "shared"
        ? await getOrCreateSharedSpace(ctx, user._id)
        : await getOrCreatePrivateSpace(ctx, user._id);

    if (!space) {
      throw new Error("Partnership required");
    }

    const allowed = await canAccessSpace(ctx, user._id, space);
    if (!allowed) {
      throw new Error("Forbidden");
    }

    const now = Date.now();
    const entryDate = args.entry_date ?? now;
    const tags = (args.tags || []).map((t) => t.trim()).filter(Boolean);

    const entryId = await ctx.db.insert("journal_entries", {
      space_id: space._id,
      title: args.title.trim() || "Untitled Entry",
      body: args.body,
      mood: args.mood,
      tags,
      entry_date: entryDate,
      is_archived: false,
      reaction_count: 0,
      comment_count: 0,
      created_by: user._id,
      created_at: now,
      updated_at: now,
    });

    await ctx.db.insert("journal_search_index", {
      entity_type: "entry",
      entity_id: String(entryId),
      space_id: space._id,
      searchable_text: `${args.title}\n${args.body}`.toLowerCase(),
      tags,
      author_id: user._id,
      entry_date: entryDate,
      updated_at: now,
    });

    await ctx.db.patch(space._id, { updated_at: now });

    return entryId;
  },
});

export const listPages = query({
  args: {
    spaceType: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const normalizedType = (args.spaceType === "shared" ? "shared" : "private") as SpaceType;
    const space =
      normalizedType === "shared"
        ? await getOrCreateSharedSpace(ctx, user._id)
        : await getOrCreatePrivateSpace(ctx, user._id);

    if (!space) return [];
    const allowed = await canAccessSpace(ctx, user._id, space);
    if (!allowed) throw new Error("Forbidden");

    return await ctx.db
      .query("journal_pages")
      .withIndex("by_space_updated", (q: any) => q.eq("space_id", space._id))
      .order("desc")
      .take(100);
  },
});

export const createPage = mutation({
  args: {
    spaceType: v.string(),
    title: v.string(),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const normalizedType = (args.spaceType === "shared" ? "shared" : "private") as SpaceType;
    const space =
      normalizedType === "shared"
        ? await getOrCreateSharedSpace(ctx, user._id)
        : await getOrCreatePrivateSpace(ctx, user._id);

    if (!space) throw new Error("Partnership required");
    const allowed = await canAccessSpace(ctx, user._id, space);
    if (!allowed) throw new Error("Forbidden");

    const now = Date.now();
    return await ctx.db.insert("journal_pages", {
      space_id: space._id,
      title: args.title.trim() || "Untitled Page",
      icon: args.icon,
      is_archived: false,
      created_by: user._id,
      created_at: now,
      updated_at: now,
    });
  },
});

export const getPageWithBlocks = query({
  args: {
    pageId: v.id("journal_pages"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const page = await ctx.db.get(args.pageId);
    if (!page) throw new Error("Not found");
    const space = await ctx.db.get(page.space_id);
    if (!space) throw new Error("Not found");
    const allowed = await canAccessSpace(ctx, user._id, space);
    if (!allowed) throw new Error("Forbidden");

    const blocks = await ctx.db
      .query("journal_blocks")
      .withIndex("by_page_position", (q: any) => q.eq("page_id", page._id))
      .collect();

    return { page, blocks };
  },
});

export const replacePageBlocks = mutation({
  args: {
    pageId: v.id("journal_pages"),
    blocks: v.array(
      v.object({
        type: v.string(),
        content: v.optional(v.string()),
        checked: v.optional(v.boolean()),
        meta_json: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const page = await ctx.db.get(args.pageId);
    if (!page) throw new Error("Not found");
    const space = await ctx.db.get(page.space_id);
    if (!space) throw new Error("Not found");
    const allowed = await canAccessSpace(ctx, user._id, space);
    if (!allowed) throw new Error("Forbidden");

    const now = Date.now();
    const existing = await ctx.db
      .query("journal_blocks")
      .withIndex("by_page_position", (q: any) => q.eq("page_id", page._id))
      .collect();

    await Promise.all(existing.map((block) => ctx.db.delete(block._id)));
    for (let i = 0; i < args.blocks.length; i += 1) {
      const block = args.blocks[i];
      await ctx.db.insert("journal_blocks", {
        page_id: page._id,
        type: block.type,
        content: block.content,
        checked: block.checked,
        position: i,
        meta_json: block.meta_json,
        created_by: user._id,
        updated_at: now,
      });
    }

    await ctx.db.patch(page._id, {
      updated_at: now,
    });
    await ctx.db.patch(space._id, {
      updated_at: now,
    });
    return { success: true };
  },
});

export const updateEntry = mutation({
  args: {
    entryId: v.id("journal_entries"),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    mood: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const entry = await ctx.db.get(args.entryId);
    if (!entry) {
      throw new Error("Not found");
    }
    const space = await ctx.db.get(entry.space_id);
    if (!space) {
      throw new Error("Not found");
    }

    const allowed = await canAccessSpace(ctx, user._id, space);
    if (!allowed) {
      throw new Error("Forbidden");
    }

    const now = Date.now();
    const nextTitle = args.title ?? entry.title;
    const nextBody = args.body ?? entry.body;
    const nextTags = (args.tags ?? entry.tags ?? []).map((t: string) => t.trim()).filter(Boolean);

    await ctx.db.patch(entry._id, {
      title: nextTitle,
      body: nextBody,
      mood: args.mood ?? entry.mood,
      tags: nextTags,
      updated_at: now,
    });

    const existingIndex = await ctx.db
      .query("journal_search_index")
      .withIndex("by_space", (q: any) => q.eq("space_id", space._id))
      .filter((q: any) => q.eq(q.field("entity_id"), String(entry._id)))
      .first();

    if (existingIndex) {
      await ctx.db.patch(existingIndex._id, {
        searchable_text: `${nextTitle}\n${nextBody}`.toLowerCase(),
        tags: nextTags,
        updated_at: now,
      });
    }

    await ctx.db.patch(space._id, { updated_at: now });
    return { success: true };
  },
});

export const sharePrivateEntry = mutation({
  args: {
    entryId: v.id("journal_entries"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const sourceEntry = await ctx.db.get(args.entryId);
    if (!sourceEntry) throw new Error("Not found");

    const sourceSpace = await ctx.db.get(sourceEntry.space_id);
    if (!sourceSpace || sourceSpace.type !== "private") {
      throw new Error("Only private entries can be shared");
    }
    if (sourceSpace.owner_user_id !== user._id) {
      throw new Error("Forbidden");
    }

    const partnership = await getActivePartnershipForUser(ctx, user._id);
    if (!partnership) throw new Error("Partnership required");

    const sharedSpace = await getOrCreateSharedSpace(ctx, user._id);
    if (!sharedSpace) throw new Error("Partnership required");

    const now = Date.now();
    const sharedEntryId = await ctx.db.insert("journal_entries", {
      space_id: sharedSpace._id,
      title: sourceEntry.title,
      body: sourceEntry.body,
      mood: sourceEntry.mood,
      tags: sourceEntry.tags,
      entry_date: sourceEntry.entry_date,
      is_archived: false,
      shared_from_entry_id: sourceEntry._id,
      reaction_count: 0,
      comment_count: 0,
      created_by: user._id,
      created_at: now,
      updated_at: now,
    });

    await ctx.db.insert("journal_shares", {
      source_entry_id: sourceEntry._id,
      shared_entry_id: sharedEntryId,
      from_user_id: user._id,
      to_partnership_id: partnership._id,
      shared_at: now,
      updated_at: now,
    });

    await ctx.db.insert("journal_search_index", {
      entity_type: "entry",
      entity_id: String(sharedEntryId),
      space_id: sharedSpace._id,
      searchable_text: `${sourceEntry.title}\n${sourceEntry.body}`.toLowerCase(),
      tags: sourceEntry.tags,
      author_id: user._id,
      entry_date: sourceEntry.entry_date,
      updated_at: now,
    });

    const partnerUserId =
      partnership.user1_id === user._id ? partnership.user2_id : partnership.user1_id;

    await ctx.scheduler.runAfter(
      0,
      (internal as any).notifications.dispatchEvent,
      {
        eventType: "journal_entry_shared",
        recipientUserId: partnerUserId,
        actorUserId: user._id,
        context: JSON.stringify({
          entryId: String(sharedEntryId),
          title: sourceEntry.title,
        }),
      }
    );

    await createJournalEvent(ctx, {
      event_type: "entry_shared",
      entry_id: sharedEntryId,
      actor_user_id: user._id,
      target_user_id: partnerUserId,
      partnership_id: partnership._id,
      metadata_json: JSON.stringify({
        title: sourceEntry.title,
      }),
    });

    return sharedEntryId;
  },
});

export const addReaction = mutation({
  args: {
    entryId: v.id("journal_entries"),
    reactionKey: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const reactionKey = args.reactionKey.trim().slice(0, 32);
    if (!reactionKey) throw new Error("Invalid reaction");
    const { entry, partnership } = await getEntrySharedContextOrThrow(ctx, user._id, args.entryId);

    const existing = await ctx.db
      .query("journal_interactions")
      .withIndex("by_entry_user_type", (q: any) =>
        q.eq("entry_id", args.entryId).eq("user_id", user._id).eq("type", "reaction")
      )
      .collect();

    const duplicate = existing.find((item: any) => item.reaction_key === reactionKey);
    if (!duplicate) {
      const now = Date.now();
      await ctx.db.insert("journal_interactions", {
        entry_id: args.entryId,
        user_id: user._id,
        type: "reaction",
        reaction_key: reactionKey,
        created_at: now,
        updated_at: now,
      });
      await createJournalEvent(ctx, {
        event_type: "entry_reaction_added",
        entry_id: args.entryId,
        actor_user_id: user._id,
        target_user_id: entry.created_by,
        partnership_id: partnership._id,
        metadata_json: JSON.stringify({ reactionKey }),
      });
      if (entry.created_by !== user._id) {
        await ctx.scheduler.runAfter(
          0,
          (internal as any).notifications.dispatchEvent,
          {
            eventType: "journal_entry_reacted",
            recipientUserId: entry.created_by,
            actorUserId: user._id,
            context: JSON.stringify({
              entryId: String(args.entryId),
              reactionKey,
              title: entry.title,
            }),
          }
        );
      }
      await recomputeInteractionCounters(ctx, args.entryId);
    }

    return { ok: true };
  },
});

export const removeReaction = mutation({
  args: {
    entryId: v.id("journal_entries"),
    reactionKey: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const reactionKey = args.reactionKey.trim();
    if (!reactionKey) throw new Error("Invalid reaction");
    await getEntrySharedContextOrThrow(ctx, user._id, args.entryId);

    const existing = await ctx.db
      .query("journal_interactions")
      .withIndex("by_entry_user_type", (q: any) =>
        q.eq("entry_id", args.entryId).eq("user_id", user._id).eq("type", "reaction")
      )
      .collect();

    const target = existing.find((item: any) => item.reaction_key === reactionKey);
    if (target) {
      await ctx.db.delete(target._id);
      await recomputeInteractionCounters(ctx, args.entryId);
    }

    return { ok: true };
  },
});

export const addComment = mutation({
  args: {
    entryId: v.id("journal_entries"),
    commentText: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const commentText = args.commentText.trim().slice(0, COMMENT_MAX_LENGTH);
    if (!commentText) throw new Error("Comment cannot be empty");
    const { entry, partnership } = await getEntrySharedContextOrThrow(ctx, user._id, args.entryId);
    const now = Date.now();

    const interactionId = await ctx.db.insert("journal_interactions", {
      entry_id: args.entryId,
      user_id: user._id,
      type: "comment",
      comment_text: commentText,
      created_at: now,
      updated_at: now,
    });

    await createJournalEvent(ctx, {
      event_type: "entry_comment_added",
      entry_id: args.entryId,
      actor_user_id: user._id,
      target_user_id: entry.created_by,
      partnership_id: partnership._id,
      metadata_json: JSON.stringify({
        preview: commentText.slice(0, 80),
      }),
    });

    if (entry.created_by !== user._id) {
      await ctx.scheduler.runAfter(
        0,
        (internal as any).notifications.dispatchEvent,
        {
          eventType: "journal_entry_commented",
          recipientUserId: entry.created_by,
          actorUserId: user._id,
          context: JSON.stringify({
            entryId: String(args.entryId),
            preview: commentText.slice(0, 80),
            title: entry.title,
          }),
        }
      );
    }

    await recomputeInteractionCounters(ctx, args.entryId);
    return interactionId;
  },
});

export const getEntryInteractions = query({
  args: {
    entryId: v.id("journal_entries"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    await getEntrySharedContextOrThrow(ctx, user._id, args.entryId);
    const interactions = await ctx.db
      .query("journal_interactions")
      .withIndex("by_entry_created", (q: any) => q.eq("entry_id", args.entryId))
      .order("desc")
      .take(120);

    return await Promise.all(
      interactions.map(async (item: any) => {
        const author = await ctx.db.get(item.user_id);
        return {
          ...item,
          author_name: (author as any)?.full_name || (author as any)?.nickname || (author as any)?.email || "Unknown",
          is_mine: item.user_id === user._id,
        };
      })
    );
  },
});

export const getDashboardJournalPulse = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const privateSpace = await getOrCreatePrivateSpace(ctx, user._id);
    const sharedSpace = await getOrCreateSharedSpace(ctx, user._id);
    const partnership = sharedSpace?.partnership_id
      ? ((await ctx.db.get(sharedSpace.partnership_id)) as any)
      : null;
    const partnerUserId =
      partnership
        ? (partnership.user1_id === user._id ? partnership.user2_id : partnership.user1_id)
        : null;

    const privateEntries = privateSpace
      ? await ctx.db
          .query("journal_entries")
          .withIndex("by_space_updated", (q: any) => q.eq("space_id", privateSpace._id))
          .order("desc")
          .take(200)
      : [];

    const sharedEntries = sharedSpace
      ? await ctx.db
          .query("journal_entries")
          .withIndex("by_space_updated", (q: any) => q.eq("space_id", sharedSpace._id))
          .order("desc")
          .take(200)
      : [];

    const sharedThisWeek = sharedEntries.filter((entry: any) => entry.created_at >= now - (7 * oneDayMs)).length;

    const entryDays = Array.from(new Set(privateEntries.map((entry: any) => toDayKey(entry.entry_date || entry.created_at))));
    let privateStreakDays = 0;
    let cursor = new Date(now);
    while (entryDays.includes(toDayKey(cursor.getTime()))) {
      privateStreakDays += 1;
      cursor = new Date(cursor.getTime() - oneDayMs);
    }

    let pendingResponseCount = 0;
    if (partnerUserId) {
      const partnerEntries = sharedEntries.filter((entry: any) => entry.created_by === partnerUserId);
      for (const entry of partnerEntries) {
        const mine = await ctx.db
          .query("journal_interactions")
          .withIndex("by_entry_user_type", (q: any) =>
            q.eq("entry_id", entry._id).eq("user_id", user._id).eq("type", "comment")
          )
          .first();
        const mineReaction = await ctx.db
          .query("journal_interactions")
          .withIndex("by_entry_user_type", (q: any) =>
            q.eq("entry_id", entry._id).eq("user_id", user._id).eq("type", "reaction")
          )
          .first();
        if (!mine && !mineReaction) pendingResponseCount += 1;
      }
    }

    const partnerReflections = await Promise.all(
      sharedEntries
        .filter((entry: any) => partnerUserId && entry.created_by === partnerUserId)
        .slice(0, 3)
        .map(async (entry: any) => {
          const author = await ctx.db.get(entry.created_by);
          return {
            ...entry,
            author_name: (author as any)?.full_name || (author as any)?.nickname || (author as any)?.email || "Partner",
          };
        })
    );

    return {
      privateStreakDays,
      sharedThisWeek,
      pendingResponseCount,
      partnerReflections,
      hasSharedSpace: !!sharedSpace,
    };
  },
});

export const getPartnerJournalActivity = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const sharedSpace = await getOrCreateSharedSpace(ctx, user._id);
    if (!sharedSpace) return { entries: [], total: 0 };
    const partnership = (await ctx.db.get(sharedSpace.partnership_id)) as any;
    if (!partnership || partnership.status !== "active") return { entries: [], total: 0 };
    const partnerUserId =
      partnership.user1_id === user._id ? partnership.user2_id : partnership.user1_id;

    const limit = Math.min(args.limit ?? 12, 50);
    const entries = await ctx.db
      .query("journal_entries")
      .withIndex("by_space_updated", (q: any) => q.eq("space_id", sharedSpace._id))
      .order("desc")
      .take(200);

    const partnerEntries = entries.filter((entry: any) => entry.created_by === partnerUserId).slice(0, limit);
    const withAuthor = await Promise.all(
      partnerEntries.map(async (entry: any) => {
        const author = await ctx.db.get(entry.created_by);
        return {
          ...entry,
          author_name: (author as any)?.full_name || (author as any)?.nickname || (author as any)?.email || "Partner",
        };
      })
    );

    return {
      entries: withAuthor,
      total: withAuthor.length,
    };
  },
});

export const getJournalAlerts = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const privateSpace = await getOrCreatePrivateSpace(ctx, user._id);
    const sharedSpace = await getOrCreateSharedSpace(ctx, user._id);
    const partnership = sharedSpace?.partnership_id
      ? ((await ctx.db.get(sharedSpace.partnership_id)) as any)
      : null;
    const partnerUserId =
      partnership
        ? (partnership.user1_id === user._id ? partnership.user2_id : partnership.user1_id)
        : null;

    const privateLatest = privateSpace
      ? await ctx.db
          .query("journal_entries")
          .withIndex("by_space_updated", (q: any) => q.eq("space_id", privateSpace._id))
          .order("desc")
          .first()
      : null;
    const daysSincePrivate = privateLatest ? Math.floor((now - privateLatest.created_at) / oneDayMs) : 999;

    const sharedEntries = sharedSpace
      ? await ctx.db
          .query("journal_entries")
          .withIndex("by_space_updated", (q: any) => q.eq("space_id", sharedSpace._id))
          .order("desc")
          .take(120)
      : [];

    const userSharedToday = sharedEntries.some((entry: any) => entry.created_by === user._id && toDayKey(entry.created_at) === toDayKey(now));

    let pendingPartnerResponseCount = 0;
    if (partnerUserId) {
      const mine = sharedEntries.filter((entry: any) => entry.created_by === user._id);
      for (const entry of mine) {
        const partnerComment = await ctx.db
          .query("journal_interactions")
          .withIndex("by_entry_user_type", (q: any) =>
            q.eq("entry_id", entry._id).eq("user_id", partnerUserId).eq("type", "comment")
          )
          .first();
        const partnerReaction = await ctx.db
          .query("journal_interactions")
          .withIndex("by_entry_user_type", (q: any) =>
            q.eq("entry_id", entry._id).eq("user_id", partnerUserId).eq("type", "reaction")
          )
          .first();
        if (!partnerComment && !partnerReaction) pendingPartnerResponseCount += 1;
      }
    }

    return {
      streakAtRisk: daysSincePrivate >= 1,
      noShareToday: !!sharedSpace && !userSharedToday,
      pendingPartnerResponseCount,
    };
  },
});

export const search = query({
  args: {
    q: v.string(),
    spaceType: v.optional(v.string()),
    tag: v.optional(v.string()),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const term = args.q.trim().toLowerCase();
    if (term.length < 2) {
      return { results: [], total: 0 };
    }

    const privateSpace = await getOrCreatePrivateSpace(ctx, user._id);
    const sharedSpace = await getOrCreateSharedSpace(ctx, user._id);
    const accessibleSpaceIds = [privateSpace?._id, sharedSpace?._id].filter(Boolean);
    const limit = Math.min(args.limit ?? 50, 100);

    const hits: any[] = [];
    for (const spaceId of accessibleSpaceIds) {
      const list = await ctx.db
        .query("journal_entries")
        .withIndex("by_space_updated", (q: any) => q.eq("space_id", spaceId))
        .order("desc")
        .take(200);
      hits.push(...list);
    }

    const filtered = hits
      .filter((entry) => {
        const text = `${entry.title}\n${entry.body}\n${(entry.tags || []).join(" ")}`.toLowerCase();
        if (!text.includes(term)) return false;
        if (args.spaceType && args.spaceType !== "all") {
          const isShared = sharedSpace?._id === entry.space_id;
          if (args.spaceType === "shared" && !isShared) return false;
          if (args.spaceType === "private" && isShared) return false;
        }
        if (args.tag && !(entry.tags || []).some((t: string) => t.toLowerCase() === args.tag!.toLowerCase())) {
          return false;
        }
        if (args.dateFrom && entry.entry_date < args.dateFrom) return false;
        if (args.dateTo && entry.entry_date > args.dateTo) return false;
        return true;
      })
      .slice(0, limit);

    const results = await Promise.all(
      filtered.map(async (entry) => {
        const author = (await ctx.db.get(entry.created_by)) as any;
        return {
          ...entry,
          space_type: sharedSpace?._id === entry.space_id ? "shared" : "private",
          author_name: author?.full_name || author?.nickname || author?.email || "Unknown",
        };
      })
    );

    return {
      results,
      total: results.length,
    };
  },
});
