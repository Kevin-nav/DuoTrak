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

function normalizeMode(mode?: string): "photo" | "voice" | "time-window" {
  if (mode === "voice" || mode === "time-window") return mode;
  return "photo";
}

function isTimeWindowAutoApprovalEligible(task: any, nowMs: number): boolean {
  if (normalizeMode(task.verification_mode) !== "time-window") return false;
  if ((task.auto_approval_policy || "time_window_only") !== "time_window_only") return false;

  const timeoutHours = typeof task.auto_approval_timeout_hours === "number" ? task.auto_approval_timeout_hours : 24;
  const minConfidence = typeof task.auto_approval_min_confidence === "number" ? task.auto_approval_min_confidence : 0.85;
  const evidenceConfidence = typeof task.verification_evidence_confidence === "number" ? task.verification_evidence_confidence : 0;
  const submittedAt = typeof task.verification_submitted_at === "number" ? task.verification_submitted_at : 0;
  if (!submittedAt) return false;
  if (evidenceConfidence < minConfidence) return false;

  const timeoutMs = timeoutHours * 60 * 60 * 1000;
  return nowMs >= submittedAt + timeoutMs;
}

export const create = mutation({
  args: {
    goal_id: v.id("goals"),
    name: v.string(),
    description: v.optional(v.string()),
    repeat_frequency: v.optional(v.string()),
    due_date: v.optional(v.number()),
    time_window: v.optional(v.string()),
    accountability_type: v.optional(v.string()),
    verification_mode: v.optional(v.string()),
    verification_mode_reason: v.optional(v.string()),
    verification_confidence: v.optional(v.number()),
    time_window_start: v.optional(v.string()),
    time_window_end: v.optional(v.string()),
    auto_approval_policy: v.optional(v.string()),
    auto_approval_timeout_hours: v.optional(v.number()),
    auto_approval_min_confidence: v.optional(v.number()),
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
      time_window: args.time_window,
      accountability_type: args.accountability_type,
      verification_mode: args.verification_mode,
      verification_mode_reason: args.verification_mode_reason,
      verification_confidence: args.verification_confidence,
      time_window_start: args.time_window_start,
      time_window_end: args.time_window_end,
      auto_approval_policy: args.auto_approval_policy,
      auto_approval_timeout_hours: args.auto_approval_timeout_hours,
      auto_approval_min_confidence: args.auto_approval_min_confidence,
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

export const submitVerification = mutation({
  args: {
    id: v.id("tasks"),
    evidence_confidence: v.optional(v.number()),
    completed_at: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const task = await validateTaskOwnership(ctx, args.id, identity.subject);
    const now = Date.now();

    await ctx.db.patch(args.id, {
      status: "pending-verification",
      verification_submitted_at: args.completed_at ?? now,
      verification_evidence_confidence: args.evidence_confidence,
      verification_outcome: "pending_partner_review",
      verification_reviewed_at: undefined,
      verification_reviewer_type: undefined,
      verification_rejection_reason: undefined,
      updated_at: now,
    });

    return { ok: true };
  },
});

export const partnerReviewVerification = mutation({
  args: {
    id: v.id("tasks"),
    decision: v.union(v.literal("approved"), v.literal("rejected")),
    rejection_reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    await validateTaskOwnership(ctx, args.id, identity.subject);
    const now = Date.now();
    const approved = args.decision === "approved";

    await ctx.db.patch(args.id, {
      status: approved ? "verified" : "rejected",
      verification_reviewed_at: now,
      verification_reviewer_type: "partner",
      verification_outcome: args.decision,
      verification_rejection_reason: approved ? undefined : args.rejection_reason,
      updated_at: now,
    });

    return { ok: true };
  },
});

export const tryAutoApproveTimeWindow = mutation({
  args: {
    id: v.id("tasks"),
    now_ms: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const task = await validateTaskOwnership(ctx, args.id, identity.subject);
    const now = args.now_ms ?? Date.now();
    const eligible = isTimeWindowAutoApprovalEligible(task, now);

    if (!eligible) {
      return { auto_approved: false, reason: "Task does not meet time-window auto-approval policy." };
    }

    await ctx.db.patch(args.id, {
      status: "verified",
      verification_reviewed_at: now,
      verification_reviewer_type: "system",
      verification_outcome: "approved",
      verification_rejection_reason: undefined,
      updated_at: now,
    });

    return { auto_approved: true };
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
