import { z } from "zod";

export const TaskVerificationModeSchema = z.enum([
  "photo",
  "voice",
  "time-window",
]);

export const TaskProofGuidanceSchema = z.object({
  what_counts: z.array(z.string()),
  good_examples: z.array(z.string()),
  avoid_examples: z.array(z.string()),
});

export const TaskPartnerInvolvementSchema = z.object({
  daily_check_in_suggestion: z.string(),
  weekly_anchor_review: z.string(),
  fallback_if_missed: z.string(),
});

export const TaskCadenceSchema = z.object({
  type: z.enum(["daily", "weekly", "custom"]),
  days_of_week: z.array(z.string()).optional(),
  times_per_week: z.number().optional(),
  duration_weeks: z.number().nullable().optional(),
  rest_days_rule: z.enum(["every_7th", "weekends", "none"]).optional(),
});

export const DuotrakTaskSchema = z.object({
  description: z.string(),
  success_metric: z.string(),
  recommended_cadence: z.string(),
  recommended_time_windows: z.array(z.string()),
  consistency_rationale: z.string(),
  verification_mode: TaskVerificationModeSchema,
  verification_mode_reason: z.string(),
  verification_confidence: z.number().min(0).max(1),
  time_window_start: z.string().nullable().optional(),
  time_window_end: z.string().nullable().optional(),
  time_window_duration_minutes: z.number().int().positive().nullable().optional(),
  partner_required: z.boolean(),
  auto_approval_policy: z.enum(["time_window_only", "none"]),
  auto_approval_timeout_hours: z.number().int().min(1),
  auto_approval_min_confidence: z.number().min(0).max(1),
  partner_involvement: TaskPartnerInvolvementSchema,
  proof_guidance: TaskProofGuidanceSchema,

  // ── Structured Cadence ──
  cadence: TaskCadenceSchema.optional(),

  // ── Progressive Difficulty ──
  difficulty_level: z.number().min(1).max(5).optional(),
  minimum_viable_action: z.string().optional(),
  ramp_up_weeks: z.number().optional(),
});

export const DuotrakMilestoneSchema = z.object({
  title: z.string(),
  description: z.string(),
  tasks: z.array(DuotrakTaskSchema),
});

export const HabitConfigSchema = z.object({
  streak_milestones: z.array(z.number()),
  minimum_viable_start: z.string(),
  ramp_up_schedule: z.string().optional(),
});

export const MilestoneConfigSchema = z.object({
  checkpoints: z.array(z.object({
    target_label: z.string(),
    deadline_description: z.string(),
  })),
  progress_unit: z.string(),
  target_value: z.number(),
});

export const TargetDateConfigSchema = z.object({
  phases: z.array(z.object({
    name: z.string(),
    description: z.string(),
    week_range: z.string(),
  })),
  end_date: z.string(),
});

export const DuotrakGoalPlanSchema = z.object({
  goal_type: z.enum(["habit", "target-date", "milestone"]).optional(),
  title: z.string(),
  description: z.string(),
  milestones: z.array(DuotrakMilestoneSchema),
  success_metrics: z.array(z.string()),
  adherence_weight: z.number().min(0).max(1),
  schedule_soft_cap_percent: z.number().min(0).max(100),
  schedule_impact: z.object({
    capacity_minutes: z.number().int().min(0),
    projected_load_minutes: z.number().int().min(0),
    overload_percent: z.number().min(0),
    conflict_flags: z.array(z.string()),
    fit_band: z.enum(["good", "warning", "overloaded"]),
  }),
  decision_trace: z.array(z.string()).max(3),
  partner_accountability: z.object({
    role: z.string(),
    check_in_schedule: z.string(),
    shared_celebrations: z.string(),
  }),

  // ── Goal-Type-Specific Configs ──
  habit_config: HabitConfigSchema.optional(),
  milestone_config: MilestoneConfigSchema.optional(),
  target_date_config: TargetDateConfigSchema.optional(),

  // ── First Day Readiness ──
  first_day_actions: z.array(z.string()).optional(),
  this_week_preview: z.string().optional(),

  // ── Shared Goal Awareness ──
  shared_goal_mode: z.enum(["independent", "together"]).optional(),
  partner_timezone_adjustment: z.string().optional(),

  // ── Template Attribution ──
  template_source_title: z.string().optional(),
  template_enhanced: z.boolean().optional(),
});

export const GoalPlanResponseSchema = z.object({
  session_id: z.string(),
  goal_plan: DuotrakGoalPlanSchema,
  partner_integration: z.string(),
  personalization_score: z.number(),
  execution_metadata: z.object({
    plan_generation_time_ms: z.number(),
  }),
});

export type TaskCadence = z.infer<typeof TaskCadenceSchema>;
export type DuotrakTask = z.infer<typeof DuotrakTaskSchema>;
export type DuotrakMilestone = z.infer<typeof DuotrakMilestoneSchema>;
export type DuotrakGoalPlan = z.infer<typeof DuotrakGoalPlanSchema>;
export type GoalPlanResponse = z.infer<typeof GoalPlanResponseSchema>;
export type TaskProofGuidance = z.infer<typeof TaskProofGuidanceSchema>;
export type TaskPartnerInvolvement = z.infer<typeof TaskPartnerInvolvementSchema>;
export type TaskVerificationMode = z.infer<typeof TaskVerificationModeSchema>;
export type HabitConfig = z.infer<typeof HabitConfigSchema>;
export type MilestoneConfig = z.infer<typeof MilestoneConfigSchema>;
export type TargetDateConfig = z.infer<typeof TargetDateConfigSchema>;
