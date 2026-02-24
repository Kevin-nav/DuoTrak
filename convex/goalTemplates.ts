import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

type TemplateTaskSeed = {
  name: string;
  description?: string;
  repeat_frequency?: string;
  verification_mode?: "photo" | "voice" | "time-window" | "hybrid";
  time_window_start?: string;
  time_window_end?: string;
  time_window_duration_minutes?: number;
  requires_partner_review: boolean;
  auto_approval_policy?: string;
  auto_approval_timeout_hours?: number;
  auto_approval_min_confidence?: number;
};

type TemplateSeed = {
  slug: string;
  title: string;
  description: string;
  category: string;
  archetype: "savings" | "marathon" | "daily_habit" | "general";
  goal_type: "habit" | "target-date" | "milestone";
  default_accountability_type: "visual_proof" | "time_bound_action";
  default_check_in_style: "quick_text" | "photo_recap" | "voice_note";
  recommended_proof_mode: "photo" | "voice" | "time-window" | "hybrid";
  motivation_suggestions: string[];
  profile_defaults_json?: string;
  sort_order: number;
  tasks: TemplateTaskSeed[];
};

type TemplateArchetype = "savings" | "marathon" | "daily_habit" | "general";

function inferArchetype(template: { slug?: string; category?: string }): TemplateArchetype {
  const slug = (template.slug || "").toLowerCase();
  const category = (template.category || "").toLowerCase();

  if (slug.includes("save") || category === "finance") return "savings";
  if (slug.includes("marathon") || category === "fitness") return "marathon";
  if (slug.includes("wake") || slug.includes("daily") || category === "habit") return "daily_habit";
  return "general";
}

const DEFAULT_TEMPLATE_SEEDS: TemplateSeed[] = [
  {
    slug: "wake-7am-consistency",
    title: "Wake Up at 7:00 AM",
    description: "Build a strict morning habit with a 10-minute check-in window and partner review.",
    category: "health",
    archetype: "daily_habit",
    goal_type: "habit",
    default_accountability_type: "time_bound_action",
    default_check_in_style: "quick_text",
    recommended_proof_mode: "time-window",
    motivation_suggestions: ["Build discipline", "Improve sleep rhythm", "Start days with momentum"],
    profile_defaults_json: JSON.stringify({
      targetStreak: 30,
      currentStreak: 0,
      dailyTarget: 1,
    }),
    sort_order: 10,
    tasks: [
      {
        name: "Morning check-in",
        description: "Mark complete within the wake window.",
        repeat_frequency: "daily",
        verification_mode: "time-window",
        time_window_start: "07:00",
        time_window_duration_minutes: 10,
        requires_partner_review: true,
        auto_approval_policy: "time_window_only",
        auto_approval_timeout_hours: 24,
        auto_approval_min_confidence: 0.85,
      },
      {
        name: "Upload wake proof",
        description: "Optional morning selfie or room-light photo for higher confidence streaks.",
        repeat_frequency: "daily",
        verification_mode: "photo",
        requires_partner_review: true,
      },
      {
        name: "Weekly reflection",
        description: "Review misses and adjust bedtime triggers with your partner.",
        repeat_frequency: "weekly",
        verification_mode: "voice",
        requires_partner_review: true,
      },
    ],
  },
  {
    slug: "daily-reading-20",
    title: "Read 20 Minutes Daily",
    description: "Use a sustainable reading rhythm with lightweight partner accountability.",
    category: "learning",
    archetype: "daily_habit",
    goal_type: "habit",
    default_accountability_type: "visual_proof",
    default_check_in_style: "quick_text",
    recommended_proof_mode: "photo",
    motivation_suggestions: ["Learn continuously", "Sharpen focus", "Build consistency"],
    profile_defaults_json: JSON.stringify({
      targetStreak: 21,
      currentStreak: 0,
      dailyTarget: 1,
    }),
    sort_order: 20,
    tasks: [
      {
        name: "Daily reading block",
        description: "Read for at least 20 minutes.",
        repeat_frequency: "daily",
        verification_mode: "photo",
        requires_partner_review: true,
      },
      {
        name: "One-line takeaway",
        description: "Post one sentence summary after each session.",
        repeat_frequency: "daily",
        verification_mode: "voice",
        requires_partner_review: true,
      },
      {
        name: "Weekly chapter checkpoint",
        description: "Confirm weekly chapter target is complete.",
        repeat_frequency: "weekly",
        verification_mode: "photo",
        requires_partner_review: true,
      },
    ],
  },
  {
    slug: "course-8-weeks",
    title: "Finish an Online Course in 8 Weeks",
    description: "Target-date learning plan with milestone-based accountability.",
    category: "learning",
    archetype: "general",
    goal_type: "target-date",
    default_accountability_type: "visual_proof",
    default_check_in_style: "voice_note",
    recommended_proof_mode: "hybrid",
    motivation_suggestions: ["Career growth", "Skill confidence", "Structured execution"],
    sort_order: 30,
    tasks: [
      {
        name: "Complete module sessions",
        description: "Finish the planned module sessions for the week.",
        repeat_frequency: "3x weekly",
        verification_mode: "photo",
        requires_partner_review: true,
      },
      {
        name: "Voice recap after study block",
        description: "Record 30-60 seconds: what you learned and next step.",
        repeat_frequency: "3x weekly",
        verification_mode: "voice",
        requires_partner_review: true,
      },
      {
        name: "Weekly milestone verification",
        description: "Submit completion evidence for weekly milestone.",
        repeat_frequency: "weekly",
        verification_mode: "photo",
        requires_partner_review: true,
      },
    ],
  },
  {
    slug: "save-1000-milestones",
    title: "Save $1,000",
    description: "Milestone-based savings goal with receipts and partner check-ins.",
    category: "finance",
    archetype: "savings",
    goal_type: "milestone",
    default_accountability_type: "visual_proof",
    default_check_in_style: "quick_text",
    recommended_proof_mode: "photo",
    motivation_suggestions: ["Financial stability", "Reduce money stress", "Build better money habits"],
    profile_defaults_json: JSON.stringify({
      currency: "USD",
      targetAmount: 1000,
      currentAmount: 0,
      weeklyContribution: 50,
    }),
    sort_order: 40,
    tasks: [
      {
        name: "Weekly transfer",
        description: "Transfer your planned savings amount.",
        repeat_frequency: "weekly",
        verification_mode: "photo",
        requires_partner_review: true,
      },
      {
        name: "Receipt upload",
        description: "Upload screenshot or receipt as proof.",
        repeat_frequency: "weekly",
        verification_mode: "photo",
        requires_partner_review: true,
      },
      {
        name: "Monthly savings review",
        description: "Review progress and rebalance target.",
        repeat_frequency: "monthly",
        verification_mode: "voice",
        requires_partner_review: true,
      },
    ],
  },
  {
    slug: "marathon-16-week",
    title: "Train for a Marathon (16 Weeks)",
    description: "Structured endurance training with weekly mileage and long-run progression.",
    category: "fitness",
    archetype: "marathon",
    goal_type: "target-date",
    default_accountability_type: "visual_proof",
    default_check_in_style: "photo_recap",
    recommended_proof_mode: "hybrid",
    motivation_suggestions: ["Build endurance", "Finish strong", "Stay accountable weekly"],
    profile_defaults_json: JSON.stringify({
      targetDistanceKm: 42.2,
      currentLongRunKm: 8,
      targetLongRunKm: 32,
      totalWeeks: 16,
      completedWeeks: 0,
    }),
    sort_order: 50,
    tasks: [
      {
        name: "Easy run sessions",
        description: "Complete scheduled easy runs for aerobic base.",
        repeat_frequency: "3x weekly",
        verification_mode: "photo",
        requires_partner_review: true,
      },
      {
        name: "Weekly long run",
        description: "Hit your planned long-run distance for the week.",
        repeat_frequency: "weekly",
        verification_mode: "time-window",
        requires_partner_review: true,
      },
      {
        name: "Recovery and mobility",
        description: "Log recovery and mobility session.",
        repeat_frequency: "2x weekly",
        verification_mode: "voice",
        requires_partner_review: true,
      },
    ],
  },
];

async function getCurrentUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");

  const user = await ctx.db
    .query("users")
    .withIndex("by_firebase_uid", (q: any) => q.eq("firebase_uid", identity.subject))
    .unique();
  if (!user) throw new Error("User not found");
  return user;
}

export const listPublished = query({
  args: {
    search: v.optional(v.string()),
    category: v.optional(v.string()),
    goal_type: v.optional(v.union(v.literal("habit"), v.literal("target-date"), v.literal("milestone"))),
    proof_mode: v.optional(v.union(v.literal("photo"), v.literal("voice"), v.literal("time-window"), v.literal("hybrid"))),
  },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);

    const templates = await ctx.db
      .query("goal_templates")
      .withIndex("by_published_sort", (q) => q.eq("is_published", true))
      .collect();

    const search = args.search?.trim().toLowerCase() || "";
    const filtered = templates.filter((template) => {
      if (!template.is_active) return false;
      if (args.category && template.category !== args.category) return false;
      if (args.goal_type && template.goal_type !== args.goal_type) return false;
      if (args.proof_mode && template.recommended_proof_mode !== args.proof_mode) return false;
      if (!search) return true;
      return (
        template.title.toLowerCase().includes(search) ||
        template.description.toLowerCase().includes(search) ||
        template.category.toLowerCase().includes(search)
      );
    });

    const templateIds = filtered.map((template) => template._id);
    const taskMap = new Map<string, any[]>();
    await Promise.all(
      templateIds.map(async (templateId) => {
        const tasks = await ctx.db
          .query("goal_template_tasks")
          .withIndex("by_template_position", (q) => q.eq("template_id", templateId))
          .collect();
        taskMap.set(String(templateId), tasks);
      }),
    );

    return filtered.map((template) => ({
      ...template,
      archetype: template.archetype || inferArchetype(template),
      tasks: taskMap.get(String(template._id)) || [],
    }));
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    const template = await ctx.db
      .query("goal_templates")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (!template || !template.is_active || !template.is_published) return null;

    const tasks = await ctx.db
      .query("goal_template_tasks")
      .withIndex("by_template_position", (q) => q.eq("template_id", template._id))
      .collect();

    return {
      ...template,
      archetype: template.archetype || inferArchetype(template),
      tasks,
    };
  },
});

export const createTemplate = mutation({
  args: {
    slug: v.string(),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    archetype: v.union(v.literal("savings"), v.literal("marathon"), v.literal("daily_habit"), v.literal("general")),
    goal_type: v.union(v.literal("habit"), v.literal("target-date"), v.literal("milestone")),
    default_accountability_type: v.union(v.literal("visual_proof"), v.literal("time_bound_action")),
    default_check_in_style: v.union(v.literal("quick_text"), v.literal("photo_recap"), v.literal("voice_note")),
    recommended_proof_mode: v.union(v.literal("photo"), v.literal("voice"), v.literal("time-window"), v.literal("hybrid")),
    motivation_suggestions: v.array(v.string()),
    profile_defaults_json: v.optional(v.string()),
    sort_order: v.number(),
    is_published: v.optional(v.boolean()),
    tasks: v.array(
      v.object({
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
      }),
    ),
  },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    const now = Date.now();
    const existing = await ctx.db
      .query("goal_templates")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
    if (existing) throw new Error("Template slug already exists");

    const templateId = await ctx.db.insert("goal_templates", {
      slug: args.slug,
      title: args.title,
      description: args.description,
      category: args.category,
      archetype: args.archetype,
      goal_type: args.goal_type,
      default_accountability_type: args.default_accountability_type,
      default_check_in_style: args.default_check_in_style,
      recommended_proof_mode: args.recommended_proof_mode,
      motivation_suggestions: args.motivation_suggestions,
      profile_defaults_json: args.profile_defaults_json,
      is_active: true,
      is_published: args.is_published ?? true,
      template_version: 1,
      sort_order: args.sort_order,
      created_at: now,
      updated_at: now,
    });

    for (const task of args.tasks) {
      await ctx.db.insert("goal_template_tasks", {
        template_id: templateId,
        position: task.position,
        name: task.name,
        description: task.description,
        repeat_frequency: task.repeat_frequency,
        verification_mode: task.verification_mode,
        time_window_start: task.time_window_start,
        time_window_end: task.time_window_end,
        time_window_duration_minutes: task.time_window_duration_minutes,
        requires_partner_review: task.requires_partner_review,
        auto_approval_policy: task.auto_approval_policy,
        auto_approval_timeout_hours: task.auto_approval_timeout_hours,
        auto_approval_min_confidence: task.auto_approval_min_confidence,
        created_at: now,
        updated_at: now,
      });
    }

    return templateId;
  },
});

export const updateTemplate = mutation({
  args: {
    id: v.id("goal_templates"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    archetype: v.optional(v.union(v.literal("savings"), v.literal("marathon"), v.literal("daily_habit"), v.literal("general"))),
    goal_type: v.optional(v.union(v.literal("habit"), v.literal("target-date"), v.literal("milestone"))),
    default_accountability_type: v.optional(v.union(v.literal("visual_proof"), v.literal("time_bound_action"))),
    default_check_in_style: v.optional(v.union(v.literal("quick_text"), v.literal("photo_recap"), v.literal("voice_note"))),
    recommended_proof_mode: v.optional(v.union(v.literal("photo"), v.literal("voice"), v.literal("time-window"), v.literal("hybrid"))),
    motivation_suggestions: v.optional(v.array(v.string())),
    profile_defaults_json: v.optional(v.string()),
    is_active: v.optional(v.boolean()),
    is_published: v.optional(v.boolean()),
    sort_order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    const template = await ctx.db.get(args.id);
    if (!template) throw new Error("Template not found");

    const { id, ...patch } = args;
    await ctx.db.patch(id, {
      ...patch,
      template_version: template.template_version + 1,
      updated_at: Date.now(),
    });
  },
});

async function upsertSeedTemplate(ctx: any, template: TemplateSeed) {
  const now = Date.now();
  const existing = await ctx.db
    .query("goal_templates")
    .withIndex("by_slug", (q: any) => q.eq("slug", template.slug))
    .unique();

  let templateId = existing?._id;
  if (!templateId) {
    templateId = await ctx.db.insert("goal_templates", {
      slug: template.slug,
      title: template.title,
      description: template.description,
      category: template.category,
      archetype: template.archetype,
      goal_type: template.goal_type,
      default_accountability_type: template.default_accountability_type,
      default_check_in_style: template.default_check_in_style,
      recommended_proof_mode: template.recommended_proof_mode,
      motivation_suggestions: template.motivation_suggestions,
      profile_defaults_json: template.profile_defaults_json,
      is_active: true,
      is_published: true,
      template_version: 1,
      sort_order: template.sort_order,
      created_at: now,
      updated_at: now,
    });
  } else {
    await ctx.db.patch(templateId, {
      title: template.title,
      description: template.description,
      category: template.category,
      archetype: template.archetype,
      goal_type: template.goal_type,
      default_accountability_type: template.default_accountability_type,
      default_check_in_style: template.default_check_in_style,
      recommended_proof_mode: template.recommended_proof_mode,
      motivation_suggestions: template.motivation_suggestions,
      profile_defaults_json: template.profile_defaults_json,
      is_active: true,
      is_published: true,
      sort_order: template.sort_order,
      template_version: (existing?.template_version || 1) + 1,
      updated_at: now,
    });
  }

  const existingTasks = await ctx.db
    .query("goal_template_tasks")
    .withIndex("by_template_position", (q: any) => q.eq("template_id", templateId))
    .collect();
  await Promise.all(existingTasks.map((task: any) => ctx.db.delete(task._id)));

  for (let index = 0; index < template.tasks.length; index += 1) {
    const task = template.tasks[index];
    await ctx.db.insert("goal_template_tasks", {
      template_id: templateId,
      position: index,
      name: task.name,
      description: task.description,
      repeat_frequency: task.repeat_frequency,
      verification_mode: task.verification_mode,
      time_window_start: task.time_window_start,
      time_window_end: task.time_window_end,
      time_window_duration_minutes: task.time_window_duration_minutes,
      requires_partner_review: task.requires_partner_review,
      auto_approval_policy: task.auto_approval_policy,
      auto_approval_timeout_hours: task.auto_approval_timeout_hours,
      auto_approval_min_confidence: task.auto_approval_min_confidence,
      created_at: now,
      updated_at: now,
    });
  }
}

export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    await getCurrentUser(ctx);
    for (const template of DEFAULT_TEMPLATE_SEEDS) {
      await upsertSeedTemplate(ctx, template);
    }
    return { seeded: DEFAULT_TEMPLATE_SEEDS.length };
  },
});

export const backfillTemplateArchetypes = mutation({
  args: {},
  handler: async (ctx) => {
    const templates = await ctx.db.query("goal_templates").collect();
    let updated = 0;

    for (const template of templates) {
      if (template.archetype) continue;
      await ctx.db.patch(template._id, {
        archetype: inferArchetype(template),
        updated_at: Date.now(),
      });
      updated += 1;
    }

    return { updated };
  },
});
