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

export const GoalSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: z.string().nullable(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  user_id: z.string().uuid(),
  tasks: z.array(TaskSchema),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type TaskRead = z.infer<typeof TaskSchema>;
export type GoalRead = z.infer<typeof GoalSchema>;
