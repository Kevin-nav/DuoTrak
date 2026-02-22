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

    // Fetch tasks for each goal and calculate progress
    const goalsWithTasks = await Promise.all(
      goals.map(async (goal) => {
        const tasks = await ctx.db
          .query("tasks")
          .withIndex("by_goal", (q) => q.eq("goal_id", goal._id))
          .collect();
        
        const total = tasks.length;
        const progress = tasks.filter(t => t.status === "completed" || t.status === "Completed").length;
        
        // Determine goal status
        let status = "On Track";
        if (total > 0 && progress === total) status = "Completed";

        return { 
          ...goal, 
          tasks, 
          total, 
          progress, 
          status 
        };
      })
    );

    return goalsWithTasks;
  },
});

/**
 * Get a single goal by ID.
 */
export const get = query({
  args: { id: v.id("goals") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const goal = await ctx.db.get(args.id);
    if (!goal) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
      .unique();

    if (!user || goal.user_id !== user._id) return null;

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_goal", (q) => q.eq("goal_id", goal._id))
      .collect();
      
    const total = tasks.length;
    const progress = tasks.filter(t => t.status === "completed" || t.status === "Completed").length;
    let status = "On Track";
    if (total > 0 && progress === total) status = "Completed";

    return { 
      ...goal, 
      tasks, 
      total, 
      progress, 
      status 
    };
  },
});

/**
 * Create a new goal, optionally with initial tasks.
 */
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    motivation: v.optional(v.string()),
    category: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    is_habit: v.boolean(),
    availability: v.optional(v.array(v.string())),
    time_commitment: v.optional(v.string()),
    accountability_type: v.optional(v.string()),
    tasks: v.optional(
      v.array(
        v.object({
          name: v.string(),
          description: v.optional(v.string()),
          repeat_frequency: v.optional(v.string()),
          time_window: v.optional(v.string()),
          accountability_type: v.optional(v.string()),
          verification_mode: v.optional(v.string()),
          verification_mode_reason: v.optional(v.string()),
          verification_confidence: v.optional(v.number()),
          auto_approval_policy: v.optional(v.string()),
          auto_approval_timeout_hours: v.optional(v.number()),
          auto_approval_min_confidence: v.optional(v.number()),
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
      description: args.description,
      motivation: args.motivation,
      category: args.category,
      icon: args.icon,
      color: args.color,
      is_habit: args.is_habit,
      is_archived: false,
      availability: args.availability,
      time_commitment: args.time_commitment,
      accountability_type: args.accountability_type,
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
          time_window: task.time_window,
          accountability_type: task.accountability_type,
          verification_mode: task.verification_mode,
          verification_mode_reason: task.verification_mode_reason,
          verification_confidence: task.verification_confidence,
          auto_approval_policy: task.auto_approval_policy,
          auto_approval_timeout_hours: task.auto_approval_timeout_hours,
          auto_approval_min_confidence: task.auto_approval_min_confidence,
          updated_at: Date.now(),
        });
      }
    }

    return goalId;
  },
});

/**
 * Update a goal.
 */
export const update = mutation({
  args: {
    id: v.id("goals"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    motivation: v.optional(v.string()),
    category: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    availability: v.optional(v.array(v.string())),
    time_commitment: v.optional(v.string()),
    accountability_type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const goal = await ctx.db.get(args.id);
    if (!goal) throw new Error("Goal not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
      .unique();

    if (!user || goal.user_id !== user._id) throw new Error("Unauthorized");

    await ctx.db.patch(args.id, {
      ...args,
      updated_at: Date.now(),
    });
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

/**
 * Duplicate a goal.
 */
export const duplicate = mutation({
  args: { id: v.id("goals") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const originalGoal = await ctx.db.get(args.id);
    if (!originalGoal) throw new Error("Goal not found");

    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
      .unique();

    if (!user || originalGoal.user_id !== user._id) throw new Error("Unauthorized");

    const newGoalId = await ctx.db.insert("goals", {
      name: `${originalGoal.name} (Copy)`,
      category: originalGoal.category,
      icon: originalGoal.icon,
      color: originalGoal.color,
      is_habit: originalGoal.is_habit,
      is_archived: false,
      user_id: user._id,
      updated_at: Date.now(),
    });

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_goal", (q) => q.eq("goal_id", originalGoal._id))
      .collect();

    for (const task of tasks) {
      await ctx.db.insert("tasks", {
        name: task.name,
        description: task.description,
        repeat_frequency: task.repeat_frequency,
        status: "pending", // Reset status
        goal_id: newGoalId,
        updated_at: Date.now(),
      });
    }

    return newGoalId;
  },
});
