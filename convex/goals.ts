import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { recordUserActivity } from "./lib/streaks";

function buildTaskStartWeeks(aiPlanJson: string | undefined, totalTasks: number): number[] {
  const startWeeks = Array.from({ length: totalTasks }, () => 1);
  if (!aiPlanJson) return startWeeks;

  try {
    const parsed = JSON.parse(aiPlanJson);
    const milestones = Array.isArray(parsed?.milestones) ? parsed.milestones : [];
    let cursor = 0;

    for (let mIdx = 0; mIdx < milestones.length; mIdx += 1) {
      const milestone = milestones[mIdx];
      const count = Number(milestone?.task_count ?? 0);
      const startWeek = mIdx + 1;
      if (!Number.isFinite(count) || count <= 0) continue;

      for (let i = 0; i < count && cursor < startWeeks.length; i += 1) {
        startWeeks[cursor] = startWeek;
        cursor += 1;
      }
    }
  } catch {
    // Ignore malformed ai_plan_json and fall back to week 1 defaults.
  }

  return startWeeks;
}

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
    goal_type: v.optional(v.union(v.literal("habit"), v.literal("target-date"), v.literal("milestone"))),
    end_date: v.optional(v.number()),
    template_source_id: v.optional(v.string()),
    template_source_slug: v.optional(v.string()),
    template_source_version: v.optional(v.number()),
    template_source_title: v.optional(v.string()),
    goal_archetype: v.optional(v.union(v.literal("savings"), v.literal("marathon"), v.literal("daily_habit"), v.literal("general"))),
    goal_profile_json: v.optional(v.string()),
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
          time_window_start: v.optional(v.string()),
          time_window_end: v.optional(v.string()),
          time_window_duration_minutes: v.optional(v.number()),
          requires_partner_review: v.optional(v.boolean()),
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
      goal_type: args.goal_type,
      end_date: args.end_date,
      template_source_id: args.template_source_id,
      template_source_slug: args.template_source_slug,
      template_source_version: args.template_source_version,
      template_source_title: args.template_source_title,
      goal_archetype: args.goal_archetype,
      goal_profile_json: args.goal_profile_json,
      is_archived: false,
      availability: args.availability,
      time_commitment: args.time_commitment,
      accountability_type: args.accountability_type,
      user_id: user._id,
      updated_at: Date.now(),
    });

    if (args.tasks && args.tasks.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTs = today.getTime();
      const dow = today.toLocaleDateString("en-US", { weekday: "short" }).toLowerCase();

      for (const task of args.tasks) {
        const taskId = await ctx.db.insert("tasks", {
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
          time_window_start: task.time_window_start,
          time_window_end: task.time_window_end,
          time_window_duration_minutes: task.time_window_duration_minutes,
          requires_partner_review: task.requires_partner_review,
          auto_approval_policy: task.auto_approval_policy,
          auto_approval_timeout_hours: task.auto_approval_timeout_hours,
          auto_approval_min_confidence: task.auto_approval_min_confidence,
          is_template_task: true,
          updated_at: Date.now(),
        });

        // Day-one: generate today's instance
        const freq = (task.repeat_frequency || "daily").toLowerCase();
        const shouldRun = freq === "daily" || freq.includes("weekday")
          ? !["sat", "sun"].includes(dow)
          : true;
        if (shouldRun) {
          await ctx.db.insert("task_instances", {
            task_id: taskId,
            goal_id: goalId,
            user_id: user._id,
            instance_date: todayTs,
            status: "pending",
            created_at: Date.now(),
            updated_at: Date.now(),
          });
        }
      }
    }

    await recordUserActivity(ctx, user._id);
    return goalId;
  },
});

/**
 * Create a goal + immediately generate today's task instances.
 * Used by the new wizard to ensure day-one readiness.
 */
export const createWithInstances = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    motivation: v.optional(v.string()),
    category: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    is_habit: v.boolean(),
    goal_type: v.optional(v.union(v.literal("habit"), v.literal("target-date"), v.literal("milestone"))),
    end_date: v.optional(v.number()),
    template_source_id: v.optional(v.string()),
    template_source_slug: v.optional(v.string()),
    template_source_version: v.optional(v.number()),
    template_source_title: v.optional(v.string()),
    goal_archetype: v.optional(v.union(v.literal("savings"), v.literal("marathon"), v.literal("daily_habit"), v.literal("general"))),
    goal_profile_json: v.optional(v.string()),
    availability: v.optional(v.array(v.string())),
    time_commitment: v.optional(v.string()),
    accountability_type: v.optional(v.string()),
    planning_mode: v.optional(v.union(v.literal("ai"), v.literal("manual"))),
    ai_plan_json: v.optional(v.string()),
    cadence_json: v.optional(v.string()),
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
          time_window_start: v.optional(v.string()),
          time_window_end: v.optional(v.string()),
          time_window_duration_minutes: v.optional(v.number()),
          requires_partner_review: v.optional(v.boolean()),
          auto_approval_policy: v.optional(v.string()),
          auto_approval_timeout_hours: v.optional(v.number()),
          auto_approval_min_confidence: v.optional(v.number()),
          is_template_task: v.optional(v.boolean()),
          cadence_type: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("custom"))),
          cadence_days: v.optional(v.array(v.string())),
          cadence_duration_weeks: v.optional(v.number()),
          difficulty_level: v.optional(v.number()),
          minimum_viable_action: v.optional(v.string()),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const goalId = await ctx.db.insert("goals", {
      name: args.name,
      description: args.description,
      motivation: args.motivation,
      category: args.category,
      icon: args.icon,
      color: args.color,
      is_habit: args.is_habit,
      goal_type: args.goal_type,
      end_date: args.end_date,
      template_source_id: args.template_source_id,
      template_source_slug: args.template_source_slug,
      template_source_version: args.template_source_version,
      template_source_title: args.template_source_title,
      goal_archetype: args.goal_archetype,
      goal_profile_json: args.goal_profile_json,
      is_archived: false,
      availability: args.availability,
      time_commitment: args.time_commitment,
      accountability_type: args.accountability_type,
      planning_mode: args.planning_mode,
      ai_plan_json: args.ai_plan_json,
      cadence_json: args.cadence_json,
      user_id: user._id,
      updated_at: Date.now(),
    });

    if (args.tasks && args.tasks.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTs = today.getTime();
      const dow = today.toLocaleDateString("en-US", { weekday: "short" }).toLowerCase();
      const taskStartWeeks = buildTaskStartWeeks(args.ai_plan_json, args.tasks.length);

      for (const [idx, task] of args.tasks.entries()) {
        const taskId = await ctx.db.insert("tasks", {
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
          time_window_start: task.time_window_start,
          time_window_end: task.time_window_end,
          time_window_duration_minutes: task.time_window_duration_minutes,
          requires_partner_review: task.requires_partner_review,
          auto_approval_policy: task.auto_approval_policy,
          auto_approval_timeout_hours: task.auto_approval_timeout_hours,
          auto_approval_min_confidence: task.auto_approval_min_confidence,
          is_template_task: task.is_template_task ?? true,
          cadence_type: task.cadence_type,
          cadence_days: task.cadence_days,
          cadence_duration_weeks: task.cadence_duration_weeks,
          difficulty_level: task.difficulty_level,
          minimum_viable_action: task.minimum_viable_action,
          updated_at: Date.now(),
        });

        // Day-one: generate today's instance
        const ct = task.cadence_type || "daily";
        const cd = task.cadence_days || [];
        const startWeek = taskStartWeeks[idx] ?? 1;
        const shouldRun = (ct === "daily" || cd.includes(dow)) && startWeek <= 1;
        if (shouldRun) {
          await ctx.db.insert("task_instances", {
            task_id: taskId,
            goal_id: goalId,
            user_id: user._id,
            instance_date: todayTs,
            status: "pending",
            created_at: Date.now(),
            updated_at: Date.now(),
          });
        }
      }
    }

    await recordUserActivity(ctx, user._id);
    return goalId;
  },
});

/**
 * Create a shared goal for both creator and partner.
 * Partner's copy is archived until they accept via notification.
 */
export const createSharedGoal = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    motivation: v.optional(v.string()),
    category: v.optional(v.string()),
    is_habit: v.boolean(),
    goal_type: v.optional(v.union(v.literal("habit"), v.literal("target-date"), v.literal("milestone"))),
    end_date: v.optional(v.number()),
    goal_archetype: v.optional(v.union(v.literal("savings"), v.literal("marathon"), v.literal("daily_habit"), v.literal("general"))),
    goal_profile_json: v.optional(v.string()),
    availability: v.optional(v.array(v.string())),
    time_commitment: v.optional(v.string()),
    accountability_type: v.optional(v.string()),
    planning_mode: v.optional(v.union(v.literal("ai"), v.literal("manual"))),
    ai_plan_json: v.optional(v.string()),
    shared_goal_mode: v.union(v.literal("independent"), v.literal("together")),
    partner_id: v.id("users"),
    partnership_id: v.id("partnerships"),
    tasks: v.optional(v.array(v.object({
      name: v.string(),
      description: v.optional(v.string()),
      repeat_frequency: v.optional(v.string()),
      time_window: v.optional(v.string()),
      verification_mode: v.optional(v.string()),
      time_window_start: v.optional(v.string()),
      time_window_end: v.optional(v.string()),
      time_window_duration_minutes: v.optional(v.number()),
      requires_partner_review: v.optional(v.boolean()),
      is_template_task: v.optional(v.boolean()),
      cadence_type: v.optional(v.union(v.literal("daily"), v.literal("weekly"), v.literal("custom"))),
      cadence_days: v.optional(v.array(v.string())),
      cadence_duration_weeks: v.optional(v.number()),
      difficulty_level: v.optional(v.number()),
      minimum_viable_action: v.optional(v.string()),
    }))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const partner = await ctx.db.get(args.partner_id);
    if (!partner) throw new Error("Partner not found");

    const groupId = crypto.randomUUID();

    const baseGoal = {
      name: args.name,
      description: args.description,
      motivation: args.motivation,
      category: args.category,
      icon: undefined,
      color: undefined,
      is_habit: args.is_habit,
      goal_type: args.goal_type,
      end_date: args.end_date,
      goal_archetype: args.goal_archetype,
      goal_profile_json: args.goal_profile_json,
      availability: args.availability,
      time_commitment: args.time_commitment,
      accountability_type: args.accountability_type,
      planning_mode: args.planning_mode,
      ai_plan_json: args.ai_plan_json,
      shared_goal_group_id: groupId,
      shared_goal_mode: args.shared_goal_mode,
      shared_goal_creator_id: user._id,
      partnership_id: args.partnership_id,
      updated_at: Date.now(),
    };

    const creatorGoalId = await ctx.db.insert("goals", {
      ...baseGoal,
      user_id: user._id,
      is_archived: false,
    });

    const partnerGoalId = await ctx.db.insert("goals", {
      ...baseGoal,
      user_id: partner._id,
      is_archived: true, // Pending partner acceptance
    });

    // Insert tasks for both goals
    if (args.tasks && args.tasks.length > 0) {
      for (const task of args.tasks) {
        const baseTask = {
          name: task.name,
          description: task.description,
          repeat_frequency: task.repeat_frequency,
          status: "pending" as const,
          time_window: task.time_window,
          verification_mode: task.verification_mode,
          time_window_start: task.time_window_start,
          time_window_end: task.time_window_end,
          time_window_duration_minutes: task.time_window_duration_minutes,
          requires_partner_review: task.requires_partner_review,
          is_template_task: task.is_template_task ?? true,
          cadence_type: task.cadence_type,
          cadence_days: task.cadence_days,
          cadence_duration_weeks: task.cadence_duration_weeks,
          difficulty_level: task.difficulty_level,
          minimum_viable_action: task.minimum_viable_action,
          updated_at: Date.now(),
        };
        await ctx.db.insert("tasks", { ...baseTask, goal_id: creatorGoalId });
        await ctx.db.insert("tasks", { ...baseTask, goal_id: partnerGoalId });
      }
    }

    // Notify partner
    await ctx.db.insert("notifications", {
      user_id: partner._id,
      type: "shared_goal_invitation",
      category: "partner",
      title: "New Shared Goal",
      message: `${user.full_name || user.nickname || "Your partner"} wants to work on "${args.name}" together!`,
      priority: "high",
      actionable: true,
      related_entity_type: "goal",
      related_entity_id: partnerGoalId,
      metadata_json: JSON.stringify({
        creator_name: user.full_name || user.nickname,
        goal_name: args.name,
        shared_goal_mode: args.shared_goal_mode,
        shared_goal_group_id: groupId,
        partner_goal_id: partnerGoalId,
      }),
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    // Generate today's instances for creator
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTs = today.getTime();
    const dow = today.toLocaleDateString("en-US", { weekday: "short" }).toLowerCase();

    const creatorTasks = await ctx.db
      .query("tasks")
      .withIndex("by_goal", (q) => q.eq("goal_id", creatorGoalId))
      .collect();
    const creatorTaskStartWeeks = buildTaskStartWeeks(args.ai_plan_json, creatorTasks.length);
    const sortedCreatorTasks = [...creatorTasks].sort((a, b) => a._creationTime - b._creationTime);

    for (const [idx, t] of sortedCreatorTasks.entries()) {
      const ct = t.cadence_type || "daily";
      const cd = t.cadence_days || [];
      const startWeek = creatorTaskStartWeeks[idx] ?? 1;
      if ((ct === "daily" || cd.includes(dow)) && startWeek <= 1) {
        await ctx.db.insert("task_instances", {
          task_id: t._id,
          goal_id: creatorGoalId,
          user_id: user._id,
          instance_date: todayTs,
          status: "pending",
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      }
    }

    await recordUserActivity(ctx, user._id);
    return { creatorGoalId, partnerGoalId, groupId };
  },
});

/**
 * Accept a shared goal invitation (unarchives the partner's copy).
 */
export const acceptSharedGoal = mutation({
  args: { goal_id: v.id("goals") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const goal = await ctx.db.get(args.goal_id);
    if (!goal || goal.user_id !== user._id) throw new Error("Unauthorized");
    if (!goal.shared_goal_group_id) throw new Error("Not a shared goal");

    await ctx.db.patch(args.goal_id, {
      is_archived: false,
      updated_at: Date.now(),
    });

    // Generate today's instances
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTs = today.getTime();
    const dow = today.toLocaleDateString("en-US", { weekday: "short" }).toLowerCase();

    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_goal", (q) => q.eq("goal_id", args.goal_id))
      .collect();

    for (const t of tasks) {
      const ct = t.cadence_type || "daily";
      const cd = t.cadence_days || [];
      if (ct === "daily" || cd.includes(dow)) {
        await ctx.db.insert("task_instances", {
          task_id: t._id,
          goal_id: args.goal_id,
          user_id: user._id,
          instance_date: todayTs,
          status: "pending",
          created_at: Date.now(),
          updated_at: Date.now(),
        });
      }
    }

    // Notify creator
    if (goal.shared_goal_creator_id) {
      await ctx.db.insert("notifications", {
        user_id: goal.shared_goal_creator_id,
        type: "shared_goal_accepted",
        category: "partner",
        title: "Goal Accepted!",
        message: `${user.full_name || user.nickname || "Your partner"} accepted "${goal.name}"!`,
        priority: "medium",
        actionable: false,
        related_entity_type: "goal",
        related_entity_id: args.goal_id,
        created_at: Date.now(),
        updated_at: Date.now(),
      });
    }

    await recordUserActivity(ctx, user._id);
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
    goal_type: v.optional(v.union(v.literal("habit"), v.literal("target-date"), v.literal("milestone"))),
    end_date: v.optional(v.number()),
    template_source_id: v.optional(v.string()),
    template_source_slug: v.optional(v.string()),
    template_source_version: v.optional(v.number()),
    template_source_title: v.optional(v.string()),
    goal_archetype: v.optional(v.union(v.literal("savings"), v.literal("marathon"), v.literal("daily_habit"), v.literal("general"))),
    goal_profile_json: v.optional(v.string()),
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
