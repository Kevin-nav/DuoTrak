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
    last_streak_activity_day: v.optional(v.string()),
    last_activity_at: v.optional(v.number()),

    // Relationships
    current_partner_id: v.optional(v.id("users")), // Self-reference

    updated_at: v.number(), // Timestamp (ms)
  })
    .index("by_firebase_uid", ["firebase_uid"])
    .index("by_email", ["email"]),

  goals: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    motivation: v.optional(v.string()),
    category: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    is_habit: v.boolean(),
    goal_type: v.optional(v.union(v.literal("habit"), v.literal("target-date"), v.literal("milestone"))),
    end_date: v.optional(v.number()),
    template_source_id: v.optional(v.string()),
    template_source_slug: v.optional(v.string()),
    template_source_version: v.optional(v.number()),
    template_source_title: v.optional(v.string()),
    goal_archetype: v.optional(v.union(v.literal("savings"), v.literal("marathon"), v.literal("daily_habit"), v.literal("general"))),
    goal_profile_json: v.optional(v.string()),
    is_archived: v.boolean(),
    availability: v.optional(v.array(v.string())),
    time_commitment: v.optional(v.string()),
    accountability_type: v.optional(v.string()),
    user_id: v.id("users"),

    // ── Shared Goal Linking ──
    shared_goal_group_id: v.optional(v.string()),
    shared_goal_mode: v.optional(v.union(
      v.literal("independent"),
      v.literal("together"),
    )),
    shared_goal_creator_id: v.optional(v.id("users")),
    partnership_id: v.optional(v.id("partnerships")),

    // ── Structured Cadence ──
    cadence_json: v.optional(v.string()),

    // ── AI Plan Metadata ──
    ai_plan_json: v.optional(v.string()),
    planning_mode: v.optional(v.union(v.literal("ai"), v.literal("manual"))),

    updated_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_shared_group", ["shared_goal_group_id"]),

  goal_templates: defineTable({
    slug: v.string(),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    archetype: v.optional(v.union(v.literal("savings"), v.literal("marathon"), v.literal("daily_habit"), v.literal("general"))),
    goal_type: v.union(v.literal("habit"), v.literal("target-date"), v.literal("milestone")),
    default_accountability_type: v.union(v.literal("visual_proof"), v.literal("time_bound_action")),
    default_check_in_style: v.union(v.literal("quick_text"), v.literal("photo_recap"), v.literal("voice_note")),
    recommended_proof_mode: v.union(v.literal("photo"), v.literal("voice"), v.literal("time-window"), v.literal("hybrid")),
    motivation_suggestions: v.array(v.string()),
    profile_defaults_json: v.optional(v.string()),
    is_active: v.boolean(),
    is_published: v.boolean(),
    template_version: v.number(),
    sort_order: v.number(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_published_sort", ["is_published", "sort_order"])
    .index("by_category_published", ["category", "is_published"])
    .index("by_goal_type_published", ["goal_type", "is_published"]),

  goal_template_tasks: defineTable({
    template_id: v.id("goal_templates"),
    position: v.number(),
    name: v.string(),
    description: v.optional(v.string()),
    repeat_frequency: v.optional(v.string()),
    verification_mode: v.optional(v.string()),
    time_window_start: v.optional(v.string()),
    time_window_end: v.optional(v.string()),
    time_window_duration_minutes: v.optional(v.number()),
    requires_partner_review: v.boolean(),
    auto_approval_policy: v.optional(v.string()),
    auto_approval_timeout_hours: v.optional(v.number()),
    auto_approval_min_confidence: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_template_position", ["template_id", "position"]),

  tasks: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    status: v.string(), // 'pending', 'completed', etc.
    repeat_frequency: v.optional(v.string()),
    due_date: v.optional(v.number()),
    time_window: v.optional(v.string()),
    accountability_type: v.optional(v.string()),
    verification_mode: v.optional(v.string()),
    verification_mode_reason: v.optional(v.string()),
    verification_confidence: v.optional(v.number()),
    time_window_start: v.optional(v.string()),
    time_window_end: v.optional(v.string()),
    time_window_duration_minutes: v.optional(v.number()),
    requires_partner_review: v.optional(v.boolean()),
    auto_approval_policy: v.optional(v.string()),
    auto_approval_timeout_hours: v.optional(v.number()),
    auto_approval_min_confidence: v.optional(v.number()),
    verification_submitted_at: v.optional(v.number()),
    verification_evidence_confidence: v.optional(v.number()),
    verification_reviewed_at: v.optional(v.number()),
    verification_outcome: v.optional(v.string()),
    verification_reviewer_type: v.optional(v.string()),
    verification_rejection_reason: v.optional(v.string()),
    goal_id: v.id("goals"),

    // ── Recurring Task Blueprint ──
    is_template_task: v.optional(v.boolean()),
    template_task_id: v.optional(v.id("tasks")),
    instance_date: v.optional(v.number()),

    // ── Structured Cadence ──
    cadence_type: v.optional(v.union(
      v.literal("daily"), v.literal("weekly"), v.literal("custom"),
    )),
    cadence_days: v.optional(v.array(v.string())),
    cadence_duration_weeks: v.optional(v.number()),

    // ── Progressive Difficulty ──
    difficulty_level: v.optional(v.number()),
    minimum_viable_action: v.optional(v.string()),

    updated_at: v.number(),
  })
    .index("by_goal", ["goal_id"])
    .index("by_goal_date", ["goal_id", "instance_date"])
    .index("by_template", ["template_task_id"]),

  task_instances: defineTable({
    task_id: v.id("tasks"),
    goal_id: v.id("goals"),
    user_id: v.id("users"),
    instance_date: v.number(),
    status: v.string(), // pending | completed | missed | skipped
    completed_at: v.optional(v.number()),
    verification_submitted_at: v.optional(v.number()),
    verification_evidence_url: v.optional(v.string()),
    verification_outcome: v.optional(v.string()),
    verification_reviewer_type: v.optional(v.string()),
    verification_rejection_reason: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user_date", ["user_id", "instance_date"])
    .index("by_task_date", ["task_id", "instance_date"])
    .index("by_goal_date", ["goal_id", "instance_date"]),

  partnerships: defineTable({
    user1_id: v.id("users"),
    user2_id: v.id("users"),
    user1_nickname: v.optional(v.string()),
    user2_nickname: v.optional(v.string()),
    status: v.string(), // 'active', 'pending', etc.
    start_date: v.number(),
    end_date: v.optional(v.number()),
    shared_current_streak: v.optional(v.number()),
    shared_longest_streak: v.optional(v.number()),
    last_shared_cycle_key: v.optional(v.string()),
    last_shared_user1_day: v.optional(v.string()),
    last_shared_user2_day: v.optional(v.string()),
    user1_last_activity_day_local: v.optional(v.string()),
    user2_last_activity_day_local: v.optional(v.string()),
    user1_grace_last_used_at: v.optional(v.number()),
    user2_grace_last_used_at: v.optional(v.number()),
    user1_last_streak_nudge_day: v.optional(v.string()),
    user2_last_streak_nudge_day: v.optional(v.string()),
    last_shared_activity_at: v.optional(v.number()),

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

  llm_cost_events: defineTable({
    goal_id: v.optional(v.string()),
    user_id: v.optional(v.id("users")),
    provider: v.string(),
    model: v.string(),
    workflow_stage: v.optional(v.string()),
    request_id: v.optional(v.string()),
    input_tokens: v.number(),
    output_tokens: v.number(),
    latency_ms: v.number(),
    cost_usd: v.number(),
    success: v.boolean(),
    error_type: v.optional(v.string()),
    source: v.string(), // backend | convex
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_goal_created", ["goal_id", "created_at"])
    .index("by_user_created", ["user_id", "created_at"])
    .index("by_model_created", ["model", "created_at"]),

  // ============================================
  // JOURNAL + DUO WORKSPACE
  // ============================================
  journal_spaces: defineTable({
    type: v.string(), // 'shared' | 'private'
    name: v.string(),
    partnership_id: v.optional(v.id("partnerships")),
    owner_user_id: v.optional(v.id("users")),
    created_by: v.id("users"),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_owner_type", ["owner_user_id", "type"])
    .index("by_partnership_type", ["partnership_id", "type"]),

  journal_pages: defineTable({
    space_id: v.id("journal_spaces"),
    title: v.string(),
    icon: v.optional(v.string()),
    is_archived: v.boolean(),
    created_by: v.id("users"),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_space", ["space_id"])
    .index("by_space_updated", ["space_id", "updated_at"]),

  journal_blocks: defineTable({
    page_id: v.id("journal_pages"),
    type: v.string(), // 'paragraph' | 'heading' | 'todo' | 'toggle' | 'quote' | 'callout'
    content: v.optional(v.string()),
    checked: v.optional(v.boolean()),
    position: v.number(),
    meta_json: v.optional(v.string()),
    created_by: v.id("users"),
    updated_at: v.number(),
  })
    .index("by_page_position", ["page_id", "position"]),

  journal_entries: defineTable({
    space_id: v.id("journal_spaces"),
    title: v.string(),
    body: v.string(),
    mood: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    goal_id: v.optional(v.id("goals")),
    entry_date: v.number(),
    is_archived: v.boolean(),
    shared_from_entry_id: v.optional(v.id("journal_entries")),
    reaction_count: v.optional(v.number()),
    comment_count: v.optional(v.number()),
    last_interaction_at: v.optional(v.number()),
    created_by: v.id("users"),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_space_date", ["space_id", "entry_date"])
    .index("by_space_updated", ["space_id", "updated_at"])
    .index("by_creator", ["created_by", "created_at"]),

  journal_tasks: defineTable({
    space_id: v.id("journal_spaces"),
    page_id: v.optional(v.id("journal_pages")),
    title: v.string(),
    status: v.string(), // 'todo' | 'in_progress' | 'done'
    due_date: v.optional(v.number()),
    assignee_user_id: v.optional(v.id("users")),
    is_archived: v.boolean(),
    created_by: v.id("users"),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_space_due_date", ["space_id", "due_date"])
    .index("by_assignee_due_date", ["assignee_user_id", "due_date"])
    .index("by_page_updated", ["page_id", "updated_at"]),

  journal_shares: defineTable({
    source_entry_id: v.id("journal_entries"),
    shared_entry_id: v.id("journal_entries"),
    from_user_id: v.id("users"),
    to_partnership_id: v.id("partnerships"),
    shared_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_source_entry", ["source_entry_id"])
    .index("by_partnership", ["to_partnership_id", "shared_at"]),

  journal_interactions: defineTable({
    entry_id: v.id("journal_entries"),
    user_id: v.id("users"),
    type: v.string(), // 'reaction' | 'comment'
    reaction_key: v.optional(v.string()),
    comment_text: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_entry_created", ["entry_id", "created_at"])
    .index("by_entry_user_type", ["entry_id", "user_id", "type"]),

  journal_events: defineTable({
    event_type: v.string(),
    entry_id: v.optional(v.id("journal_entries")),
    actor_user_id: v.optional(v.id("users")),
    target_user_id: v.optional(v.id("users")),
    partnership_id: v.optional(v.id("partnerships")),
    metadata_json: v.optional(v.string()),
    created_at: v.number(),
  })
    .index("by_entry_created", ["entry_id", "created_at"])
    .index("by_target_created", ["target_user_id", "created_at"])
    .index("by_partnership_created", ["partnership_id", "created_at"]),

  journal_prompts: defineTable({
    text: v.string(),
    category: v.optional(v.string()), // 'relationship' | 'reflection' | 'fun' | 'goals'
    is_active: v.boolean(),
    created_at: v.number(),
  }),

  journal_active_prompts: defineTable({
    partnership_id: v.id("partnerships"),
    prompt_id: v.id("journal_prompts"),
    day_key: v.string(), // YYYY-MM-DD
    revealed_for_user1: v.boolean(),
    revealed_for_user2: v.boolean(),
    created_at: v.number(),
  })
    .index("by_partnership_day", ["partnership_id", "day_key"]),

  journal_search_index: defineTable({
    entity_type: v.string(), // 'entry' | 'page'
    entity_id: v.string(),
    space_id: v.id("journal_spaces"),
    searchable_text: v.string(),
    tags: v.optional(v.array(v.string())),
    author_id: v.id("users"),
    entry_date: v.optional(v.number()),
    updated_at: v.number(),
  })
    .index("by_space", ["space_id"])
    .index("by_author", ["author_id", "updated_at"])
    .index("by_space_date", ["space_id", "entry_date"]),

  // ============================================
  // NOTIFICATIONS + DELIVERY
  // ============================================
  notifications: defineTable({
    user_id: v.id("users"),
    type: v.string(),
    category: v.string(), // 'task' | 'partner' | 'progress' | 'system' | 'chat' | 'journal'
    title: v.string(),
    message: v.string(),
    priority: v.string(), // 'low' | 'medium' | 'high'
    actionable: v.boolean(),
    read_at: v.optional(v.number()),
    archived_at: v.optional(v.number()),
    snoozed_until: v.optional(v.number()),
    related_entity_type: v.optional(v.string()),
    related_entity_id: v.optional(v.string()),
    metadata_json: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user_created", ["user_id", "created_at"])
    .index("by_user_read", ["user_id", "read_at"])
    .index("by_user_archived", ["user_id", "archived_at"]),

  notification_preferences: defineTable({
    user_id: v.id("users"),
    in_app_enabled: v.boolean(),
    email_enabled: v.boolean(),
    quiet_hours_enabled: v.boolean(),
    quiet_hours_start: v.string(), // HH:mm
    quiet_hours_end: v.string(), // HH:mm
    task_notifications: v.boolean(),
    partner_notifications: v.boolean(),
    chat_notifications: v.boolean(),
    journal_notifications: v.boolean(),
    progress_notifications: v.boolean(),
    system_notifications: v.boolean(),
    sound_enabled: v.optional(v.boolean()),
    created_at: v.number(),
    updated_at: v.number(),
  }).index("by_user", ["user_id"]),

  notification_deliveries: defineTable({
    notification_id: v.optional(v.id("notifications")),
    user_id: v.id("users"),
    channel: v.string(), // 'in_app' | 'email'
    status: v.string(), // 'queued' | 'sent' | 'failed' | 'skipped'
    provider: v.optional(v.string()),
    template_key: v.optional(v.string()),
    error_message: v.optional(v.string()),
    sent_at: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user_created", ["user_id", "created_at"])
    .index("by_notification", ["notification_id"]),

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

  chat_active_views: defineTable({
    conversation_id: v.id("conversations"),
    user_id: v.id("users"),
    is_active: v.boolean(),
    updated_at: v.number(),
  })
    .index("by_user", ["user_id", "updated_at"])
    .index("by_conversation_user", ["conversation_id", "user_id"]),

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
