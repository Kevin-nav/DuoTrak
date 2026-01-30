import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    firebase_uid: v.string(), // Keeping for Auth integration
    email: v.string(),
    full_name: v.optional(v.string()),
    account_status: v.string(), // Union: 'AWAITING_ONBOARDING' | 'AWAITING_PARTNERSHIP' | ...
    partnership_status: v.string(), // Union: 'active' | 'pending' | 'no_partner'
    
    // Profile
    bio: v.optional(v.string()),
    profile_picture_url: v.optional(v.string()),
    timezone: v.string(),
    notifications_enabled: v.boolean(),
    notification_time: v.string(),
    theme: v.string(),
    privacy_setting: v.string(),
    
    // Stats
    current_streak: v.number(),
    longest_streak: v.number(),
    total_tasks_completed: v.number(),
    goals_conquered: v.number(),

    // Relationships
    current_partner_id: v.optional(v.id("users")), // Self-reference
    
    updated_at: v.number(), // Timestamp (ms)
  })
  .index("by_firebase_uid", ["firebase_uid"])
  .index("by_email", ["email"]),

  goals: defineTable({
    name: v.string(),
    category: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    is_habit: v.boolean(),
    is_archived: v.boolean(),
    user_id: v.id("users"),
    
    updated_at: v.number(),
  })
  .index("by_user", ["user_id"]),

  tasks: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    status: v.string(), // 'pending', 'completed', etc.
    repeat_frequency: v.optional(v.string()),
    due_date: v.optional(v.number()), // Timestamp
    goal_id: v.id("goals"),
    
    updated_at: v.number(),
  })
  .index("by_goal", ["goal_id"]),

  partnerships: defineTable({
    user1_id: v.id("users"),
    user2_id: v.id("users"),
    user1_nickname: v.optional(v.string()),
    user2_nickname: v.optional(v.string()),
    status: v.string(), // 'active', 'pending', etc.
    start_date: v.number(),
    end_date: v.optional(v.number()),
    
    updated_at: v.number(),
  })
  .index("by_user1", ["user1_id"])
  .index("by_user2", ["user2_id"])
  .index("by_status", ["status"]),

  partner_invitations: defineTable({
    sender_id: v.id("users"),
    receiver_id: v.optional(v.id("users")),
    receiver_name: v.string(),
    receiver_email: v.string(),
    message: v.optional(v.string()),
    invitation_token: v.string(), // Keep UUID or generate random string
    status: v.string(), // 'pending', 'accepted', etc.
    expires_at: v.optional(v.number()),
    accepted_at: v.optional(v.number()),
    last_nudged_at: v.optional(v.number()),
    
    updated_at: v.number(),
  })
  .index("by_token", ["invitation_token"])
  .index("by_receiver_email", ["receiver_email"]),
});
