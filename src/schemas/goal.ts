// src/schemas/goal.ts
import { z } from 'zod';

export const TaskSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: z.string(),
  due_date: z.string().datetime().nullable(),
  goal_id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const GoalBaseSchema = z.object({
  name: z.string(),
  category: z.string().nullable(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
});

export const GoalReadSchema = GoalBaseSchema.extend({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  isHabit: z.boolean(),
  tasks: z.array(TaskSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  // Computed fields from backend
  total: z.number().int(),
  progress: z.number().int(),
  status: z.string(),
});

export const GoalCreateSchema = GoalBaseSchema.extend({
  isHabit: z.boolean().default(false),
  tasks: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    repeatFrequency: z.string().optional(),
  })),
});

// For updates, we allow a subset of the base fields.
// Note: We are not allowing tasks to be updated via this endpoint for now.
export const GoalUpdateSchema = z.object({
    name: z.string().optional(),
    category: z.string().optional(),
    icon: z.string().optional(),
    color: z.string().optional(),
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