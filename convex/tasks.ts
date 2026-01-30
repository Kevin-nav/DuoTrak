import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Helper to validate task ownership via goal and user.
 */
async function validateTaskOwnership(ctx: any, taskId: any, firebaseUid: string) {
  const task = await ctx.db.get(taskId);
  if (!task) throw new Error("Task not found");

  const goal = await ctx.db.get(task.goal_id);
  if (!goal) throw new Error("Goal not found");

  const user = await ctx.db
    .query("users")
    .withIndex("by_firebase_uid", (q: any) => q.eq("firebase_uid", firebaseUid))
    .unique();

  if (!user || goal.user_id !== user._id) {
    throw new Error("Unauthorized");
  }

  return task;
}

export const create = mutation({
  args: {
    goal_id: v.id("goals"),
    name: v.string(),
    description: v.optional(v.string()),
    repeat_frequency: v.optional(v.string()),
    due_date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Verify goal ownership
    const goal = await ctx.db.get(args.goal_id);
    if (!goal) throw new Error("Goal not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
      .unique();

    if (!user || goal.user_id !== user._id) {
      throw new Error("Unauthorized");
    }

    const taskId = await ctx.db.insert("tasks", {
      name: args.name,
      description: args.description,
      repeat_frequency: args.repeat_frequency,
      due_date: args.due_date,
      status: "pending",
      goal_id: args.goal_id,
      updated_at: Date.now(),
    });

    return taskId;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("tasks"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    await validateTaskOwnership(ctx, args.id, identity.subject);

    await ctx.db.patch(args.id, {
      status: args.status,
      updated_at: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("tasks"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    repeat_frequency: v.optional(v.string()),
    due_date: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    await validateTaskOwnership(ctx, args.id, identity.subject);

    await ctx.db.patch(args.id, {
      ...args,
      updated_at: Date.now(),
    });
  },
});

export const delete_ = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    await validateTaskOwnership(ctx, args.id, identity.subject);

    await ctx.db.delete(args.id);
  },
});
