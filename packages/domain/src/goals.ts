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
  created_at: string;
  updated_at: string;
  due_date: string | null;
  [key: string]: unknown;
};

export type DomainGoal = {
  id: string;
  userId: string;
  isHabit: boolean;
  createdAt: string;
  updatedAt: string;
  tasks: DomainTask[];
  [key: string]: unknown;
};

export const mapTaskFromConvex = (task: ConvexTask): DomainTask => ({
  ...task,
  id: task._id,
  goal_id: task.goal_id,
  created_at: new Date(task._creationTime).toISOString(),
  updated_at: new Date(task.updated_at ?? task._creationTime).toISOString(),
  due_date: task.due_date ? new Date(task.due_date).toISOString() : null,
});

export const mapGoalFromConvex = (goal: ConvexGoal): DomainGoal => ({
  ...goal,
  id: goal._id,
  userId: goal.user_id,
  isHabit: goal.is_habit,
  createdAt: new Date(goal._creationTime).toISOString(),
  updatedAt: new Date(goal.updated_at ?? goal._creationTime).toISOString(),
  tasks: goal.tasks.map(mapTaskFromConvex),
});
