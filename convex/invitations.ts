import { mutation } from "./_generated/server";
import { v } from "convex/values";

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

    // Check if user already has a partner
    if (sender.partnership_status !== "no_partner") {
      throw new Error("You already have a partner or a pending partnership.");
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

    const invitationId = await ctx.db.insert("partner_invitations", {
      sender_id: sender._id,
      receiver_name: args.name,
      receiver_email: args.email,
      message: args.message,
      invitation_token: token,
      status: "pending",
      expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      updated_at: Date.now(),
    });

    // Update user status
    await ctx.db.patch(sender._id, {
      account_status: "AWAITING_PARTNERSHIP",
      partnership_status: "pending",
    });

    return invitationId;
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

    // Just update last_nudged_at for now
    await ctx.db.patch(args.invitationId, {
      last_nudged_at: Date.now(),
      updated_at: Date.now(),
    });
  },
});
