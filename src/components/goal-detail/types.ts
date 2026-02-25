import { DomainGoal, DomainTask } from "../../../packages/domain/src/goals";

export type TabKey = "this-week" | "all-tasks" | "full-plan" | "settings";

export interface GoalDetailViewProps {
  goal: DomainGoal;
}

export type WeekGroup = {
  label: string;
  tasks: DomainTask[];
};

export type GoalVerificationMode =
  | "photo"
  | "video"
  | "voice"
  | "check_in"
  | "task_completion"
  | "time-window";
