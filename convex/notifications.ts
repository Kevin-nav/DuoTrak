import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { renderNotificationEmail } from "./lib/notificationEmail";
import { getLocalDayKey, normalizeTimeZone } from "./lib/streaks";

type NotificationCategory = "task" | "partner" | "progress" | "system" | "chat" | "journal";
type NotificationPriority = "low" | "medium" | "high";

function parseTimeToMinutes(value: string): number {
  const [hh, mm] = value.split(":").map((v) => Number(v));
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return 0;
  return hh * 60 + mm;
}

function isInQuietHours(now: Date, start: string, end: string): boolean {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = parseTimeToMinutes(start);
  const endMinutes = parseTimeToMinutes(end);
  if (startMinutes === endMinutes) return false;
  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

function toUtcDayKey(ts: number): string {
  const d = new Date(ts);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function getCurrentUserOrThrow(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthorized");
  const user = await ctx.db
    .query("users")
    .withIndex("by_firebase_uid", (q: any) => q.eq("firebase_uid", identity.subject))
    .unique();
  if (!user) throw new Error("User not found");
  return user;
}

async function getOrCreatePreferences(ctx: any, userId: Id<"users">) {
  const existing = await ctx.db
    .query("notification_preferences")
    .withIndex("by_user", (q: any) => q.eq("user_id", userId))
    .first();
  if (existing) return existing;

  const user = await ctx.db.get(userId);
  const now = Date.now();
  const prefId = await ctx.db.insert("notification_preferences", {
    user_id: userId,
    in_app_enabled: true,
    email_enabled: user?.notifications_enabled ?? true,
    quiet_hours_enabled: false,
    quiet_hours_start: "22:00",
    quiet_hours_end: "07:00",
    task_notifications: true,
    partner_notifications: true,
    chat_notifications: true,
    journal_notifications: true,
    progress_notifications: true,
    system_notifications: true,
    sound_enabled: true,
    created_at: now,
    updated_at: now,
  });
  return await ctx.db.get(prefId);
}

async function getPreferencesReadOnly(ctx: any, userId: Id<"users">) {
  const existing = await ctx.db
    .query("notification_preferences")
    .withIndex("by_user", (q: any) => q.eq("user_id", userId))
    .first();
  if (existing) return existing;

  const user = await ctx.db.get(userId);
  const now = Date.now();
  return {
    _id: undefined,
    _creationTime: now,
    user_id: userId,
    in_app_enabled: true,
    email_enabled: user?.notifications_enabled ?? true,
    quiet_hours_enabled: false,
    quiet_hours_start: "22:00",
    quiet_hours_end: "07:00",
    task_notifications: true,
    partner_notifications: true,
    chat_notifications: true,
    journal_notifications: true,
    progress_notifications: true,
    system_notifications: true,
    sound_enabled: true,
    created_at: now,
    updated_at: now,
  };
}

function categoryEnabled(preferences: any, category: NotificationCategory): boolean {
  if (category === "task") return !!preferences.task_notifications;
  if (category === "partner") return !!preferences.partner_notifications;
  if (category === "chat") return !!preferences.chat_notifications;
  if (category === "journal") return !!preferences.journal_notifications;
  if (category === "progress") return !!preferences.progress_notifications;
  return !!preferences.system_notifications;
}

export const list = query({
  args: {
    category: v.optional(v.string()),
    includeArchived: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const limit = Math.min(args.limit ?? 100, 200);
    const includeArchived = !!args.includeArchived;
    const category = args.category;

    const raw = await ctx.db
      .query("notifications")
      .withIndex("by_user_created", (q: any) => q.eq("user_id", user._id))
      .order("desc")
      .take(limit * 2);

    const now = Date.now();
    const items = raw
      .filter((n: any) => (includeArchived ? true : !n.archived_at))
      .filter((n: any) => (category && category !== "all" ? n.category === category : true))
      .filter((n: any) => !n.snoozed_until || n.snoozed_until <= now)
      .slice(0, limit)
      .map((n: any) => ({
        ...n,
        read: !!n.read_at,
        archived: !!n.archived_at,
      }));

    return items;
  },
});

export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user_created", (q: any) => q.eq("user_id", user._id))
      .order("desc")
      .take(200);
    return rows.filter((n: any) => !n.read_at && !n.archived_at).length;
  },
});

export const getPreferences = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    return await getPreferencesReadOnly(ctx, user._id);
  },
});

export const upsertPreferences = mutation({
  args: {
    in_app_enabled: v.optional(v.boolean()),
    email_enabled: v.optional(v.boolean()),
    quiet_hours_enabled: v.optional(v.boolean()),
    quiet_hours_start: v.optional(v.string()),
    quiet_hours_end: v.optional(v.string()),
    task_notifications: v.optional(v.boolean()),
    partner_notifications: v.optional(v.boolean()),
    chat_notifications: v.optional(v.boolean()),
    journal_notifications: v.optional(v.boolean()),
    progress_notifications: v.optional(v.boolean()),
    system_notifications: v.optional(v.boolean()),
    sound_enabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const existing = await getOrCreatePreferences(ctx, user._id);
    await ctx.db.patch(existing._id, {
      ...args,
      updated_at: Date.now(),
    });
    return { ok: true };
  },
});

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const row = await ctx.db.get(args.notificationId);
    if (!row || row.user_id !== user._id) throw new Error("Notification not found");
    const now = Date.now();
    await ctx.db.patch(args.notificationId, { read_at: now, updated_at: now });

    if (row.category === "chat" && row.related_entity_type === "conversation" && row.related_entity_id) {
      await ctx.scheduler.runAfter(
        0,
        (internal as any).chat.markConversationReadForUser,
        {
          conversation_id: row.related_entity_id,
          user_id: user._id,
        }
      );
      await ctx.scheduler.runAfter(
        0,
        (internal as any).notifications.clearChatNotificationsForConversation,
        {
          userId: user._id,
          conversationId: row.related_entity_id,
        }
      );
    }

    return { ok: true };
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user_created", (q: any) => q.eq("user_id", user._id))
      .order("desc")
      .take(300);
    const now = Date.now();
    await Promise.all(
      rows
        .filter((row: any) => !row.read_at)
        .map((row: any) => ctx.db.patch(row._id, { read_at: now, updated_at: now }))
    );
    return { ok: true };
  },
});

export const archive = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const row = await ctx.db.get(args.notificationId);
    if (!row || row.user_id !== user._id) throw new Error("Notification not found");
    await ctx.db.patch(args.notificationId, { archived_at: Date.now(), updated_at: Date.now() });
    return { ok: true };
  },
});

export const snooze = mutation({
  args: {
    notificationId: v.id("notifications"),
    durationMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const row = await ctx.db.get(args.notificationId);
    if (!row || row.user_id !== user._id) throw new Error("Notification not found");
    const until = Date.now() + Math.max(1, args.durationMinutes) * 60_000;
    await ctx.db.patch(args.notificationId, { snoozed_until: until, updated_at: Date.now() });
    return { ok: true };
  },
});

export const bulkAction = mutation({
  args: {
    notificationIds: v.array(v.id("notifications")),
    action: v.string(), // mark-read | archive
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);
    const now = Date.now();
    for (const notificationId of args.notificationIds) {
      const row = await ctx.db.get(notificationId);
      if (!row || row.user_id !== user._id) continue;
      if (args.action === "mark-read") {
        await ctx.db.patch(notificationId, { read_at: now, updated_at: now });
      } else if (args.action === "archive") {
        await ctx.db.patch(notificationId, { archived_at: now, updated_at: now });
      }
    }
    return { ok: true };
  },
});

export const createInApp = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.string(),
    category: v.string(),
    title: v.string(),
    message: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    actionable: v.optional(v.boolean()),
    related_entity_type: v.optional(v.string()),
    related_entity_id: v.optional(v.string()),
    metadata_json: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const prefs = await getOrCreatePreferences(ctx, args.userId);
    const category = args.category as NotificationCategory;
    const enabled = prefs.in_app_enabled && categoryEnabled(prefs, category);
    const now = Date.now();

    if (!enabled) {
      await ctx.db.insert("notification_deliveries", {
        notification_id: undefined,
        user_id: args.userId,
        channel: "in_app",
        status: "skipped",
        provider: undefined,
        template_key: args.type,
        error_message: "In-app notifications disabled by preference.",
        sent_at: undefined,
        created_at: now,
        updated_at: now,
      });
      return null;
    }

    let notificationId: Id<"notifications">;

    // Consolidate chat notifications by conversation to avoid one-row-per-message noise.
    if (args.category === "chat" && args.related_entity_type === "conversation" && args.related_entity_id) {
      const recent = await ctx.db
        .query("notifications")
        .withIndex("by_user_created", (q: any) => q.eq("user_id", args.userId))
        .order("desc")
        .take(120);

      const existing = recent.find(
        (row: any) =>
          row.category === "chat" &&
          row.related_entity_type === "conversation" &&
          row.related_entity_id === args.related_entity_id &&
          !row.archived_at
      );

      if (existing) {
        const existingMeta = existing.metadata_json ? JSON.parse(existing.metadata_json) : {};
        const nextCount = typeof existingMeta.count === "number" ? existingMeta.count + 1 : 2;
        await ctx.db.patch(existing._id, {
          type: args.type,
          title: args.title,
          message: args.message,
          priority: args.priority,
          actionable: args.actionable ?? false,
          read_at: undefined,
          archived_at: undefined,
          snoozed_until: undefined,
          metadata_json: JSON.stringify({
            ...existingMeta,
            count: nextCount,
            latestAt: now,
          }),
          updated_at: now,
        });
        notificationId = existing._id;
      } else {
        notificationId = await ctx.db.insert("notifications", {
          user_id: args.userId,
          type: args.type,
          category: args.category,
          title: args.title,
          message: args.message,
          priority: args.priority,
          actionable: args.actionable ?? false,
          read_at: undefined,
          archived_at: undefined,
          snoozed_until: undefined,
          related_entity_type: args.related_entity_type,
          related_entity_id: args.related_entity_id,
          metadata_json: JSON.stringify({ count: 1, latestAt: now }),
          created_at: now,
          updated_at: now,
        });
      }
    } else {
      notificationId = await ctx.db.insert("notifications", {
        user_id: args.userId,
        type: args.type,
        category: args.category,
        title: args.title,
        message: args.message,
        priority: args.priority,
        actionable: args.actionable ?? false,
        read_at: undefined,
        archived_at: undefined,
        snoozed_until: undefined,
        related_entity_type: args.related_entity_type,
        related_entity_id: args.related_entity_id,
        metadata_json: args.metadata_json,
        created_at: now,
        updated_at: now,
      });
    }

    await ctx.db.insert("notification_deliveries", {
      notification_id: notificationId,
      user_id: args.userId,
      channel: "in_app",
      status: "sent",
      provider: "convex",
      template_key: args.type,
      error_message: undefined,
      sent_at: now,
      created_at: now,
      updated_at: now,
    });

    return notificationId;
  },
});

export const clearChatNotificationsForConversation = internalMutation({
  args: {
    userId: v.id("users"),
    conversationId: v.string(),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user_created", (q: any) => q.eq("user_id", args.userId))
      .order("desc")
      .take(200);
    const now = Date.now();
    await Promise.all(
      rows
        .filter(
          (row: any) =>
            row.category === "chat" &&
            row.related_entity_type === "conversation" &&
            row.related_entity_id === args.conversationId &&
            !row.archived_at
        )
        .map((row: any) =>
          ctx.db.patch(row._id, {
            read_at: row.read_at || now,
            archived_at: now,
            updated_at: now,
          })
        )
    );
    return { ok: true };
  },
});

export const getEmailContext = internalQuery({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (!notification) return null;
    const user = await ctx.db.get(notification.user_id);
    if (!user) return null;
    const prefs = await getPreferencesReadOnly(ctx, notification.user_id);
    return { notification, user, prefs };
  },
});

export const sendEmailForNotification = internalAction({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const context = await ctx.runQuery((internal as any).notifications.getEmailContext, args);
    if (!context) return { ok: false, error: "Notification or user not found." };

    const { notification, user, prefs } = context as any;
    const now = Date.now();
    const deliveryBase = {
      notification_id: notification._id,
      user_id: user._id,
      channel: "email",
      template_key: notification.type,
      created_at: now,
      updated_at: now,
    };

    if (!prefs.email_enabled) {
      await ctx.runMutation((internal as any).notifications.recordEmailDelivery, {
        ...deliveryBase,
        status: "skipped",
        provider: "resend",
        error_message: "Email notifications disabled.",
      });
      return { ok: true, skipped: true };
    }

    if (prefs.quiet_hours_enabled && notification.priority !== "high") {
      const nowDate = new Date();
      if (isInQuietHours(nowDate, prefs.quiet_hours_start, prefs.quiet_hours_end)) {
        await ctx.runMutation((internal as any).notifications.recordEmailDelivery, {
          ...deliveryBase,
          status: "skipped",
          provider: "resend",
          error_message: "Within quiet hours.",
        });
        return { ok: true, skipped: true };
      }
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      await ctx.runMutation((internal as any).notifications.recordEmailDelivery, {
        ...deliveryBase,
        status: "failed",
        provider: "resend",
        error_message: "RESEND_API_KEY is not configured.",
      });
      return { ok: false, error: "RESEND_API_KEY is not configured." };
    }

    const from = process.env.RESEND_FROM_EMAIL || "DuoTrak <no-reply@duotrak.org>";
    const actionLabelByType: Record<string, string> = {
      shared_streak_save_needed: "Save Streak",
      verification_requested: "Review Proof",
      verification_rejected: "Retry Task",
    };
    const rendered = renderNotificationEmail({
      title: notification.title,
      message: notification.message,
      actionUrl:
        process.env.APP_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.SITE_URL ||
        "https://duotrak.org",
      actionLabel: actionLabelByType[notification.type] || "Open DuoTrak",
    });

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: user.email,
          subject: rendered.subject,
          html: rendered.html,
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`Resend error ${response.status}: ${responseText}`);
      }

      await ctx.runMutation((internal as any).notifications.recordEmailDelivery, {
        ...deliveryBase,
        status: "sent",
        provider: "resend",
      });
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown email delivery error.";
      await ctx.runMutation((internal as any).notifications.recordEmailDelivery, {
        ...deliveryBase,
        status: "failed",
        provider: "resend",
        error_message: message,
      });
      return { ok: false, error: message };
    }
  },
});

export const recordEmailDelivery = internalMutation({
  args: {
    notification_id: v.optional(v.id("notifications")),
    user_id: v.id("users"),
    channel: v.string(),
    status: v.string(),
    provider: v.optional(v.string()),
    template_key: v.optional(v.string()),
    error_message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("notification_deliveries", {
      notification_id: args.notification_id,
      user_id: args.user_id,
      channel: args.channel,
      status: args.status,
      provider: args.provider,
      template_key: args.template_key,
      error_message: args.error_message,
      sent_at: args.status === "sent" ? now : undefined,
      created_at: now,
      updated_at: now,
    });
    return { ok: true };
  },
});

export const dispatchEvent: any = internalAction({
  args: {
    eventType: v.string(),
    recipientUserId: v.id("users"),
    actorUserId: v.optional(v.id("users")),
    context: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any): Promise<any> => {
    const context = args.context ? JSON.parse(args.context) : {};
    const actor = args.actorUserId
      ? await (ctx as any).runQuery((internal as any).notifications.getUserSafe, { userId: args.actorUserId })
      : null;
    const actorName = actor?.displayName || "Your partner";

    if (
      (args.eventType === "new_message" || args.eventType === "partner_nudge") &&
      context.conversationId
    ) {
      const isActive = await (ctx as any).runQuery(
        (internal as any).chat.isUserActivelyViewingConversation,
        {
          user_id: args.recipientUserId,
          conversation_id: context.conversationId,
        }
      );
      if (isActive) {
        return { ok: true, suppressed: true, reason: "recipient_active_in_chat" };
      }
    }

    let payload: {
      type: string;
      category: NotificationCategory;
      title: string;
      message: string;
      priority: NotificationPriority;
      actionable?: boolean;
      related_entity_type?: string;
      related_entity_id?: string;
      metadata_json?: string;
      sendEmail?: boolean;
    };

    switch (args.eventType) {
      case "invitation_viewed":
        payload = {
          type: "invitation_viewed",
          category: "partner",
          title: "Invitation Viewed",
          message: `${context.receiverEmail || "Your partner"} opened your invitation link.`,
          priority: "medium",
          actionable: false,
          sendEmail: false,
        };
        break;
      case "invitation_accepted":
        payload = {
          type: "invitation_accepted",
          category: "partner",
          title: "Invitation Accepted",
          message: `${actorName} accepted your invite. Your partnership is now active.`,
          priority: "high",
          actionable: false,
          sendEmail: true,
        };
        break;
      case "invite_email_failed":
        payload = {
          type: "invite_email_failed",
          category: "system",
          title: "Invite Email Failed",
          message: context.errorMessage || "We could not deliver your invitation email.",
          priority: "high",
          actionable: true,
          sendEmail: false,
        };
        break;
      case "new_message":
        payload = {
          type: "new_message",
          category: "chat",
          title: `New message from ${actorName}`,
          message: context.preview || "You received a new message.",
          priority: "medium",
          actionable: true,
          related_entity_type: "conversation",
          related_entity_id: context.conversationId || undefined,
          sendEmail: false,
        };
        break;
      case "partner_nudge":
        payload = {
          type: "partner_nudge",
          category: "chat",
          title: `${actorName} sent you a nudge`,
          message: context.preview || "A quick reminder from your partner.",
          priority: "high",
          actionable: true,
          related_entity_type: "conversation",
          related_entity_id: context.conversationId || undefined,
          sendEmail: true,
        };
        break;
      case "verification_requested":
        payload = {
          type: "verification_requested",
          category: "task",
          title: "Verification Needed",
          message: `${actorName} submitted a task for review.`,
          priority: "high",
          actionable: true,
          related_entity_type: "task",
          related_entity_id: context.taskId || undefined,
          metadata_json: JSON.stringify({
            actorUserId: args.actorUserId ? String(args.actorUserId) : undefined,
            goalId: context.goalId || undefined,
          }),
          sendEmail: true,
        };
        break;
      case "journal_entry_shared":
        payload = {
          type: "journal_entry_shared",
          category: "journal",
          title: "New Shared Journal Entry",
          message: `${actorName} shared a private journal entry with you.`,
          priority: "medium",
          actionable: true,
          related_entity_type: "journal_entry",
          related_entity_id: context.entryId || undefined,
          sendEmail: false,
        };
        break;
      case "journal_entry_reacted":
        payload = {
          type: "journal_entry_reacted",
          category: "journal",
          title: `${actorName} reacted to your entry`,
          message: context.reactionKey
            ? `${actorName} reacted with "${context.reactionKey}" on "${context.title || "your journal entry"}".`
            : `${actorName} reacted to your shared journal entry.`,
          priority: "medium",
          actionable: true,
          related_entity_type: "journal_entry",
          related_entity_id: context.entryId || undefined,
          sendEmail: false,
        };
        break;
      case "journal_entry_commented":
        payload = {
          type: "journal_entry_commented",
          category: "journal",
          title: `${actorName} commented on your entry`,
          message: context.preview || `${actorName} left a comment on your shared journal entry.`,
          priority: "high",
          actionable: true,
          related_entity_type: "journal_entry",
          related_entity_id: context.entryId || undefined,
          sendEmail: false,
        };
        break;
      case "journal_streak_risk":
        payload = {
          type: "journal_streak_risk",
          category: "journal",
          title: "Journal streak at risk",
          message: context.message || "Add a quick reflection today to keep your streak alive.",
          priority: "high",
          actionable: true,
          related_entity_type: "journal",
          related_entity_id: "streak",
          sendEmail: false,
        };
        break;
      case "journal_partner_silence_nudge":
        payload = {
          type: "journal_partner_silence_nudge",
          category: "journal",
          title: "Partner response reminder",
          message: context.message || "Your shared reflection is waiting for a partner response.",
          priority: "medium",
          actionable: true,
          related_entity_type: "journal_entry",
          related_entity_id: context.entryId || undefined,
          sendEmail: false,
        };
        break;
      case "verification_approved":
        payload = {
          type: "verification_approved",
          category: "task",
          title: "Task Verified",
          message: context.taskName
            ? `Great news: "${context.taskName}" was approved.`
            : "Your task verification was approved.",
          priority: "medium",
          actionable: false,
          related_entity_type: "task",
          related_entity_id: context.taskId || undefined,
          sendEmail: false,
        };
        break;
      case "verification_rejected":
        payload = {
          type: "verification_rejected",
          category: "task",
          title: "Verification Rejected",
          message: context.rejectionReason
            ? `Reason: ${context.rejectionReason}`
            : "A verification was rejected and needs your attention.",
          priority: "high",
          actionable: true,
          related_entity_type: "task",
          related_entity_id: context.taskId || undefined,
          sendEmail: true,
        };
        break;
      case "verification_auto_approved":
        payload = {
          type: "verification_auto_approved",
          category: "task",
          title: "Auto-approved Task",
          message: context.taskName
            ? `"${context.taskName}" met your auto-approval rules.`
            : "A task was automatically approved.",
          priority: "medium",
          actionable: false,
          related_entity_type: "task",
          related_entity_id: context.taskId || undefined,
          sendEmail: false,
        };
        break;
      case "goal_milestone":
        payload = {
          type: "goal_milestone",
          category: "progress",
          title: `${context.milestone || ""}% Goal Milestone`.trim(),
          message: context.goalName
            ? `You reached ${context.milestone || ""}% on "${context.goalName}".`
            : "You reached a major goal milestone.",
          priority: "medium",
          actionable: false,
          related_entity_type: "goal",
          related_entity_id: context.goalId || undefined,
          metadata_json: JSON.stringify({
            milestone: context.milestone,
            progressPercent: context.progressPercent,
          }),
          sendEmail: false,
        };
        break;
      case "goal_completed":
        payload = {
          type: "goal_completed",
          category: "progress",
          title: "Goal Completed",
          message: context.goalName
            ? `You completed "${context.goalName}".`
            : "You completed a goal.",
          priority: "high",
          actionable: false,
          related_entity_type: "goal",
          related_entity_id: context.goalId || undefined,
          sendEmail: true,
        };
        break;
      case "partner_achievement":
        payload = {
          type: "partner_achievement",
          category: "partner",
          title: "Partner Achievement",
          message: context.goalName
            ? `${actorName} completed "${context.goalName}".`
            : `${actorName} just hit a milestone.`,
          priority: "medium",
          actionable: false,
          related_entity_type: "goal",
          related_entity_id: context.goalId || undefined,
          sendEmail: false,
        };
        break;
      case "shared_streak_save_needed":
        payload = {
          type: "shared_streak_save_needed",
          category: "partner",
          title: "Save your Duo streak 🔥",
          message:
            context.message ||
            `${actorName} showed up today. Do one quick action to keep your shared streak alive.`,
          priority: "high",
          actionable: true,
          related_entity_type: "partnership",
          related_entity_id: context.partnershipId || undefined,
          sendEmail: true,
        };
        break;
      case "task_due_soon":
        payload = {
          type: "task_due_soon",
          category: "task",
          title: "Task Due Soon",
          message: context.taskName
            ? `"${context.taskName}" is due soon.`
            : "You have a task due soon.",
          priority: "medium",
          actionable: true,
          related_entity_type: "task",
          related_entity_id: context.taskId || undefined,
          sendEmail: false,
        };
        break;
      case "task_overdue":
        payload = {
          type: "task_overdue",
          category: "task",
          title: "Task Overdue",
          message: context.taskName
            ? `"${context.taskName}" is overdue.`
            : "A task is overdue and needs attention.",
          priority: "high",
          actionable: true,
          related_entity_type: "task",
          related_entity_id: context.taskId || undefined,
          sendEmail: true,
        };
        break;
      case "weekly_summary":
        payload = {
          type: "weekly_summary",
          category: "progress",
          title: "Weekly Summary",
          message:
            context.summary ||
            "Your weekly progress summary is ready.",
          priority: "low",
          actionable: true,
          related_entity_type: "summary",
          related_entity_id: context.weekKey || undefined,
          sendEmail: true,
        };
        break;
      default:
        payload = {
          type: "system_update",
          category: "system",
          title: "New Update",
          message: "You have a new update in DuoTrak.",
          priority: "low",
          actionable: false,
          sendEmail: false,
        };
    }

    const dedupeCooldownByTypeMs: Record<string, number> = {
      journal_entry_reacted: 30 * 60 * 1000,
      journal_entry_commented: 10 * 60 * 1000,
      journal_streak_risk: 12 * 60 * 60 * 1000,
      journal_partner_silence_nudge: 12 * 60 * 60 * 1000,
    };
    const cooldownMs = dedupeCooldownByTypeMs[payload.type];
    if (cooldownMs) {
      const exists = await ctx.runQuery((internal as any).notifications.hasRecentNotification, {
        userId: args.recipientUserId,
        type: payload.type,
        relatedEntityType: payload.related_entity_type,
        relatedEntityId: payload.related_entity_id,
        sinceMs: Date.now() - cooldownMs,
      });
      if (exists) {
        return { ok: true, deduped: true };
      }
    }

    let shouldSendEmail = !!payload.sendEmail;
    if (payload.type === "verification_requested" && shouldSendEmail) {
      const hasAnyPriorVerificationRequest = await ctx.runQuery((internal as any).notifications.hasRecentNotification, {
        userId: args.recipientUserId,
        type: payload.type,
        relatedEntityType: undefined,
        relatedEntityId: undefined,
        sinceMs: 0,
      });
      shouldSendEmail = !hasAnyPriorVerificationRequest;
    }

    const notificationId: Id<"notifications"> | null = await ctx.runMutation((internal as any).notifications.createInApp, {
      userId: args.recipientUserId,
      type: payload.type,
      category: payload.category,
      title: payload.title,
      message: payload.message,
      priority: payload.priority,
      actionable: payload.actionable,
      related_entity_type: payload.related_entity_type,
      related_entity_id: payload.related_entity_id,
      metadata_json: payload.metadata_json,
    });

    if (shouldSendEmail && notificationId) {
      await ctx.scheduler.runAfter(0, (internal as any).notifications.sendEmailForNotification, {
        notificationId,
      });
    }

    return { ok: true, notificationId };
  },
});

export const getUserSafe = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;
    return {
      _id: user._id,
      displayName: user.full_name || user.nickname || user.email || "Partner",
      email: user.email,
    };
  },
});

export const hasRecentNotification = internalQuery({
  args: {
    userId: v.id("users"),
    type: v.string(),
    relatedEntityType: v.optional(v.string()),
    relatedEntityId: v.optional(v.string()),
    sinceMs: v.number(),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user_created", (q: any) => q.eq("user_id", args.userId))
      .order("desc")
      .take(200);

    return rows.some(
      (row: any) =>
        row.type === args.type &&
        row.created_at >= args.sinceMs &&
        (args.relatedEntityType ? row.related_entity_type === args.relatedEntityType : true) &&
        (args.relatedEntityId ? row.related_entity_id === args.relatedEntityId : true)
    );
  },
});

export const runDailyReminderSweep: any = internalAction({
  args: {},
  handler: async (ctx: any): Promise<any> => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const users: any[] = await (ctx as any).runQuery((internal as any).notifications.listUsersForSweep, {});

    for (const user of users as any[]) {
      const workload = await ctx.runQuery((internal as any).notifications.getUserTaskSweepData, {
        userId: user._id,
      });
      const journalWorkload = await ctx.runQuery((internal as any).notifications.getUserJournalSweepData, {
        userId: user._id,
      });

      for (const task of (workload?.tasks || []) as any[]) {
        if (!task.due_date) continue;
        if (isTaskDone(task.status)) continue;

        const relatedTaskId = String(task._id);
        if (task.due_date <= now) {
          const exists = await ctx.runQuery((internal as any).notifications.hasRecentNotification, {
            userId: user._id,
            type: "task_overdue",
            relatedEntityType: "task",
            relatedEntityId: relatedTaskId,
            sinceMs: now - oneDayMs,
          });
          if (!exists) {
            await ctx.runAction((internal as any).notifications.dispatchEvent, {
              eventType: "task_overdue",
              recipientUserId: user._id,
              context: JSON.stringify({
                taskId: relatedTaskId,
                goalId: task.goal_id ? String(task.goal_id) : undefined,
                taskName: task.name,
                instanceDate: task.due_date,
              }),
            });
          }
        } else if (task.due_date <= now + oneDayMs) {
          const exists = await ctx.runQuery((internal as any).notifications.hasRecentNotification, {
            userId: user._id,
            type: "task_due_soon",
            relatedEntityType: "task",
            relatedEntityId: relatedTaskId,
            sinceMs: now - oneDayMs,
          });
          if (!exists) {
            await ctx.runAction((internal as any).notifications.dispatchEvent, {
              eventType: "task_due_soon",
              recipientUserId: user._id,
              context: JSON.stringify({
                taskId: relatedTaskId,
                goalId: task.goal_id ? String(task.goal_id) : undefined,
                taskName: task.name,
                instanceDate: task.due_date,
              }),
            });
          }
        }
      }

      if (journalWorkload?.streakAtRisk) {
        await ctx.runAction((internal as any).notifications.dispatchEvent, {
          eventType: "journal_streak_risk",
          recipientUserId: user._id,
          context: JSON.stringify({
            message: "You have not journaled recently. Add a quick reflection today.",
          }),
        });
      }

      if (journalWorkload?.pendingPartnerResponseEntryId) {
        await ctx.runAction((internal as any).notifications.dispatchEvent, {
          eventType: "journal_partner_silence_nudge",
          recipientUserId: user._id,
          context: JSON.stringify({
            entryId: journalWorkload.pendingPartnerResponseEntryId,
            message: "A shared reflection is still waiting for your partner response.",
          }),
        });
      }
    }

    return { ok: true, usersProcessed: (users as any[]).length };
  },
});

export const listActivePartnershipsForStreakSweep = internalQuery({
  args: {},
  handler: async (ctx) => {
    const partnerships = await ctx.db
      .query("partnerships")
      .withIndex("by_status", (q: any) => q.eq("status", "active"))
      .collect();

    const rows: any[] = [];
    for (const partnership of partnerships) {
      const user1 = await ctx.db.get(partnership.user1_id);
      const user2 = await ctx.db.get(partnership.user2_id);
      if (!user1 || !user2) continue;
      rows.push({
        partnership,
        user1,
        user2,
      });
    }
    return rows;
  },
});

export const markStreakNudgeSent = internalMutation({
  args: {
    partnershipId: v.id("partnerships"),
    recipientUserId: v.id("users"),
    dayKey: v.string(),
  },
  handler: async (ctx, args) => {
    const partnership = await ctx.db.get(args.partnershipId);
    if (!partnership) return { ok: false };

    if (String(partnership.user1_id) === String(args.recipientUserId)) {
      await ctx.db.patch(partnership._id, {
        user1_last_streak_nudge_day: args.dayKey,
        updated_at: Date.now(),
      });
      return { ok: true };
    }

    if (String(partnership.user2_id) === String(args.recipientUserId)) {
      await ctx.db.patch(partnership._id, {
        user2_last_streak_nudge_day: args.dayKey,
        updated_at: Date.now(),
      });
      return { ok: true };
    }

    return { ok: false };
  },
});

export const runSharedStreakNudgeSweep: any = internalAction({
  args: {},
  handler: async (ctx: any): Promise<any> => {
    const now = Date.now();
    const rows: any[] = await ctx.runQuery(
      (internal as any).notifications.listActivePartnershipsForStreakSweep,
      {}
    );

    let nudgesSent = 0;
    for (const row of rows) {
      const partnership = row.partnership;
      const user1 = row.user1;
      const user2 = row.user2;

      const day1 = getLocalDayKey(now, normalizeTimeZone(user1.timezone));
      const day2 = getLocalDayKey(now, normalizeTimeZone(user2.timezone));

      const user1Done = user1.last_streak_activity_day === day1;
      const user2Done = user2.last_streak_activity_day === day2;
      if (user1Done === user2Done) continue;

      if (user1Done && !user2Done) {
        if (partnership.user2_last_streak_nudge_day === day2) continue;
        await ctx.runAction((internal as any).notifications.dispatchEvent, {
          eventType: "shared_streak_save_needed",
          recipientUserId: user2._id,
          actorUserId: user1._id,
          context: JSON.stringify({
            partnershipId: String(partnership._id),
            message: `${user1.full_name || user1.nickname || "Your partner"} has already checked in today. Jump in now so your duo streak doesn't snap.`,
            sharedStreak: partnership.shared_current_streak ?? 0,
          }),
        });
        await ctx.runMutation((internal as any).notifications.markStreakNudgeSent, {
          partnershipId: partnership._id,
          recipientUserId: user2._id,
          dayKey: day2,
        });
        nudgesSent += 1;
        continue;
      }

      if (user2Done && !user1Done) {
        if (partnership.user1_last_streak_nudge_day === day1) continue;
        await ctx.runAction((internal as any).notifications.dispatchEvent, {
          eventType: "shared_streak_save_needed",
          recipientUserId: user1._id,
          actorUserId: user2._id,
          context: JSON.stringify({
            partnershipId: String(partnership._id),
            message: `${user2.full_name || user2.nickname || "Your partner"} has already checked in today. One quick move from you keeps the streak alive.`,
            sharedStreak: partnership.shared_current_streak ?? 0,
          }),
        });
        await ctx.runMutation((internal as any).notifications.markStreakNudgeSent, {
          partnershipId: partnership._id,
          recipientUserId: user1._id,
          dayKey: day1,
        });
        nudgesSent += 1;
      }
    }

    return { ok: true, partnershipsProcessed: rows.length, nudgesSent };
  },
});

export const runWeeklySummarySweep: any = internalAction({
  args: {},
  handler: async (ctx: any): Promise<any> => {
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const weekKey = new Date(now).toISOString().slice(0, 10);
    const users: any[] = await (ctx as any).runQuery((internal as any).notifications.listUsersForSweep, {});

    for (const user of users as any[]) {
      const workload = await ctx.runQuery((internal as any).notifications.getUserTaskSweepData, {
        userId: user._id,
      });
      const instances = (workload?.instances || []) as any[];
      const weeklyInstances = instances.filter((instance: any) => {
        const date = instance.instance_date ?? instance.updated_at ?? 0;
        return date >= now - weekMs;
      });
      const total = weeklyInstances.length;
      const completed = weeklyInstances.filter((instance: any) => isTaskDone(instance.status)).length;

      const exists = await ctx.runQuery((internal as any).notifications.hasRecentNotification, {
        userId: user._id,
        type: "weekly_summary",
        relatedEntityType: "summary",
        relatedEntityId: weekKey,
        sinceMs: now - weekMs,
      });
      if (exists) continue;

      await ctx.runAction((internal as any).notifications.dispatchEvent, {
        eventType: "weekly_summary",
        recipientUserId: user._id,
        context: JSON.stringify({
          weekKey,
          summary: `This week you completed ${completed} task${completed === 1 ? "" : "s"} across ${total} tracked task${total === 1 ? "" : "s"}.`,
        }),
      });
    }

    return { ok: true, usersProcessed: (users as any[]).length };
  },
});

export const runChatNotificationCleanup: any = internalAction({
  args: {},
  handler: async (ctx: any): Promise<any> => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const users: any[] = await (ctx as any).runQuery((internal as any).notifications.listUsersForSweep, {});
    let deleted = 0;

    for (const user of users) {
      const rows = await (ctx as any).db
        .query("notifications")
        .withIndex("by_user_created", (q: any) => q.eq("user_id", user._id))
        .order("desc")
        .take(500);

      const staleChatRows = rows.filter(
        (row: any) =>
          row.category === "chat" &&
          !!row.archived_at &&
          row.archived_at <= cutoff
      );

      for (const row of staleChatRows) {
        await (ctx as any).db.delete(row._id);
        deleted += 1;
      }
    }

    return { ok: true, deleted };
  },
});

export const listUsersForSweep = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

export const getUserTaskSweepData = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const goals = await ctx.db
      .query("goals")
      .withIndex("by_user", (q: any) => q.eq("user_id", args.userId))
      .filter((q: any) => q.eq(q.field("is_archived"), false))
      .collect();

    const tasks: any[] = [];
    const instances: any[] = [];
    for (const goal of goals) {
      const rows = await ctx.db
        .query("tasks")
        .withIndex("by_goal", (q: any) => q.eq("goal_id", goal._id))
        .collect();
      tasks.push(...rows);

      const instanceRows = await ctx.db
        .query("task_instances")
        .withIndex("by_goal_date", (q: any) => q.eq("goal_id", goal._id))
        .collect();
      instances.push(...instanceRows);
    }

    return { tasks, instances };
  },
});

export const getUserJournalSweepData = internalQuery({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    const privateSpace = await ctx.db
      .query("journal_spaces")
      .withIndex("by_owner_type", (q: any) => q.eq("owner_user_id", args.userId).eq("type", "private"))
      .first();

    const latestPrivate = privateSpace
      ? await ctx.db
          .query("journal_entries")
          .withIndex("by_space_updated", (q: any) => q.eq("space_id", privateSpace._id))
          .order("desc")
          .first()
      : null;
    const streakAtRisk = !latestPrivate || latestPrivate.created_at <= now - oneDayMs;

    const partnershipByUser1 = await ctx.db
      .query("partnerships")
      .withIndex("by_user1", (q: any) => q.eq("user1_id", args.userId))
      .filter((q: any) => q.eq(q.field("status"), "active"))
      .first();
    const partnership = partnershipByUser1 ?? await ctx.db
      .query("partnerships")
      .withIndex("by_user2", (q: any) => q.eq("user2_id", args.userId))
      .filter((q: any) => q.eq(q.field("status"), "active"))
      .first();

    if (!partnership) {
      return {
        streakAtRisk,
        pendingPartnerResponseEntryId: null,
      };
    }

    const partnerUserId =
      partnership.user1_id === args.userId ? partnership.user2_id : partnership.user1_id;

    const sharedSpace = await ctx.db
      .query("journal_spaces")
      .withIndex("by_partnership_type", (q: any) => q.eq("partnership_id", partnership._id).eq("type", "shared"))
      .first();

    if (!sharedSpace) {
      return {
        streakAtRisk,
        pendingPartnerResponseEntryId: null,
      };
    }

    const sharedEntries = await ctx.db
      .query("journal_entries")
      .withIndex("by_space_updated", (q: any) => q.eq("space_id", sharedSpace._id))
      .order("desc")
      .take(120);

    const todayKey = toUtcDayKey(now);
    const userSharedToday = sharedEntries.some((entry: any) =>
      entry.created_by === args.userId && toUtcDayKey(entry.created_at) === todayKey
    );

    if (!userSharedToday) {
      return {
        streakAtRisk,
        pendingPartnerResponseEntryId: null,
      };
    }

    const myRecentEntries = sharedEntries.filter((entry: any) => entry.created_by === args.userId);
    for (const entry of myRecentEntries) {
      const partnerInteraction = await ctx.db
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
      if (!partnerInteraction && !partnerReaction && entry.created_at <= now - (12 * 60 * 60 * 1000)) {
        return {
          streakAtRisk,
          pendingPartnerResponseEntryId: String(entry._id),
        };
      }
    }

    return {
      streakAtRisk,
      pendingPartnerResponseEntryId: null,
    };
  },
});

function isTaskDone(status?: string): boolean {
  return status === "verified" || status === "completed" || status === "Completed";
}
