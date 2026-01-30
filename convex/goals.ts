import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * List all non-archived goals for the current user, including their tasks.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
      .unique();

    if (!user) {
      return [];
    }

    const goals = await ctx.db
      .query("goals")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .filter((q) => q.eq(q.field("is_archived"), false))
      .collect();

    // Fetch tasks for each goal
    const goalsWithTasks = await Promise.all(
      goals.map(async (goal) => {
        const tasks = await ctx.db
          .query("tasks")
          .withIndex("by_goal", (q) => q.eq("goal_id", goal._id))
          .collect();
        return { ...goal, tasks };
      })
    );

    return goalsWithTasks;
  },
});

/**
 * Create a new goal, optionally with initial tasks.
 */
export const create = mutation({
  args: {
    name: v.string(),
    category: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    is_habit: v.boolean(),
    tasks: v.optional(
      v.array(
        v.object({
          name: v.string(),
          description: v.optional(v.string()),
          repeat_frequency: v.optional(v.string()),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated call to createGoal");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const goalId = await ctx.db.insert("goals", {
      name: args.name,
      category: args.category,
      icon: args.icon,
      color: args.color,
      is_habit: args.is_habit,
      is_archived: false,
      user_id: user._id,
      updated_at: Date.now(),
    });

    if (args.tasks && args.tasks.length > 0) {
      for (const task of args.tasks) {
        await ctx.db.insert("tasks", {
          name: task.name,
          description: task.description,
          repeat_frequency: task.repeat_frequency,
          status: "pending",
          goal_id: goalId,
          updated_at: Date.now(),
        });
      }
    }

    return goalId;
  },
});

/**
 * Archive a goal.
 */
export const archive = mutation({
  args: { id: v.id("goals") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }
    
    // Verify ownership
    const goal = await ctx.db.get(args.id);
    if (!goal) {
      throw new Error("Goal not found");
    }
    
    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
      .unique();

    if (!user || goal.user_id !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.id, { 
      is_archived: true,
      updated_at: Date.now()
    });
  },
});
