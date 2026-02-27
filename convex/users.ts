import { action, internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { uploadToR2, deletePrefixFromR2, getProfilePictureKey } from "./lib/r2";

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
      partner_profile_picture_url: null as string | null,
      partner_email: null as string | null,
      partner_bio: null as string | null,
      partner_timezone: null as string | null,
      partner_current_streak: null as number | null,
      partner_longest_streak: null as number | null,
      partner_total_tasks_completed: null as number | null,
      partner_goals_conquered: null as number | null,
      shared_current_streak: 0 as number,
      shared_longest_streak: 0 as number,
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
        partnerDetails.partner_email = partner.email || null;
        partnerDetails.partner_bio = partner.bio || null;
        partnerDetails.partner_timezone = partner.timezone || null;
        partnerDetails.partner_current_streak = partner.current_streak ?? null;
        partnerDetails.partner_longest_streak = partner.longest_streak ?? null;
        partnerDetails.partner_total_tasks_completed = partner.total_tasks_completed ?? null;
        partnerDetails.partner_goals_conquered = partner.goals_conquered ?? null;
        const partnerVariants = partner.profile_picture_variants;
        partnerDetails.partner_profile_picture_url =
          partnerVariants?.md || partnerVariants?.sm || partner.profile_picture_url || null;

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
          partnerDetails.shared_current_streak = partnership.shared_current_streak ?? 0;
          partnerDetails.shared_longest_streak = partnership.shared_longest_streak ?? 0;
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

    let profilePictureUrl = user.profile_picture_url || user.profile_picture_variants?.md;
    if (user.profile_picture_storage_id) {
      const url = await ctx.storage.getUrl(user.profile_picture_storage_id);
      if (url) {
        profilePictureUrl = url;
      }
    }

    return {
      id: user._id,
      ...user,
      ...partnerDetails,
      profile_picture_url: profilePictureUrl,
      sent_invitation: sentInvite,
      received_invitation: receivedInvite,
    };
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated call to generateUploadUrl");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Updates the current user's profile.
 */
export const update = mutation({
  args: {
    email: v.optional(v.string()),
    full_name: v.optional(v.string()),
    nickname: v.optional(v.string()),
    bio: v.optional(v.string()),
    timezone: v.optional(v.string()),
    theme: v.optional(v.string()),
    notifications_enabled: v.optional(v.boolean()),
    notification_time: v.optional(v.string()),
    privacy_setting: v.optional(v.string()),
    profile_picture_url: v.optional(v.string()),
    profile_picture_variants: v.optional(v.object({
      original: v.string(),
      xl: v.string(),
      lg: v.string(),
      md: v.string(),
      sm: v.string(),
    })),
    profile_picture_storage_id: v.optional(v.union(v.id("_storage"), v.null())),
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

// ============================================
// PROFILE PICTURE MANAGEMENT
// ============================================

/**
 * Internal mutation to update profile picture URL.
 * Called by the uploadProfilePicture action after R2 upload.
 */
export const updateProfilePictureData = internalMutation({
  args: {
    firebaseUid: v.string(),
    profilePictureUrl: v.string(),
    profilePictureVariants: v.object({
      original: v.string(),
      xl: v.string(),
      lg: v.string(),
      md: v.string(),
      sm: v.string(),
    }),
    profilePictureVersion: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", args.firebaseUid))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      profile_picture_url: args.profilePictureUrl,
      profile_picture_variants: args.profilePictureVariants,
      profile_picture_version: args.profilePictureVersion,
      profile_picture_storage_id: null, // Clear legacy storage reference
      updated_at: Date.now(),
    });

    return { success: true, url: args.profilePictureUrl };
  },
});

/**
 * Internal mutation to clear profile picture URL.
 */
export const clearProfilePictureUrl = internalMutation({
  args: {
    firebaseUid: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", args.firebaseUid))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(user._id, {
      profile_picture_url: undefined,
      profile_picture_variants: undefined,
      profile_picture_version: undefined,
      profile_picture_storage_id: null,
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Upload a profile picture to R2 storage.
 * Accepts base64-encoded image data (already processed on client).
 */
export const uploadProfilePicture = action({
  args: {
    variants: v.object({
      original: v.string(),
      xl: v.string(),
      lg: v.string(),
      md: v.string(),
      sm: v.string(),
    }),
    contentType: v.optional(v.string()),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; url: string; variants: Record<string, string> }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const firebaseUid = identity.subject;
    const version = Date.now();
    const contentType = args.contentType || "image/webp";

    // Best-effort cleanup to avoid orphaned variants.
    await deletePrefixFromR2(`profiles/${firebaseUid}/`).catch((error) => {
      console.warn("Failed to cleanup old profile pictures before upload:", error);
    });

    const sizes = ["original", "xl", "lg", "md", "sm"] as const;
    const uploaded: Record<string, string> = {};
    for (const size of sizes) {
      const key = getProfilePictureKey(firebaseUid, size, version);
      const buffer = Buffer.from(args.variants[size], "base64");
      uploaded[size] = await uploadToR2(key, buffer, contentType);
    }
    const preferredUrl = uploaded.md || uploaded.lg || uploaded.original;

    // Update the URL in Convex database
    await ctx.runMutation(internal.users.updateProfilePictureData, {
      firebaseUid,
      profilePictureUrl: preferredUrl,
      profilePictureVariants: {
        original: uploaded.original,
        xl: uploaded.xl,
        lg: uploaded.lg,
        md: uploaded.md,
        sm: uploaded.sm,
      },
      profilePictureVersion: version,
    });

    return { success: true, url: preferredUrl, variants: uploaded };
  },
});

/**
 * Delete the current profile picture from R2 storage.
 */
export const deleteProfilePicture = action({
  args: {},
  handler: async (ctx): Promise<{ success: boolean }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated");
    }

    const firebaseUid = identity.subject;

    try {
      await deletePrefixFromR2(`profiles/${firebaseUid}/`);

      await ctx.runMutation(internal.users.clearProfilePictureUrl, {
        firebaseUid,
      });
    } catch (error) {
      console.error("Failed to delete profile picture:", error);
      throw new Error("Failed to delete profile picture");
    }

    return { success: true };
  },
});

