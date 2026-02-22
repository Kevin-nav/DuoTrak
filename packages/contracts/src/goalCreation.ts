import { z } from "zod";

export {
  DuotrakTaskSchema,
  DuotrakMilestoneSchema,
  DuotrakGoalPlanSchema,
  GoalPlanResponseSchema,
  TaskVerificationModeSchema,
  TaskProofGuidanceSchema,
  TaskPartnerInvolvementSchema,
} from "./goalPlan";

export type {
  DuotrakTask,
  DuotrakMilestone,
  DuotrakGoalPlan,
  GoalPlanResponse,
  TaskVerificationMode,
  TaskProofGuidance,
  TaskPartnerInvolvement,
} from "./goalPlan";

export const GoalWizardDataSchema = z.object({
  goal_description: z.string(),
  motivation: z.string(),
  availability: z.array(z.string()),
  time_commitment: z.string(),
  accountability_type: z.string(),
  partner_name: z.string().nullable().optional(),
  target_deadline: z.string().nullable().optional(),
  preferred_check_in_style: z.enum(["quick_text", "photo_recap", "voice_note"]).optional(),
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
