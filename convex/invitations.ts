import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { buildInviteUrl } from "./lib/inviteUrl";
import {
  renderPartnerInvitationEmail,
  renderPartnerNudgeEmail,
} from "./lib/invitationEmail";
import {
  assertInvitationReceiverMatch,
  assertNotSelfInvite,
} from "./lib/invitationAcceptance";

const INVITATION_EXPIRY_DAYS = 7;
const INVITE_EMAIL_RETRY_COOLDOWN_MS = 60 * 1000;

// ============================================
// QUERIES - Public (no auth required for some)
// ============================================

/**
 * Get invitation details by token (public query for invite-acceptance page).
 * Returns sender info and invitation details without requiring authentication.
 */
export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("partner_invitations")
      .withIndex("by_token", (q) => q.eq("invitation_token", args.token))
      .first();

    if (!invitation) {
      return { error: "INVITATION_NOT_FOUND", invitation: null };
    }

    if (invitation.status !== "pending") {
      return { error: "INVITATION_ALREADY_USED", invitation: null };
    }

    if (invitation.expires_at && invitation.expires_at < Date.now()) {
      return { error: "INVITATION_EXPIRED", invitation: null };
    }

    // Get sender details
    const sender = await ctx.db.get(invitation.sender_id);

    return {
      error: null,
      invitation: {
        senderName: sender?.full_name ?? "Your future partner",
        senderProfilePictureUrl: sender?.profile_picture_url,
        senderEmail: sender?.email,
        receiverEmail: invitation.receiver_email,
        receiverName: invitation.receiver_name,
        customMessage: invitation.message,
        status: invitation.status,
        expiresAt: invitation.expires_at,
        createdAt: invitation.updated_at,
      },
    };
  },
});

/**
 * Get the current user's pending sent invitation.
 * Used by the waiting room to show invitation status.
 */
export const getPendingSentInvitation = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
      .unique();

    if (!user) return null;

    // Use the by_sender index for efficient querying
    const pendingInvitation = await ctx.db
      .query("partner_invitations")
      .withIndex("by_sender", (q) =>
        q.eq("sender_id", user._id).eq("status", "pending")
      )
      .first();

    if (!pendingInvitation) return null;

    return {
      id: pendingInvitation._id,
      receiverName: pendingInvitation.receiver_name,
      receiverEmail: pendingInvitation.receiver_email,
      token: pendingInvitation.invitation_token,
      status: pendingInvitation.status,
      expiresAt: pendingInvitation.expires_at,
      viewedAt: pendingInvitation.viewed_at,
      lastNudgedAt: pendingInvitation.last_nudged_at,
      emailSentAt: pendingInvitation.email_sent_at,
      emailLastAttemptAt: pendingInvitation.email_last_attempt_at,
      emailSendStatus: pendingInvitation.email_send_status,
      emailLastError: pendingInvitation.email_last_error,
      nudgeEmailSentAt: pendingInvitation.nudge_email_sent_at,
      nudgeEmailSendStatus: pendingInvitation.nudge_email_send_status,
      nudgeEmailLastError: pendingInvitation.nudge_email_last_error,
      createdAt: pendingInvitation.updated_at,
    };
  },
});

// ============================================
// MUTATIONS
// ============================================

/**
 * Mark an invitation as viewed (when recipient opens the link).
 */
export const markAsViewed = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const invitation = await ctx.db
      .query("partner_invitations")
      .withIndex("by_token", (q) => q.eq("invitation_token", args.token))
      .first();

    if (invitation && !invitation.viewed_at) {
      await ctx.db.patch(invitation._id, {
        viewed_at: Date.now(),
        updated_at: Date.now(),
      });
    }
  },
});

export const create = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const sender = await ctx.db
      .query("users")
      .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
      .unique();

    if (!sender) throw new Error("User not found");

    assertNotSelfInvite(sender.email, args.email);

    // Derive partnership state from canonical records instead of trusting a possibly stale cached flag.
    const activeAsUser1 = await ctx.db
      .query("partnerships")
      .withIndex("by_user1", (q) => q.eq("user1_id", sender._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
    const activeAsUser2 = await ctx.db
      .query("partnerships")
      .withIndex("by_user2", (q) => q.eq("user2_id", sender._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();
    const hasActivePartnership = Boolean(activeAsUser1 || activeAsUser2);

    const pendingSentInvitation = await ctx.db
      .query("partner_invitations")
      .withIndex("by_sender", (q) =>
        q.eq("sender_id", sender._id).eq("status", "pending")
      )
      .first();
    const pendingReceivedInvitation = await ctx.db
      .query("partner_invitations")
      .withIndex("by_receiver_email", (q) => q.eq("receiver_email", sender.email))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();
    const hasPendingPartnership = Boolean(
      pendingSentInvitation || pendingReceivedInvitation
    );

    const derivedPartnershipStatus = hasActivePartnership
      ? "active"
      : hasPendingPartnership
        ? "pending"
        : "no_partner";

    // Self-heal stale status values to avoid permanently blocking users after schema/data changes.
    if (sender.partnership_status !== derivedPartnershipStatus) {
      await ctx.db.patch(sender._id, {
        partnership_status: derivedPartnershipStatus,
        updated_at: Date.now(),
      });
    }

    if (hasActivePartnership) {
      throw new Error("You already have an active partner.");
    }
    if (hasPendingPartnership) {
      if (
        pendingSentInvitation &&
        pendingSentInvitation.receiver_email.toLowerCase() === args.email.toLowerCase()
      ) {
        throw new Error("You have already invited this user.");
      }
      throw new Error(
        "You already have a pending partnership. Resolve the current invitation first."
      );
    }

    // Check if invitation already exists for this email
    const existing = await ctx.db
      .query("partner_invitations")
      .withIndex("by_receiver_email", (q) => q.eq("receiver_email", args.email))
      .filter((q) => q.eq(q.field("sender_id"), sender._id))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (existing) {
      throw new Error("You have already invited this user.");
    }

    // Generate token (simple random string for now, UUID would be better but this is fine)
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const now = Date.now();
    const invitationId = await ctx.db.insert("partner_invitations", {
      sender_id: sender._id,
      receiver_name: args.name,
      receiver_email: args.email,
      message: args.message,
      invitation_token: token,
      status: "pending",
      expires_at: now + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      email_last_attempt_at: now,
      email_send_status: "queued",
      updated_at: now,
    });

    // Update user status
    await ctx.db.patch(sender._id, {
      account_status: "AWAITING_PARTNERSHIP",
      partnership_status: "pending",
    });

    await ctx.scheduler.runAfter(
      0,
      (internal as any).invitations.sendEmail,
      { invitationId, emailType: "invite" }
    );

    return { invitationId, invitation_token: token, email_status: "queued" };
  },
});

export const withdraw = mutation({
  args: { invitationId: v.id("partner_invitations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) throw new Error("Invitation not found");

    if (invitation.sender_id !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.invitationId, {
      status: "revoked",
      updated_at: Date.now(),
    });

    // Revert user status
    await ctx.db.patch(user._id, {
      account_status: "AWAITING_ONBOARDING", // Or wherever they were? Assuming this for now.
      partnership_status: "no_partner",
    });
  },
});

export const nudge = mutation({
  args: { invitationId: v.id("partner_invitations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) throw new Error("Invitation not found");
    if (invitation.status !== "pending") {
      throw new Error("Only pending invitations can be nudged.");
    }

    const now = Date.now();
    await ctx.db.patch(args.invitationId, {
      last_nudged_at: now,
      nudge_email_send_status: "queued",
      nudge_email_last_error: undefined,
      updated_at: now,
    });

    await ctx.scheduler.runAfter(
      0,
      (internal as any).invitations.sendEmail,
      { invitationId: args.invitationId, emailType: "nudge" }
    );
  },
});

export const retryInviteEmail = mutation({
  args: { invitationId: v.id("partner_invitations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) throw new Error("Invitation not found");
    if (invitation.sender_id !== user._id) throw new Error("Unauthorized");
    if (invitation.status !== "pending") {
      throw new Error("Only pending invitations can retry email.");
    }
    if (invitation.email_send_status === "queued") {
      throw new Error("Invite email is already queued.");
    }

    const now = Date.now();
    const retryAfter =
      (invitation.email_last_attempt_at ?? 0) + INVITE_EMAIL_RETRY_COOLDOWN_MS;
    if (now < retryAfter) {
      const seconds = Math.ceil((retryAfter - now) / 1000);
      throw new Error(`Please wait ${seconds}s before retrying email.`);
    }

    await ctx.db.patch(args.invitationId, {
      email_last_attempt_at: now,
      email_send_status: "queued",
      email_last_error: undefined,
      updated_at: now,
    });

    await ctx.scheduler.runAfter(
      0,
      (internal as any).invitations.sendEmail,
      { invitationId: args.invitationId, emailType: "invite" }
    );
  },
});

/**
 * Accept an invitation by token.
 * This creates a partnership between the sender and the receiver.
 */
export const accept = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Get the current user (receiver)
    const receiver = await ctx.db
      .query("users")
      .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
      .unique();

    if (!receiver) throw new Error("User not found");

    // Check if user already has a partner
    if (receiver.partnership_status === "active") {
      throw new Error("You already have a partner.");
    }

    // Find the invitation by token
    const invitation = await ctx.db
      .query("partner_invitations")
      .withIndex("by_token", (q) => q.eq("invitation_token", args.token))
      .first();

    if (!invitation) throw new Error("Invitation not found or invalid.");
    if (invitation.status !== "pending") throw new Error("This invitation is no longer valid.");
    if (invitation.expires_at && invitation.expires_at < Date.now()) throw new Error("This invitation has expired.");
    assertInvitationReceiverMatch(receiver.email, invitation.receiver_email);

    // Get the sender
    const sender = await ctx.db.get(invitation.sender_id);
    if (!sender) throw new Error("Sender not found.");

    // Create the partnership
    const partnershipId = await ctx.db.insert("partnerships", {
      user1_id: sender._id,
      user2_id: receiver._id,
      user1_nickname: sender.full_name ?? undefined,
      user2_nickname: receiver.full_name ?? undefined,
      status: "active",
      start_date: Date.now(),
      updated_at: Date.now(),
    });

    // Update the invitation status
    await ctx.db.patch(invitation._id, {
      status: "accepted",
      receiver_id: receiver._id,
      accepted_at: Date.now(),
      updated_at: Date.now(),
    });

    // Update both users to be partners
    await ctx.db.patch(sender._id, {
      account_status: "ACTIVE",
      partnership_status: "active",
      current_partner_id: receiver._id,
      updated_at: Date.now(),
    });

    await ctx.db.patch(receiver._id, {
      account_status: "ACTIVE",
      partnership_status: "active",
      current_partner_id: sender._id,
      updated_at: Date.now(),
    });

    return partnershipId;
  },
});

// ============================================
// INTERNAL EMAIL HELPERS
// ============================================

export const getEmailPayload = internalQuery({
  args: {
    invitationId: v.id("partner_invitations"),
    emailType: v.union(v.literal("invite"), v.literal("nudge")),
  },
  handler: async (ctx, args) => {
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation) return null;

    const sender = await ctx.db.get(invitation.sender_id);
    if (!sender) return null;

    return {
      emailType: args.emailType,
      invitationId: invitation._id,
      receiverEmail: invitation.receiver_email,
      receiverName: invitation.receiver_name,
      senderName: sender.full_name ?? sender.email.split("@")[0] ?? "Your partner",
      invitationToken: invitation.invitation_token,
      customMessage: invitation.message,
      expiresAt: invitation.expires_at ?? null,
    };
  },
});

export const markEmailDelivery = internalMutation({
  args: {
    invitationId: v.id("partner_invitations"),
    emailType: v.union(v.literal("invite"), v.literal("nudge")),
    status: v.union(v.literal("sent"), v.literal("failed")),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    if (args.emailType === "invite") {
      await ctx.db.patch(args.invitationId, {
        email_send_status: args.status,
        email_sent_at: args.status === "sent" ? now : undefined,
        email_last_error: args.status === "failed" ? args.error : undefined,
        updated_at: now,
      });
      return;
    }

    await ctx.db.patch(args.invitationId, {
      nudge_email_send_status: args.status,
      nudge_email_sent_at: args.status === "sent" ? now : undefined,
      nudge_email_last_error: args.status === "failed" ? args.error : undefined,
      updated_at: now,
    });
  },
});

export const sendEmail = internalAction({
  args: {
    invitationId: v.id("partner_invitations"),
    emailType: v.union(v.literal("invite"), v.literal("nudge")),
  },
  handler: async (ctx, args) => {
    const payload = await ctx.runQuery(internal.invitations.getEmailPayload, args);
    if (!payload) {
      return { ok: false, error: "Invitation or sender not found." };
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      const missingKeyError = "RESEND_API_KEY is not configured.";
      await ctx.runMutation(internal.invitations.markEmailDelivery, {
        invitationId: args.invitationId,
        emailType: args.emailType,
        status: "failed",
        error: missingKeyError,
      });
      return { ok: false, error: missingKeyError };
    }

    const to = payload.receiverEmail;
    const acceptUrl = buildInviteUrl(payload.invitationToken);
    const expiresInDays = payload.expiresAt
      ? Math.max(1, Math.ceil((payload.expiresAt - Date.now()) / (24 * 60 * 60 * 1000)))
      : INVITATION_EXPIRY_DAYS;
    const from = process.env.RESEND_FROM_EMAIL || "DuoTrak <no-reply@duotrak.org>";
    const rendered =
      payload.emailType === "nudge"
        ? renderPartnerNudgeEmail({
            senderName: payload.senderName,
            receiverName: payload.receiverName,
            customMessage: payload.customMessage ?? undefined,
            acceptUrl,
            expiresInDays,
          })
        : renderPartnerInvitationEmail({
            senderName: payload.senderName,
            receiverName: payload.receiverName,
            customMessage: payload.customMessage ?? undefined,
            acceptUrl,
            expiresInDays,
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
          to,
          subject: rendered.subject,
          html: rendered.html,
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`Resend error ${response.status}: ${responseText}`);
      }

      await ctx.runMutation(internal.invitations.markEmailDelivery, {
        invitationId: args.invitationId,
        emailType: args.emailType,
        status: "sent",
      });
      return { ok: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown email delivery error.";
      await ctx.runMutation(internal.invitations.markEmailDelivery, {
        invitationId: args.invitationId,
        emailType: args.emailType,
        status: "failed",
        error: message,
      });
      return { ok: false, error: message };
    }
  },
});

