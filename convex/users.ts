import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Ensures the current user is stored in the database.
 * Designed to be called by the frontend immediately after authentication.
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

    // Check if user already exists by firebase_uid
    const user = await ctx.db
      .query("users")
      .withIndex("by_firebase_uid", (q) => q.eq("firebase_uid", firebaseUid))
      .unique();

    if (user !== null) {
      // User exists, update if email changed or last login time (if tracked)
      if (user.email !== args.email) {
        await ctx.db.patch(user._id, { email: args.email });
      }
      return user._id;
    }

    // New user
    const newUserId = await ctx.db.insert("users", {
      firebase_uid: firebaseUid,
      email: args.email,
      full_name: identity.name, // Use name from auth provider if available
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
 * Gets the current user's profile.
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

    return user;
  },
});

/**
 * Updates the current user's profile.
 */
export const update = mutation({
  args: {
    full_name: v.optional(v.string()),
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
 * Publicly check status by email (used for invitations).
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
