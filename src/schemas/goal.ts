// src/schemas/goal.ts
import { z } from 'zod';

export const TaskSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  status: z.string(),
  due_date: z.string().datetime().nullable(),
  goal_id: z.string().uuid(),
  repeat_frequency: z.string().nullable().optional(),
  time_window: z.string().nullable().optional(),
  accountability_type: z.string().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const GoalBaseSchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  motivation: z.string().nullable().optional(),
  category: z.string().nullable(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
});

export const GoalReadSchema = GoalBaseSchema.extend({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  isHabit: z.boolean(),
  tasks: z.array(TaskSchema),
  availability: z.array(z.string()).nullable().optional(),
  timeCommitment: z.string().nullable().optional(),
  accountabilityType: z.string().nullable().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  // Computed fields from backend
  total: z.number().int(),
  progress: z.number().int(),
  status: z.string(),
});

export const GoalCreateSchema = GoalBaseSchema.extend({
  isHabit: z.boolean().default(false),
  availability: z.array(z.string()).optional(),
  timeCommitment: z.string().optional(),
  accountabilityType: z.string().optional(),
  tasks: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    repeatFrequency: z.string().optional(),
    timeWindow: z.string().optional(),
    accountabilityType: z.string().optional(),
  })),
});

// For updates, we allow a subset of the base fields.
// Note: We are not allowing tasks to be updated via this endpoint for now.
export const GoalUpdateSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    motivation: z.string().optional(),
    category: z.string().optional(),
    icon: z.string().optional(),
    color: z.string().optional(),
    availability: z.array(z.string()).optional(),
    timeCommitment: z.string().optional(),
    accountabilityType: z.string().optional(),
});

export type TaskRead = z.infer<typeof TaskSchema>;
export type GoalRead = z.infer<typeof GoalReadSchema>;
export type GoalCreate = z.infer<typeof GoalCreateSchema>;
export type GoalUpdate = z.infer<typeof GoalUpdateSchema>;


// --- AI Goal Suggestion Schemas ---
export const GoalSuggestionRequestSchema = z.object({
  goalType: z.enum(["personal", "shared"]),
  goalName: z.string(),
  motivation: z.string(),
  availability: z.array(z.string()),
  timeCommitment: z.string(),
  customTime: z.string().optional(),
  accountabilityType: z.string(),
  timeWindow: z.string().optional(),
  partnerName: z.string().optional(),
});

export const SuggestedTaskSchema = z.object({
  taskName: z.string(),
  description: z.string(),
  repeatFrequency: z.string(),
});

export const GoalSuggestionResponseSchema = z.object({
  goalType: z.string(),
  tasks: z.array(SuggestedTaskSchema),
  successTips: z.array(z.string()),
  generatedAt: z.string(),
  modelVersion: z.string(),
});

export type GoalSuggestionRequest = z.infer<typeof GoalSuggestionRequestSchema>;
export type SuggestedTask = z.infer<typeof SuggestedTaskSchema>;
export type GoalSuggestionResponse = z.infer<typeof GoalSuggestionResponseSchema>;

// --- V3 Agentic Goal Creation Schemas ---

// Phase 1: Request to get questions
export const GoalWizardRequestSchema = z.object({
  userId: z.string(),
  wizardData: z.object({
    goalDescription: z.string(),
    motivation: z.string(),
    availability: z.array(z.string()),
    timeCommitment: z.string(),
    accountabilityType: z.string(),
    partnerName: z.string().optional().nullable(),
  }),
});

// Phase 1: Response with questions
export const StrategicQuestionSchema = z.object({
  question: z.string(),
  questionKey: z.string(),
  context: z.string(),
  suggestedAnswers: z.array(z.string()),
});

export const QuestionsResponseSchema = z.object({
  sessionId: z.string(),
  userProfileSummary: z.string(),
  strategicQuestions: z.array(StrategicQuestionSchema),
  executionMetadata: z.object({
    questionGenerationTimeMs: z.number(),
  }),
});

// Phase 2: Request to submit answers
export const AnswersSubmissionRequestSchema = z.object({
  userId: z.string(),
  answers: z.record(z.string()),
});

// Phase 2: Response with the final plan
export const DuotrakTaskSchema = z.object({
  description: z.string(),
  successMetric: z.string(),
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
  successMetrics: z.array(z.string()),
  partnerAccountability: z.object({
    role: z.string(),
    checkInSchedule: z.string(),
    sharedCelebrations: z.string(),
  }),
});

export const GoalPlanResponseSchema = z.object({
  sessionId: z.string(),
  goalPlan: DuotrakGoalPlanSchema,
  partnerIntegration: z.string(),
  personalizationScore: z.number(),
  executionMetadata: z.object({
    planGenerationTimeMs: z.number(),
  }),
});

export type GoalWizardRequest = z.infer<typeof GoalWizardRequestSchema>;
export type StrategicQuestion = z.infer<typeof StrategicQuestionSchema>;
export type QuestionsResponse = z.infer<typeof QuestionsResponseSchema>;
export type AnswersSubmissionRequest = z.infer<typeof AnswersSubmissionRequestSchema>;
export type DuotrakGoalPlan = z.infer<typeof DuotrakGoalPlanSchema>;
export type GoalPlanResponse = z.infer<typeof GoalPlanResponseSchema>;