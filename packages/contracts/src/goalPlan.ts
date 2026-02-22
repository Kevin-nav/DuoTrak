import { z } from "zod";

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

export const DuotrakTaskSchema = z.object({
  description: z.string(),
  success_metric: z.string(),
  recommended_cadence: z.string(),
  recommended_time_windows: z.array(z.string()),
  consistency_rationale: z.string(),
  partner_involvement: TaskPartnerInvolvementSchema,
  proof_guidance: TaskProofGuidanceSchema,
});

export const DuotrakMilestoneSchema = z.object({
  title: z.string(),
  description: z.string(),
  tasks: z.array(DuotrakTaskSchema),
});

export const DuotrakGoalPlanSchema = z.object({
  title: z.string(),
  description: z.string(),
  milestones: z.array(DuotrakMilestoneSchema),
  success_metrics: z.array(z.string()),
  partner_accountability: z.object({
    role: z.string(),
    check_in_schedule: z.string(),
    shared_celebrations: z.string(),
  }),
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

export type DuotrakTask = z.infer<typeof DuotrakTaskSchema>;
export type DuotrakMilestone = z.infer<typeof DuotrakMilestoneSchema>;
export type DuotrakGoalPlan = z.infer<typeof DuotrakGoalPlanSchema>;
export type GoalPlanResponse = z.infer<typeof GoalPlanResponseSchema>;
export type TaskProofGuidance = z.infer<typeof TaskProofGuidanceSchema>;
export type TaskPartnerInvolvement = z.infer<typeof TaskPartnerInvolvementSchema>;
