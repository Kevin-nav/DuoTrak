import { action, internalMutation, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { uploadToR2 } from "./lib/r2";
import { api, internal } from "./_generated/api";
import { recordUserActivity } from "./lib/streaks";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;
const IMAGE_UPLOAD_LIMIT_BYTES = 10 * 1024 * 1024;
const VIDEO_UPLOAD_LIMIT_BYTES = 50 * 1024 * 1024;
const AUDIO_UPLOAD_LIMIT_BYTES = 100 * 1024 * 1024;

function decodeBase64ToBytes(base64Data: string): Uint8Array {
    if (typeof atob !== "function") {
        throw new Error("Base64 decoder is unavailable in this runtime");
    }
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function sanitizeFileName(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function getProofTypeFromMime(mimeType: string): "photo" | "video" | "voice" {
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "voice";
    return "photo";
}

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

function isAwaitingVerificationStatus(status?: string): boolean {
    const normalized = String(status || "");
    return normalized === "pending-verification" || normalized === "pending_verification";
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
 * Upload helper query for action authorization.
 */
export const getByIdForUpload = query({
    args: {
        instance_id: v.id("task_instances"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const instance = await ctx.db.get(args.instance_id);
        if (!instance) return null;

        const user = await ctx.db
            .query("users")
            .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
            .unique();

        return {
            userId: String(instance.user_id),
            goalId: String(instance.goal_id),
            isAuthorized: !!user && instance.user_id === user._id,
        };
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
                } else if (isAwaitingVerificationStatus(status)) {
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
 * List partner task instances currently awaiting verification review.
 */
export const listPartnerPendingVerification = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
            .unique();

        if (!user?.current_partner_id) return [];

        const safeLimit = Math.max(1, Math.min(args.limit ?? 20, 100));
        const partner = await ctx.db.get(user.current_partner_id);
        const partnerDisplayName = partner?.full_name || partner?.nickname || "Partner";

        const partnerInstances = await ctx.db
            .query("task_instances")
            .withIndex("by_user_date", (q) => q.eq("user_id", user.current_partner_id!))
            .order("desc")
            .take(300);

        const pendingVerificationInstances = partnerInstances
            .filter((instance: any) => {
                return isAwaitingVerificationStatus(instance.status);
            });

        const partnerGoals = await ctx.db
            .query("goals")
            .withIndex("by_user", (q) => q.eq("user_id", user.current_partner_id!))
            .filter((q) => q.eq(q.field("is_archived"), false))
            .collect();

        const pendingVerificationTasks: any[] = [];
        for (const goal of partnerGoals) {
            const goalTasks = await ctx.db
                .query("tasks")
                .withIndex("by_goal", (q) => q.eq("goal_id", goal._id))
                .collect();
            for (const task of goalTasks) {
                if (!isAwaitingVerificationStatus(task.status)) continue;
                pendingVerificationTasks.push({
                    _id: task._id,
                    task_id: task._id,
                    goal_id: goal._id,
                    user_id: user.current_partner_id,
                    status: "pending-verification",
                    verification_submitted_at: task.verification_submitted_at,
                    verification_evidence_url: undefined,
                    updated_at: task.updated_at,
                    source_type: "task",
                });
            }
        }

        const pendingVerification = [...pendingVerificationInstances, ...pendingVerificationTasks]
            .sort(
                (a: any, b: any) =>
                    (b.verification_submitted_at ?? b.updated_at ?? 0) - (a.verification_submitted_at ?? a.updated_at ?? 0)
            )
            .slice(0, safeLimit);

        const taskCache = new Map<string, any>();
        const goalCache = new Map<string, any>();

        const getTask = async (taskId: any) => {
            const key = String(taskId);
            if (!taskCache.has(key)) {
                taskCache.set(key, await ctx.db.get(taskId));
            }
            return taskCache.get(key);
        };

        const getGoal = async (goalId: any) => {
            const key = String(goalId);
            if (!goalCache.has(key)) {
                goalCache.set(key, await ctx.db.get(goalId));
            }
            return goalCache.get(key);
        };

        return await Promise.all(
            pendingVerification.map(async (instance: any) => {
                const task = await getTask(instance.task_id);
                const goal = await getGoal(instance.goal_id);
                return {
                    ...instance,
                    task_name: task?.name ?? "Unknown task",
                    task_verification_mode: task?.verification_mode ?? null,
                    goal_name: goal?.name ?? "Unknown goal",
                    goal_type: goal?.shared_goal_group_id ? "shared" : "personal",
                    partner_display_name: partnerDisplayName,
                };
            })
        );
    },
});

/**
 * Partner page data: partner day tasks + recent partner activity.
 */
export const getPartnerViewData = query({
    args: {
        activity_limit: v.optional(v.number()),
        activity_days: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return {
                day_tasks: [],
                activities: [],
                timezone: "UTC",
                day_start: 0,
                day_end: 0,
            };
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
            .unique();

        if (!user?.current_partner_id) {
            return {
                day_tasks: [],
                activities: [],
                timezone: "UTC",
                day_start: 0,
                day_end: 0,
            };
        }

        const partner = await ctx.db.get(user.current_partner_id);
        const partnerTimeZone = normalizeTimeZone(partner?.timezone);
        const dayStart = startOfDayInTimeZone(Date.now(), partnerTimeZone);
        const dayEnd = dayStart + DAY_MS - 1;
        const activityLimit = Math.max(1, Math.min(args.activity_limit ?? 20, 100));
        const activityDays = Math.max(1, Math.min(args.activity_days ?? 7, 30));
        const activityStart = dayStart - (activityDays - 1) * DAY_MS;

        const dayInstances = await ctx.db
            .query("task_instances")
            .withIndex("by_user_date", (q) =>
                q.eq("user_id", user.current_partner_id!).gte("instance_date", dayStart).lte("instance_date", dayEnd)
            )
            .collect();

        const recentInstances = await ctx.db
            .query("task_instances")
            .withIndex("by_user_date", (q) =>
                q.eq("user_id", user.current_partner_id!).gte("instance_date", activityStart).lte("instance_date", dayEnd)
            )
            .collect();

        const partnerGoals = await ctx.db
            .query("goals")
            .withIndex("by_user", (q) => q.eq("user_id", user.current_partner_id!))
            .filter((q) => q.eq(q.field("is_archived"), false))
            .collect();

        const goalCache = new Map<string, any>();
        for (const goal of partnerGoals) {
            goalCache.set(String(goal._id), goal);
        }

        const goalTasks: any[] = [];
        for (const goal of partnerGoals) {
            const rows = await ctx.db
                .query("tasks")
                .withIndex("by_goal", (q) => q.eq("goal_id", goal._id))
                .collect();
            goalTasks.push(...rows);
        }

        const taskCache = new Map<string, any>();
        for (const task of goalTasks) {
            taskCache.set(String(task._id), task);
        }

        const getTask = async (taskId: any) => {
            const key = String(taskId);
            if (taskCache.has(key)) return taskCache.get(key);
            const row = await ctx.db.get(taskId);
            taskCache.set(key, row);
            return row;
        };

        const getGoal = async (goalId: any) => {
            const key = String(goalId);
            if (goalCache.has(key)) return goalCache.get(key);
            const row = await ctx.db.get(goalId);
            goalCache.set(key, row);
            return row;
        };

        const toUiStatus = (status?: string): "todo" | "completed" | "skipped" | "awaiting-verification" => {
            if (isAwaitingVerificationStatus(status)) return "awaiting-verification";
            if (status === "completed" || status === "verified") return "completed";
            if (status === "pending") return "todo";
            return "skipped";
        };

        const toTimeWindowLabel = (task: any): string | undefined => {
            if (!task) return undefined;
            if (task.time_window_start && task.time_window_end) {
                return `${task.time_window_start} - ${task.time_window_end}`;
            }
            if (task.time_window_start) return `${task.time_window_start}`;
            if (task.time_window_end) return `${task.time_window_end}`;
            return undefined;
        };

        const isImageUrl = (value?: string) => {
            if (!value) return false;
            return /\.(png|jpe?g|webp|gif|bmp|svg|heic|heif)(\?|$)/i.test(value);
        };

        const dayTaskRows = await Promise.all(
            dayInstances.map(async (instance: any) => {
                const task = await getTask(instance.task_id);
                return {
                    id: `instance:${String(instance._id)}`,
                    description: task?.name ?? "Task",
                    scheduledTime: toTimeWindowLabel(task),
                    status: toUiStatus(instance.status),
                    progress: undefined,
                    attachments: {
                        photos: isImageUrl(instance.verification_evidence_url) ? [instance.verification_evidence_url] : [],
                        notes: undefined,
                    },
                    source_type: "task_instance",
                    source_id: String(instance._id),
                    timestamp: instance.updated_at ?? instance.instance_date ?? 0,
                    raw_status: instance.status,
                };
            })
        );

        const legacyTodayRows = goalTasks
            .filter((task: any) => {
                if (task.is_template_task === true) return false;
                const due = Number(task.due_date ?? 0);
                return due >= dayStart && due <= dayEnd;
            })
            .map((task: any) => ({
                id: `task:${String(task._id)}`,
                description: task.name ?? "Task",
                scheduledTime: toTimeWindowLabel(task),
                status: toUiStatus(task.status),
                progress: undefined,
                attachments: { photos: [], notes: undefined },
                source_type: "task",
                source_id: String(task._id),
                timestamp: task.updated_at ?? task.due_date ?? 0,
                raw_status: task.status,
            }));

        const dayTaskMap = new Map<string, any>();
        for (const row of dayTaskRows) {
            dayTaskMap.set(row.id, row);
        }
        for (const row of legacyTodayRows) {
            const duplicate = Array.from(dayTaskMap.values()).find((item) => item.source_id === row.source_id);
            if (!duplicate) dayTaskMap.set(row.id, row);
        }
        const dayTasks = Array.from(dayTaskMap.values()).sort((a, b) => a.timestamp - b.timestamp);

        const recentActivityFromInstances = await Promise.all(
            recentInstances
                .filter((instance: any) => {
                    const s = String(instance.status || "");
                    return s !== "pending";
                })
                .map(async (instance: any) => {
                    const task = await getTask(instance.task_id);
                    const goal = await getGoal(instance.goal_id);
                    const status = String(instance.status || "");
                    const timestamp =
                        instance.verification_submitted_at ??
                        instance.completed_at ??
                        instance.updated_at ??
                        instance.instance_date ??
                        0;

                    let summary = `Updated "${task?.name ?? "Task"}"`;
                    let type: "task-completion" | "reflection" | "system-update" | "achievement" | "duo-challenge" = "system-update";
                    if (isAwaitingVerificationStatus(status)) {
                        summary = `Submitted "${task?.name ?? "Task"}" for verification`;
                        type = "task-completion";
                    } else if (status === "verified" || status === "completed") {
                        summary = `Completed "${task?.name ?? "Task"}"`;
                        type = "task-completion";
                    } else if (status === "rejected") {
                        summary = `Verification rejected for "${task?.name ?? "Task"}"`;
                        type = "system-update";
                    } else if (status === "missed" || status === "skipped" || status === "failed") {
                        summary = `Did not complete "${task?.name ?? "Task"}"`;
                        type = "system-update";
                    }

                    return {
                        id: `activity-instance:${String(instance._id)}`,
                        type,
                        timestamp,
                        summary,
                        details: {
                            notes: goal?.name ? `Goal: ${goal.name}` : undefined,
                            photo: isImageUrl(instance.verification_evidence_url) ? instance.verification_evidence_url : undefined,
                        },
                    };
                })
        );

        const recentLegacyActivity = goalTasks
            .filter((task: any) => {
                const updatedAt = Number(task.updated_at ?? 0);
                const status = String(task.status || "");
                if (updatedAt < activityStart || updatedAt > dayEnd) return false;
                if (task.is_template_task === true) return false;
                return status !== "pending";
            })
            .map((task: any) => {
                const status = String(task.status || "");
                const goal = goalCache.get(String(task.goal_id));
                let summary = `Updated "${task.name ?? "Task"}"`;
                let type: "task-completion" | "reflection" | "system-update" | "achievement" | "duo-challenge" = "system-update";
                if (isAwaitingVerificationStatus(status)) {
                    summary = `Submitted "${task.name ?? "Task"}" for verification`;
                    type = "task-completion";
                } else if (status === "verified" || status === "completed") {
                    summary = `Completed "${task.name ?? "Task"}"`;
                    type = "task-completion";
                } else if (status === "rejected") {
                    summary = `Verification rejected for "${task.name ?? "Task"}"`;
                    type = "system-update";
                } else if (status === "missed" || status === "skipped" || status === "failed") {
                    summary = `Did not complete "${task.name ?? "Task"}"`;
                    type = "system-update";
                }

                return {
                    id: `activity-task:${String(task._id)}`,
                    type,
                    timestamp: Number(task.updated_at ?? 0),
                    summary,
                    details: {
                        notes: goal?.name ? `Goal: ${goal.name}` : undefined,
                        photo: undefined,
                    },
                };
            });

        const activities = [...recentActivityFromInstances, ...recentLegacyActivity]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, activityLimit);

        return {
            day_tasks: dayTasks,
            activities,
            timezone: partnerTimeZone,
            day_start: dayStart,
            day_end: dayEnd,
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

        await recordUserActivity(ctx, user._id);
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

        const now = Date.now();
        await ctx.db.patch(args.instance_id, {
            status: "pending-verification",
            verification_submitted_at: now,
            verification_evidence_url: args.evidence_url,
            updated_at: now,
        });

        await recordUserActivity(ctx, user._id, now);

        if (user.current_partner_id) {
            const task = await ctx.db.get(instance.task_id);
            await ctx.scheduler.runAfter(
                0,
                (internal as any).notifications.dispatchEvent,
                {
                    eventType: "verification_requested",
                    recipientUserId: user.current_partner_id,
                    actorUserId: user._id,
                    context: JSON.stringify({
                        taskId: String(instance.task_id),
                        goalId: String(instance.goal_id),
                        taskName: task?.name,
                    }),
                }
            );
        }
    },
});

/**
 * Partner review for a submitted task instance verification.
 */
export const partnerReviewVerification = mutation({
    args: {
        instance_id: v.id("task_instances"),
        decision: v.union(v.literal("approved"), v.literal("rejected")),
        rejection_reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const instance = await ctx.db.get(args.instance_id);
        if (!instance) throw new Error("Instance not found");

        const reviewer = await ctx.db
            .query("users")
            .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
            .unique();
        if (!reviewer) throw new Error("User not found");

        const owner = await ctx.db.get(instance.user_id);
        if (!owner) throw new Error("Task owner not found");

        const isPartnerReviewer =
            owner.current_partner_id === reviewer._id && reviewer.current_partner_id === owner._id;
        if (!isPartnerReviewer) throw new Error("Unauthorized");

        if (!isAwaitingVerificationStatus(instance.status)) {
            throw new Error("Task instance is not awaiting verification");
        }

        const approved = args.decision === "approved";
        const now = Date.now();
        await ctx.db.patch(args.instance_id, {
            status: approved ? "verified" : "rejected",
            verification_outcome: args.decision,
            verification_reviewer_type: "partner",
            verification_rejection_reason: approved ? undefined : args.rejection_reason,
            updated_at: now,
        });

        await recordUserActivity(ctx, reviewer._id, now);

        const task = await ctx.db.get(instance.task_id);
        await ctx.scheduler.runAfter(
            0,
            (internal as any).notifications.dispatchEvent,
            {
                eventType: approved ? "verification_approved" : "verification_rejected",
                recipientUserId: owner._id,
                actorUserId: reviewer._id,
                context: JSON.stringify({
                    taskId: String(instance.task_id),
                    goalId: String(instance.goal_id),
                    taskName: task?.name,
                    rejectionReason: args.rejection_reason,
                }),
            }
        );

        return { ok: true };
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
 * Upload proof media for a task instance and return a permanent URL.
 */
export const uploadVerificationAttachment = action({
    args: {
        instance_id: v.id("task_instances"),
        file_name: v.string(),
        content_type: v.string(),
        base64_data: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const instance = await ctx.runQuery((api as any).taskInstances.getByIdForUpload, {
            instance_id: args.instance_id,
        });
        if (!instance) throw new Error("Instance not found");
        if (!instance.isAuthorized) throw new Error("Unauthorized");

        const fileBytes = decodeBase64ToBytes(args.base64_data);
        const proofType = getProofTypeFromMime(args.content_type);

        if (proofType === "photo" && fileBytes.byteLength > IMAGE_UPLOAD_LIMIT_BYTES) {
            throw new Error("Photo exceeds 10MB limit");
        }
        if (proofType === "video" && fileBytes.byteLength > VIDEO_UPLOAD_LIMIT_BYTES) {
            throw new Error("Video exceeds 50MB limit");
        }
        if (proofType === "voice" && fileBytes.byteLength > AUDIO_UPLOAD_LIMIT_BYTES) {
            throw new Error("Audio exceeds 100MB limit");
        }

        const safeName = sanitizeFileName(args.file_name);
        const key = `task-proofs/${instance.userId}/${instance.goalId}/${args.instance_id}/${Date.now()}-${safeName}`;
        const url = await uploadToR2(key, fileBytes, args.content_type);

        return {
            url,
            proof_type: proofType,
            mime_type: args.content_type,
            size_bytes: fileBytes.byteLength,
        };
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
