import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function startOfWeekMonday(timestampMs: number): number {
    const d = new Date(timestampMs);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // 0=Sun ... 6=Sat
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d.getTime();
}

function startOfDay(timestampMs: number): number {
    const d = new Date(timestampMs);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
}

function endOfDay(timestampMs: number): number {
    return startOfDay(timestampMs) + (24 * 60 * 60 * 1000) - 1;
}

function getTaskStartWeekByTaskId(goal: any, tasks: any[]): Map<string, number> {
    const map = new Map<string, number>();
    if (!goal?.ai_plan_json || !Array.isArray(tasks) || tasks.length === 0) return map;

    try {
        const parsed = JSON.parse(goal.ai_plan_json);
        const milestones = Array.isArray(parsed?.milestones) ? parsed.milestones : [];
        if (milestones.length === 0) return map;

        const sortedTasks = [...tasks].sort((a, b) => a._creationTime - b._creationTime);
        let cursor = 0;

        for (const milestone of milestones) {
            const count = Number(milestone?.task_count ?? 0);
            const targetWeek = Number(milestone?.target_week ?? 1);
            if (!Number.isFinite(count) || count <= 0) continue;

            for (let i = 0; i < count && cursor < sortedTasks.length; i += 1) {
                map.set(String(sortedTasks[cursor]._id), Math.max(1, Math.floor(targetWeek)));
                cursor += 1;
            }
        }
    } catch {
        // Ignore malformed ai_plan_json and run fallback scheduling.
    }

    return map;
}

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

        const goalCache = new Map<string, any>();
        const phaseMapByGoal = new Map<string, Map<string, number>>();

        const phaseFilteredInstances = [];
        for (const instance of instances) {
            const goalIdKey = String(instance.goal_id);
            let goal = goalCache.get(goalIdKey);
            if (!goal) {
                goal = await ctx.db.get(instance.goal_id);
                goalCache.set(goalIdKey, goal);
            }
            if (!goal) continue;

            let phaseMap = phaseMapByGoal.get(goalIdKey);
            if (!phaseMap) {
                const goalTasks = await ctx.db
                    .query("tasks")
                    .withIndex("by_goal", (q) => q.eq("goal_id", instance.goal_id))
                    .collect();
                phaseMap = getTaskStartWeekByTaskId(goal, goalTasks);
                phaseMapByGoal.set(goalIdKey, phaseMap);
            }

            const startWeek = phaseMap.get(String(instance.task_id)) ?? 1;
            const goalStartDay = startOfDay(goal._creationTime ?? goal.updated_at ?? args.date);
            const instanceWeek =
                Math.floor((startOfDay(instance.instance_date) - goalStartDay) / (7 * 24 * 60 * 60 * 1000)) + 1;

            if (instanceWeek >= startWeek) {
                phaseFilteredInstances.push(instance);
            }
        }

        // Enrich with template task and goal data
        const enriched = await Promise.all(
            phaseFilteredInstances.map(async (instance) => {
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
 * Goal-scoped execution view for weekly and timeline task instance rendering.
 */
export const getGoalExecutionView = query({
    args: {
        goal_id: v.id("goals"),
        week_start: v.optional(v.number()),
        timeline_limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        const goal = await ctx.db.get(args.goal_id);
        if (!goal) throw new Error("Goal not found");
        if (goal.user_id !== user._id) throw new Error("Unauthorized");

        const weekStart = args.week_start ?? startOfWeekMonday(Date.now());
        const weekEnd = weekStart + (7 * 24 * 60 * 60 * 1000) - 1;
        const todayStart = startOfDay(Date.now());
        const todayEnd = endOfDay(Date.now());
        const timelineLimit = Math.min(args.timeline_limit ?? 180, 365);

        const goalInstances = await ctx.db
            .query("task_instances")
            .withIndex("by_goal_date", (q) => q.eq("goal_id", args.goal_id))
            .collect();
        const goalTasks = await ctx.db
            .query("tasks")
            .withIndex("by_goal", (q) => q.eq("goal_id", args.goal_id))
            .collect();
        const startWeekByTaskId = getTaskStartWeekByTaskId(goal, goalTasks);
        const goalStartDay = startOfDay(goal._creationTime ?? goal.updated_at ?? Date.now());

        const phaseFilteredInstances = goalInstances.filter((instance) => {
            const startWeek = startWeekByTaskId.get(String(instance.task_id)) ?? 1;
            const instanceWeek =
                Math.floor((startOfDay(instance.instance_date) - goalStartDay) / (7 * 24 * 60 * 60 * 1000)) + 1;
            return instanceWeek >= startWeek;
        });

        const taskCache = new Map<string, any>();
        const getTask = async (taskId: any) => {
            const key = String(taskId);
            if (!taskCache.has(key)) {
                const task = await ctx.db.get(taskId);
                taskCache.set(key, task);
            }
            return taskCache.get(key);
        };

        const enrich = async (instance: any) => {
            const task = await getTask(instance.task_id);
            return {
                ...instance,
                task_name: task?.name ?? "Unknown task",
                task_description: task?.description ?? null,
                task_verification_mode: task?.verification_mode ?? null,
                task_accountability_type: task?.accountability_type ?? null,
                task_time_window_start: task?.time_window_start ?? null,
                task_time_window_end: task?.time_window_end ?? null,
                task_time_window_duration_minutes: task?.time_window_duration_minutes ?? null,
            };
        };

        const weekInstancesRaw = phaseFilteredInstances
            .filter((instance) => instance.instance_date >= weekStart && instance.instance_date <= weekEnd)
            .sort((a, b) => a.instance_date - b.instance_date || a.created_at - b.created_at);
        const weekInstances = await Promise.all(weekInstancesRaw.map(enrich));

        const allInstancesRaw = phaseFilteredInstances
            .sort((a, b) => b.instance_date - a.instance_date || b.created_at - a.created_at)
            .slice(0, timelineLimit);
        const allInstances = await Promise.all(allInstancesRaw.map(enrich));

        const weekSummary = weekInstances.reduce(
            (acc, instance: any) => {
                const status = instance.status;
                if (status === "completed" || status === "verified") {
                    acc.completed += 1;
                } else if (status === "pending-verification") {
                    acc.awaitingReview += 1;
                } else if (status === "missed" || status === "skipped" || status === "failed") {
                    acc.notCompleted += 1;
                } else if (status === "rejected") {
                    acc.rejected += 1;
                } else {
                    acc.pending += 1;
                }
                return acc;
            },
            { completed: 0, awaitingReview: 0, notCompleted: 0, rejected: 0, pending: 0 }
        );

        return {
            goal_id: args.goal_id,
            week_start: weekStart,
            week_end: weekEnd,
            today_start: todayStart,
            today_end: todayEnd,
            week_instances: weekInstances,
            all_instances: allInstances,
            week_summary: weekSummary,
        };
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
        const startWeekByTaskId = getTaskStartWeekByTaskId(goal, tasksToSchedule);

        const dayOfWeek = new Date(args.date)
            .toLocaleDateString("en-US", { weekday: "short" })
            .toLowerCase();
        const goalStartDay = startOfDay(goal._creationTime ?? goal.updated_at ?? args.date);
        const currentWeek = Math.floor((startOfDay(args.date) - goalStartDay) / (7 * 24 * 60 * 60 * 1000)) + 1;

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
            const startWeek = startWeekByTaskId.get(String(task._id)) ?? 1;

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
                const weeksSinceTaskStart = currentWeek - startWeek;
                if (weeksSinceTaskStart >= task.cadence_duration_weeks) {
                    shouldRun = false;
                }
            }

            if (shouldRun && currentWeek < startWeek) {
                shouldRun = false;
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
