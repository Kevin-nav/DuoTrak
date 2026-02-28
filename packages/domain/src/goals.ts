export type ConvexTask = {
  _id: string;
  goal_id: string;
  _creationTime: number;
  updated_at?: number;
  due_date?: string | number | null;
  [key: string]: unknown;
};

export type ConvexGoal = {
  _id: string;
  user_id: string;
  is_habit: boolean;
  _creationTime: number;
  updated_at?: number;
  tasks: ConvexTask[];
  [key: string]: unknown;
};

export type DomainTask = {
  id: string;
  goal_id: string;
  name: string;
  description?: string | null;
  status: string;
  repeat_frequency?: string | null;
  time_window?: string | null;
  created_at: string;
  updated_at: string;
  due_date: string | null;
  cadenceType?: "daily" | "weekly" | "custom" | null;
  cadenceDays?: string[];
  timeWindowDurationMinutes?: number | null;
  isTemplateTask?: boolean;
  accountabilityType?: string | null;
  verificationMode?: string | null;
};

export type AiPlanMilestone = {
  name: string;
  description: string;
  target_week: number;
  progress_weight: number;
  task_count: number;
};

export type AiPlanData = {
  milestones: AiPlanMilestone[];
  generated_at: string;
};

export type DomainGoal = {
  id: string;
  userId: string;
  isHabit: boolean;
  name: string;
  description?: string | null;
  motivation?: string | null;
  category?: string | null;
  icon?: string | null;
  color?: string | null;
  isArchived: boolean;
  status: string;
  total: number;
  progress: number;
  availability?: string[];
  timeCommitment?: string;
  accountabilityType?: string;
  goalArchetype?: "savings" | "marathon" | "daily_habit" | "general";
  goalProfileJson?: string;
  goalType?: "habit" | "target-date" | "milestone" | null;
  endDate?: number | null;
  planningMode?: "ai" | "manual" | null;
  aiPlanJson?: string | null;
  aiPlan?: AiPlanData | null;
  createdAt: string;
  updatedAt: string;
  tasks: DomainTask[];
};

const parseAiPlan = (json: unknown): AiPlanData | null => {
  if (typeof json !== "string" || !json) return null;
  try {
    const parsed = JSON.parse(json);
    if (parsed && Array.isArray(parsed.milestones)) return parsed as AiPlanData;
  } catch { /* ignore */ }
  return null;
};

export const mapTaskFromConvex = (task: ConvexTask): DomainTask => ({
  id: task._id,
  goal_id: task.goal_id,
  name: typeof task.name === "string" ? task.name : "Untitled Task",
  description: typeof task.description === "string" ? task.description : null,
  status: typeof task.status === "string" ? task.status : "pending",
  repeat_frequency: typeof task.repeat_frequency === "string" ? task.repeat_frequency : null,
  time_window: typeof task.time_window === "string" ? task.time_window : null,
  created_at: new Date(task._creationTime).toISOString(),
  updated_at: new Date(task.updated_at ?? task._creationTime).toISOString(),
  due_date: task.due_date ? new Date(task.due_date).toISOString() : null,
  cadenceType: typeof task.cadence_type === "string"
    ? (task.cadence_type as "daily" | "weekly" | "custom")
    : null,
  cadenceDays: Array.isArray(task.cadence_days)
    ? task.cadence_days.filter((d): d is string => typeof d === "string")
    : [],
  timeWindowDurationMinutes: typeof task.time_window_duration_minutes === "number"
    ? task.time_window_duration_minutes
    : null,
  isTemplateTask: task.is_template_task === true,
  accountabilityType: typeof task.accountability_type === "string" ? task.accountability_type : null,
  verificationMode: typeof task.verification_mode === "string" ? task.verification_mode : null,
});

export const mapGoalFromConvex = (goal: ConvexGoal): DomainGoal => ({
  id: goal._id,
  userId: goal.user_id,
  isHabit: goal.is_habit,
  name: typeof goal.name === "string" ? goal.name : "Untitled Goal",
  description: typeof goal.description === "string" ? goal.description : null,
  motivation: typeof goal.motivation === "string" ? goal.motivation : null,
  category: typeof goal.category === "string" ? goal.category : null,
  icon: typeof goal.icon === "string" ? goal.icon : null,
  color: typeof goal.color === "string" ? goal.color : null,
  isArchived: goal.is_archived === true,
  status: typeof goal.status === "string" ? goal.status : "On Track",
  total: typeof goal.total === "number" ? goal.total : 0,
  progress: typeof goal.progress === "number" ? goal.progress : 0,
  availability: Array.isArray(goal.availability)
    ? goal.availability.filter((value): value is string => typeof value === "string")
    : [],
  timeCommitment: typeof goal.time_commitment === "string" ? goal.time_commitment : "",
  accountabilityType: typeof goal.accountability_type === "string" ? goal.accountability_type : "",
  goalArchetype: typeof goal.goal_archetype === "string"
    ? (goal.goal_archetype as "savings" | "marathon" | "daily_habit" | "general")
    : "general",
  goalProfileJson: typeof goal.goal_profile_json === "string" ? goal.goal_profile_json : "",
  goalType: typeof goal.goal_type === "string"
    ? (goal.goal_type as "habit" | "target-date" | "milestone")
    : null,
  endDate: typeof goal.end_date === "number" ? goal.end_date : null,
  planningMode: typeof goal.planning_mode === "string"
    ? (goal.planning_mode as "ai" | "manual")
    : null,
  aiPlanJson: typeof goal.ai_plan_json === "string" ? goal.ai_plan_json : null,
  aiPlan: parseAiPlan(goal.ai_plan_json),
  createdAt: new Date(goal._creationTime).toISOString(),
  updatedAt: new Date(goal.updated_at ?? goal._creationTime).toISOString(),
  tasks: Array.isArray(goal.tasks) ? goal.tasks.map(mapTaskFromConvex) : [],
});
