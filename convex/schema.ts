import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    firebase_uid: v.string(), // Keeping for Auth integration
    email: v.string(),
    full_name: v.optional(v.string()),
    nickname: v.optional(v.string()),
    account_status: v.string(), // Union: 'AWAITING_ONBOARDING' | 'AWAITING_PARTNERSHIP' | ...
    partnership_status: v.string(), // Union: 'active' | 'pending' | 'no_partner'

    // Profile
    bio: v.optional(v.string()),
    profile_picture_url: v.optional(v.string()),
    profile_picture_variants: v.optional(v.object({
      original: v.string(),
      xl: v.string(),
      lg: v.string(),
      md: v.string(),
      sm: v.string(),
    })),
    profile_picture_storage_id: v.optional(v.union(v.id("_storage"), v.null())),
    profile_picture_version: v.optional(v.number()), // Cache busting version
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
    description: v.optional(v.string()), // Added description
    motivation: v.optional(v.string()), // Added motivation
    category: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    is_habit: v.boolean(),
    is_archived: v.boolean(),
    availability: v.optional(v.array(v.string())), // Added availability
    time_commitment: v.optional(v.string()), // Added time_commitment
    accountability_type: v.optional(v.string()), // Added accountability_type
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
    time_window: v.optional(v.string()), // Added time_window
    accountability_type: v.optional(v.string()), // Added accountability_type override
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
    viewed_at: v.optional(v.number()), // When the invitation link was first opened
    email_sent_at: v.optional(v.number()),
    email_last_attempt_at: v.optional(v.number()),
    email_send_status: v.optional(v.string()), // queued | sent | failed
    email_last_error: v.optional(v.string()),
    nudge_email_sent_at: v.optional(v.number()),
    nudge_email_send_status: v.optional(v.string()), // queued | sent | failed
    nudge_email_last_error: v.optional(v.string()),

    updated_at: v.number(),
  })
    .index("by_token", ["invitation_token"])
    .index("by_receiver_email", ["receiver_email"])
    .index("by_sender", ["sender_id", "status"]),

  // ============================================
  // CHAT SYSTEM - Real-time messaging
  // ============================================

  user_presence: defineTable({
    user_id: v.id("users"),
    last_heartbeat_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_last_heartbeat", ["last_heartbeat_at"]),

  chat_typing: defineTable({
    conversation_id: v.id("conversations"),
    user_id: v.id("users"),
    is_typing: v.boolean(),
    updated_at: v.number(),
  })
    .index("by_conversation_user", ["conversation_id", "user_id"])
    .index("by_conversation_updated", ["conversation_id", "updated_at"]),

  conversations: defineTable({
    partnership_id: v.id("partnerships"),

    // Denormalized for quick list view
    last_message_text: v.optional(v.string()),
    last_message_at: v.optional(v.number()),
    last_message_sender_id: v.optional(v.id("users")),

    // Unread tracking per user
    user1_unread_count: v.number(),
    user2_unread_count: v.number(),
    user1_last_read_at: v.optional(v.number()),
    user2_last_read_at: v.optional(v.number()),

    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_partnership", ["partnership_id"])
    .index("by_last_message", ["last_message_at"]),

  messages: defineTable({
    conversation_id: v.id("conversations"),
    sender_id: v.id("users"),

    // Message content
    content: v.string(),
    message_type: v.string(), // 'text' | 'image' | 'file' | 'nudge' | 'voice' | 'sticker'

    // Attachments stored in R2
    attachments: v.optional(v.array(v.object({
      type: v.string(), // 'image' | 'video' | 'document' | 'voice'
      url: v.string(),
      name: v.optional(v.string()),
      size: v.optional(v.number()),
      thumbnail_url: v.optional(v.string()),
      duration: v.optional(v.number()), // For voice messages in seconds
      mime_type: v.optional(v.string()),
    }))),

    // Reply context (denormalized for quick display)
    reply_to_id: v.optional(v.id("messages")),
    reply_preview: v.optional(v.object({
      sender_id: v.id("users"),
      sender_name: v.string(),
      content: v.string(),
      message_type: v.string(),
    })),

    // Delivery & read status
    status: v.string(), // 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
    delivered_at: v.optional(v.number()),
    read_at: v.optional(v.number()),

    // Reactions (inline for quick access, max ~10 per message)
    reactions: v.optional(v.array(v.object({
      user_id: v.id("users"),
      emoji: v.string(),
      created_at: v.number(),
    }))),

    // Soft delete
    is_deleted: v.optional(v.boolean()),
    deleted_at: v.optional(v.number()),

    // Nudge-specific
    is_nudge: v.optional(v.boolean()),

    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_conversation", ["conversation_id", "created_at"])
    .index("by_conversation_recent", ["conversation_id", "is_deleted", "created_at"])
    .index("by_sender", ["sender_id", "created_at"]),
});
