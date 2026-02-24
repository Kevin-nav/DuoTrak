import { z } from "zod";

export {
  DuotrakTaskSchema,
  DuotrakMilestoneSchema,
  DuotrakGoalPlanSchema,
  GoalPlanResponseSchema,
  TaskVerificationModeSchema,
  TaskProofGuidanceSchema,
  TaskPartnerInvolvementSchema,
  TaskCadenceSchema,
  HabitConfigSchema,
  MilestoneConfigSchema,
  TargetDateConfigSchema,
} from "./goalPlan";

export type {
  DuotrakTask,
  DuotrakMilestone,
  DuotrakGoalPlan,
  GoalPlanResponse,
  TaskVerificationMode,
  TaskProofGuidance,
  TaskPartnerInvolvement,
  TaskCadence,
  HabitConfig,
  MilestoneConfig,
  TargetDateConfig,
} from "./goalPlan";

export const GoalWizardDataSchema = z.object({
  goal_description: z.string(),
  motivation: z.string(),
  availability: z.array(z.string()),
  time_commitment: z.string(),
  accountability_type: z.string(),
  goal_type: z.enum(["habit", "target-date", "milestone"]).optional(),
  timezone: z.string().optional(),
  goal_template_id: z.string().optional(),
  goal_template_title: z.string().optional(),
  goal_template_tasks: z.array(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      repeat_frequency: z.string().optional(),
      verification_mode: z.string().optional(),
      time_window_start: z.string().optional(),
      time_window_end: z.string().optional(),
      time_window_duration_minutes: z.number().optional(),
      requires_partner_review: z.boolean().optional(),
    }),
  ).optional(),
  partner_name: z.string().nullable().optional(),
  target_deadline: z.string().nullable().optional(),
  preferred_check_in_style: z.enum(["quick_text", "photo_recap", "voice_note"]).optional(),

  // ── Shared Goal Intent ──
  is_shared_goal: z.boolean().optional(),
  shared_goal_mode: z.enum(["independent", "together"]).optional(),
  partner_timezone: z.string().optional(),

  // ── Template Enhancement Mode ──
  template_enhancement_mode: z.boolean().optional(),
});

export const GoalWizardRequestSchema = z.object({
  user_id: z.string(),
  wizard_data: GoalWizardDataSchema,
});

export const StrategicQuestionSchema = z.object({
  question: z.string(),
  question_key: z.string(),
  context: z.string(),
  suggested_answers: z.array(z.string()),
});

export const UserProfileSummarySchema = z.object({
  archetype: z.string(),
  key_motivators: z.array(z.string()),
  risk_factors: z.array(z.string()),
  confidence_level: z.number(),
});

export const QuestionsResponseSchema = z.object({
  session_id: z.string(),
  user_profile_summary: UserProfileSummarySchema,
  strategic_questions: z.array(StrategicQuestionSchema),
  execution_metadata: z.object({
    question_generation_time_ms: z.number(),
  }),
});

export const AnswersSubmissionRequestSchema = z.object({
  user_id: z.string(),
  answers: z.record(z.string()),
});

export type GoalWizardData = z.infer<typeof GoalWizardDataSchema>;
export type GoalWizardRequest = z.infer<typeof GoalWizardRequestSchema>;
export type StrategicQuestion = z.infer<typeof StrategicQuestionSchema>;
export type UserProfileSummary = z.infer<typeof UserProfileSummarySchema>;
export type QuestionsResponse = z.infer<typeof QuestionsResponseSchema>;
export type AnswersSubmissionRequest = z.infer<typeof AnswersSubmissionRequestSchema>;
