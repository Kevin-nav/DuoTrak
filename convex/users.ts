import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Ensures the current user is stored in the database.
 */
export const store = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called storeUser without authentication present");
    }

    const firebaseUid = identity.subject;

    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", firebaseUid))
      .unique();

    if (user !== null) {
      if (user.email !== args.email) {
        await ctx.db.patch(user._id, { email: args.email });
      }
      return user._id;
    }

    const newUserId = await ctx.db.insert("users", {
      firebase_uid: firebaseUid,
      email: args.email,
      full_name: identity.name,
      account_status: "AWAITING_ONBOARDING",
      partnership_status: "no_partner",
      timezone: "UTC",
      notifications_enabled: true,
      notification_time: "morning",
      theme: "system",
      privacy_setting: "partner-only",
      current_streak: 0,
      longest_streak: 0,
      total_tasks_completed: 0,
      goals_conquered: 0,
      updated_at: Date.now(),
    });

    return newUserId;
  },
});

/**
 * Gets the current user's profile with partnership details.
 */
export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
      .unique();

    if (!user) return null;

    let partnerDetails = {
      partner_id: null as any,
      partnership_id: null as any,
      partner_full_name: null as string | null,
      partner_nickname: null as string | null,
      sent_invitation: null as any,
      received_invitation: null as any,
      badges: [] as any[], // Placeholder for now
    };

    // 1. Fetch Partner Details if exists
    if (user.current_partner_id) {
      const partner = await ctx.db.get(user.current_partner_id);
      if (partner) {
        partnerDetails.partner_id = partner._id;
        partnerDetails.partner_full_name = partner.full_name || null;

        // Find active partnership to get ID and nicknames
        // We need an index for this ideally, or search by user1/user2
        // For now, doing a linear scan might be slow if many partnerships, but we have index by_user1/user2
        const p1 = await ctx.db
          .query("partnerships")
          .withIndex("by_user1", (q) => q.eq("user1_id", user._id))
          .filter((q) => q.eq(q.field("status"), "active"))
          .first();

        const p2 = await ctx.db
          .query("partnerships")
          .withIndex("by_user2", (q) => q.eq("user2_id", user._id))
          .filter((q) => q.eq(q.field("status"), "active"))
          .first();

        const partnership = p1 || p2;

        if (partnership) {
          partnerDetails.partnership_id = partnership._id;
          partnerDetails.partner_nickname =
            (partnership.user1_id === user._id ? partnership.user2_nickname : partnership.user1_nickname) ?? null;
        }
      }
    }

    // 2. Fetch Pending Invitations (Sent)
    // Assuming we want the most recent pending one
    const sentInvite = await ctx.db
      .query("partner_invitations")
      .withIndex("by_token") // We don't have by_sender index in schema yet! using filter
      .filter((q) => q.eq(q.field("sender_id"), user._id))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first(); // Just get one for now

    // 3. Fetch Pending Invitations (Received)
    const receivedInvite = await ctx.db
      .query("partner_invitations")
      .withIndex("by_receiver_email", (q) => q.eq("receiver_email", user.email))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    return {
      id: user._id,
      ...user,
      ...partnerDetails,
      sent_invitation: sentInvite,
      received_invitation: receivedInvite,
    };
  },
});

/**
 * Updates the current user's profile.
 */
export const update = mutation({
  args: {
    full_name: v.optional(v.string()),
    nickname: v.optional(v.string()),
    bio: v.optional(v.string()),
    timezone: v.optional(v.string()),
    theme: v.optional(v.string()),
    notifications_enabled: v.optional(v.boolean()),
    // Add other fields as necessary
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated call to updateUser");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", identity.subject))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      ...args,
      updated_at: Date.now(),
    });
  },
});

/**
 * Publicly check status by email.
 */
export const checkStatusByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) {
      return { user_exists: false, partnership_status: null };
    }

    return {
      user_exists: true,
      partnership_status: user.partnership_status,
    };
  },
});
