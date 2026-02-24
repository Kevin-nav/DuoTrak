import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * List today's task instances for the current user.
 */
export const listForDate = query({
    args: {
        date: v.number(), // Start-of-day timestamp
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
            .unique();

        if (!user) return [];

        const instances = await ctx.db
            .query("task_instances")
            .withIndex("by_user_date", (q) =>
                q.eq("user_id", user._id).eq("instance_date", args.date)
            )
            .collect();

        // Enrich with template task and goal data
        const enriched = await Promise.all(
            instances.map(async (instance) => {
                const task = await ctx.db.get(instance.task_id);
                const goal = await ctx.db.get(instance.goal_id);
                return {
                    ...instance,
                    task_name: task?.name ?? "Unknown task",
                    task_description: task?.description,
                    task_verification_mode: task?.verification_mode,
                    task_time_window_start: task?.time_window_start,
                    task_time_window_end: task?.time_window_end,
                    task_time_window_duration_minutes: task?.time_window_duration_minutes,
                    task_minimum_viable_action: task?.minimum_viable_action,
                    task_difficulty_level: task?.difficulty_level,
                    goal_name: goal?.name ?? "Unknown goal",
                    goal_archetype: goal?.goal_archetype,
                    goal_type: goal?.goal_type,
                    goal_profile_json: goal?.goal_profile_json,
                    is_shared: !!goal?.shared_goal_group_id,
                };
            })
        );

        return enriched;
    },
});

/**
 * Mark a task instance as completed.
 */
export const markComplete = mutation({
    args: {
        instance_id: v.id("task_instances"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const instance = await ctx.db.get(args.instance_id);
        if (!instance) throw new Error("Instance not found");

        const user = await ctx.db
            .query("users")
            .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
            .unique();

        if (!user || instance.user_id !== user._id) throw new Error("Unauthorized");

        await ctx.db.patch(args.instance_id, {
            status: "completed",
            completed_at: Date.now(),
            updated_at: Date.now(),
        });
    },
});

/**
 * Submit verification evidence for a task instance.
 */
export const submitVerification = mutation({
    args: {
        instance_id: v.id("task_instances"),
        evidence_url: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const instance = await ctx.db.get(args.instance_id);
        if (!instance) throw new Error("Instance not found");

        const user = await ctx.db
            .query("users")
            .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
            .unique();

        if (!user || instance.user_id !== user._id) throw new Error("Unauthorized");

        await ctx.db.patch(args.instance_id, {
            status: "pending-verification",
            verification_submitted_at: Date.now(),
            verification_evidence_url: args.evidence_url,
            updated_at: Date.now(),
        });
    },
});

/**
 * Generate task instances for a goal on a given date.
 * Called after goal creation and by the daily scheduler.
 */
export const generateForGoal = mutation({
    args: {
        goal_id: v.id("goals"),
        date: v.number(),
    },
    handler: async (ctx, args) => {
        const goal = await ctx.db.get(args.goal_id);
        if (!goal || goal.is_archived) return [];

        // Get template tasks (blueprint tasks, not instances)
        const allTasks = await ctx.db
            .query("tasks")
            .withIndex("by_goal", (q) => q.eq("goal_id", args.goal_id))
            .collect();

        const templateTasks = allTasks.filter(
            (t) => t.is_template_task === true
        );

        // If no template tasks, treat all tasks as templates (backward compat)
        const tasksToSchedule = templateTasks.length > 0 ? templateTasks : allTasks;

        const dayOfWeek = new Date(args.date)
            .toLocaleDateString("en-US", { weekday: "short" })
            .toLowerCase();

        const createdIds = [];

        for (const task of tasksToSchedule) {
            // Check if instance already exists for this date
            const existing = await ctx.db
                .query("task_instances")
                .withIndex("by_task_date", (q) =>
                    q.eq("task_id", task._id).eq("instance_date", args.date)
                )
                .first();

            if (existing) continue;

            // Check cadence: should this task run today?
            const cadenceType = task.cadence_type || "daily";
            const cadenceDays = task.cadence_days || [];

            let shouldRun = false;

            if (cadenceType === "daily") {
                shouldRun = true;
            } else if (cadenceType === "weekly" && cadenceDays.length > 0) {
                shouldRun = cadenceDays.includes(dayOfWeek);
            } else if (cadenceType === "custom" && cadenceDays.length > 0) {
                shouldRun = cadenceDays.includes(dayOfWeek);
            } else {
                // Fallback: check repeat_frequency string
                const freq = (task.repeat_frequency || "daily").toLowerCase();
                if (freq === "daily") {
                    shouldRun = true;
                } else if (freq.includes("weekday")) {
                    shouldRun = !["sat", "sun"].includes(dayOfWeek);
                } else {
                    shouldRun = true; // Default to running
                }
            }

            // Check cadence duration
            if (shouldRun && task.cadence_duration_weeks) {
                const goalCreatedAt = goal.updated_at; // Closest to creation time
                const weeksSinceCreation = Math.floor(
                    (args.date - goalCreatedAt) / (7 * 24 * 60 * 60 * 1000)
                );
                if (weeksSinceCreation >= task.cadence_duration_weeks) {
                    shouldRun = false;
                }
            }

            if (shouldRun) {
                const id = await ctx.db.insert("task_instances", {
                    task_id: task._id,
                    goal_id: args.goal_id,
                    user_id: goal.user_id,
                    instance_date: args.date,
                    status: "pending",
                    created_at: Date.now(),
                    updated_at: Date.now(),
                });
                createdIds.push(id);
            }
        }

        return createdIds;
    },
});
