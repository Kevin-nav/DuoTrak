import { z } from "zod";

export const DuotrakTaskSchema = z.object({
  description: z.string(),
  success_metric: z.string(),
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
