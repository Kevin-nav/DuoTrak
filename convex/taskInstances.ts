import { internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

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
    return startOfDay(timestampMs) + DAY_MS - 1;
}

function normalizeTimeZone(timeZone?: string): string {
    const candidate = (timeZone || "").trim();
    if (!candidate) return "UTC";
    try {
        new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format(new Date());
        return candidate;
    } catch {
        return "UTC";
    }
}

function getDateTimePartsInTimeZone(timestampMs: number, timeZone: string) {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
    }).formatToParts(new Date(timestampMs));

    const valueFor = (partName: Intl.DateTimeFormatPartTypes) =>
        Number(parts.find((p) => p.type === partName)?.value ?? 0);

    return {
        year: valueFor("year"),
        month: valueFor("month"),
        day: valueFor("day"),
        hour: valueFor("hour"),
        minute: valueFor("minute"),
        second: valueFor("second"),
    };
}

function getTimeZoneOffsetMs(timestampMs: number, timeZone: string): number {
    const parts = getDateTimePartsInTimeZone(timestampMs, timeZone);
    const asUtc = Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
        parts.second
    );
    return asUtc - timestampMs;
}

function startOfDayInTimeZone(timestampMs: number, timeZone: string): number {
    const parts = getDateTimePartsInTimeZone(timestampMs, timeZone);
    const utcMidnightForLocalDate = Date.UTC(parts.year, parts.month - 1, parts.day, 0, 0, 0, 0);
    const offset = getTimeZoneOffsetMs(utcMidnightForLocalDate, timeZone);
    return utcMidnightForLocalDate - offset;
}

function getDayOfWeekInTimeZone(timestampMs: number, timeZone: string): string {
    return new Intl.DateTimeFormat("en-US", {
        timeZone,
        weekday: "short",
    })
        .format(new Date(timestampMs))
        .toLowerCase()
        .slice(0, 3);
}

function extractDaysFromText(value?: string): string[] {
    if (!value) return [];
    const text = value.toLowerCase();
    const dayMap: Array<[string, string]> = [
        ["monday", "mon"],
        ["mon", "mon"],
        ["tuesday", "tue"],
        ["tue", "tue"],
        ["wednesday", "wed"],
        ["wed", "wed"],
        ["thursday", "thu"],
        ["thu", "thu"],
        ["friday", "fri"],
        ["fri", "fri"],
        ["saturday", "sat"],
        ["sat", "sat"],
        ["sunday", "sun"],
        ["sun", "sun"],
    ];

    const days = new Set<string>();
    for (const [needle, day] of dayMap) {
        if (text.includes(needle)) days.add(day);
    }
    if (text.includes("weekend")) {
        days.add("sat");
        days.add("sun");
    }
    if (text.includes("weekday")) {
        days.add("mon");
        days.add("tue");
        days.add("wed");
        days.add("thu");
        days.add("fri");
    }
    return [...days];
}

function normalizeCadenceDays(cadenceDays: unknown): string[] {
    if (!Array.isArray(cadenceDays)) return [];
    const normalized = new Set<string>();
    for (const item of cadenceDays) {
        if (typeof item !== "string") continue;
        const parsed = extractDaysFromText(item);
        for (const day of parsed) normalized.add(day);
    }
    return [...normalized];
}

function inferCadenceType(task: any): "daily" | "weekly" | "custom" {
    if (task.cadence_type === "daily" || task.cadence_type === "weekly" || task.cadence_type === "custom") {
        return task.cadence_type;
    }
    const freq = String(task.repeat_frequency || "").toLowerCase();
    if (freq.includes("week")) return "weekly";
    if (freq.includes("month")) return "weekly";
    return "daily";
}

function inferCadenceDays(task: any): string[] {
    const fromCadenceArray = normalizeCadenceDays(task.cadence_days);
    if (fromCadenceArray.length > 0) {
        return fromCadenceArray;
    }
    const fromWindow = extractDaysFromText(task.time_window);
    if (fromWindow.length > 0) return fromWindow;
    const fromTaskText = extractDaysFromText(`${String(task.name || "")} ${String(task.description || "")}`);
    if (fromTaskText.length > 0) return fromTaskText;
    const freq = String(task.repeat_frequency || "").toLowerCase();
    return extractDaysFromText(freq);
}

function shouldTaskRunOnDay(task: any, dayOfWeek: string): boolean {
    const cadenceType = inferCadenceType(task);
    const cadenceDays = inferCadenceDays(task);

    if (cadenceType === "daily") {
        // Allow "daily but weekdays" by honoring parsed day constraints when provided.
        return cadenceDays.length > 0 ? cadenceDays.includes(dayOfWeek) : true;
    }
    if (cadenceDays.length > 0) {
        return cadenceDays.includes(dayOfWeek);
    }
    // Weekly/custom tasks without explicit day default to Sunday.
    return dayOfWeek === "sun";
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

        for (let mIdx = 0; mIdx < milestones.length; mIdx += 1) {
            const milestone = milestones[mIdx];
            const count = Number(milestone?.task_count ?? 0);
            const startWeek = mIdx + 1;
            if (!Number.isFinite(count) || count <= 0) continue;

            for (let i = 0; i < count && cursor < sortedTasks.length; i += 1) {
                map.set(String(sortedTasks[cursor]._id), Math.max(1, Math.floor(startWeek)));
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

async function generateTaskInstancesForGoalDate(ctx: any, goal: any, date: number, timeZone?: string) {
    if (!goal || goal.is_archived) return [];

    const user = await ctx.db.get(goal.user_id);
    const goalTimeZone = normalizeTimeZone(timeZone || user?.timezone);

    // Keep the exact provided instance_date for dedupe and UI consistency.
    const targetDate = date;

    // Get template tasks (blueprint tasks, not instances)
    const allTasks = await ctx.db
        .query("tasks")
        .withIndex("by_goal", (q: any) => q.eq("goal_id", goal._id))
        .collect();

    const templateTasks = allTasks.filter(
        (t: any) => t.is_template_task === true
    );

    // If no template tasks, treat all tasks as templates (backward compat)
    const tasksToSchedule = templateTasks.length > 0 ? templateTasks : allTasks;
    const startWeekByTaskId = getTaskStartWeekByTaskId(goal, tasksToSchedule);

    const dayOfWeek = getDayOfWeekInTimeZone(targetDate, goalTimeZone);
    const goalStartDay = startOfDayInTimeZone(goal._creationTime ?? goal.updated_at ?? targetDate, goalTimeZone);
    const currentDay = startOfDayInTimeZone(targetDate, goalTimeZone);
    const currentWeek = Math.floor((currentDay - goalStartDay) / WEEK_MS) + 1;

    const createdIds = [];

    for (const task of tasksToSchedule) {
        // Check if instance already exists for this date
        const existing = await ctx.db
            .query("task_instances")
            .withIndex("by_task_date", (q: any) =>
                q.eq("task_id", task._id).eq("instance_date", targetDate)
            )
            .first();

        if (existing) continue;

        // Check cadence: should this task run today?
        const startWeek = startWeekByTaskId.get(String(task._id)) ?? 1;

        let shouldRun = shouldTaskRunOnDay(task, dayOfWeek);

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
                goal_id: goal._id,
                user_id: goal.user_id,
                instance_date: targetDate,
                status: "pending",
                created_at: Date.now(),
                updated_at: Date.now(),
            });
            createdIds.push(id);
        }
    }

    return createdIds;
}

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
        return await generateTaskInstancesForGoalDate(ctx, goal, args.date);
    },
});

/**
 * Hourly maintenance:
 * 1) Generate today's instances in each user's timezone.
 * 2) Mark prior-day pending/rejected instances as missed.
 */
export const runHourlyMaintenance = internalMutation({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const allGoals = await ctx.db.query("goals").collect();
        const activeGoals = allGoals.filter((goal: any) => !goal.is_archived);

        const userCache = new Map<string, any>();
        let generatedCount = 0;
        let missedCount = 0;

        for (const goal of activeGoals) {
            const userId = String(goal.user_id);
            if (!userCache.has(userId)) {
                const user = await ctx.db.get(goal.user_id);
                userCache.set(userId, user);
            }
            const user = userCache.get(userId);
            const timeZone = normalizeTimeZone(user?.timezone);
            const todayStart = startOfDayInTimeZone(now, timeZone);

            const overdue = await ctx.db
                .query("task_instances")
                .withIndex("by_goal_date", (q: any) =>
                    q.eq("goal_id", goal._id).lt("instance_date", todayStart)
                )
                .collect();

            for (const instance of overdue) {
                if (instance.status !== "pending" && instance.status !== "rejected") continue;
                await ctx.db.patch(instance._id, {
                    status: "missed",
                    updated_at: now,
                });
                missedCount += 1;
            }

            const created = await generateTaskInstancesForGoalDate(ctx, goal, todayStart, timeZone);
            generatedCount += created.length;
        }

        return {
            active_goals: activeGoals.length,
            generated_instances: generatedCount,
            marked_missed: missedCount,
        };
    },
});
