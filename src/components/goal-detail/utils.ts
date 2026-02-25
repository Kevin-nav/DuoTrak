import { DomainTask } from "../../../packages/domain/src/goals";
import { GoalVerificationMode } from "./types";

export const dayName = (value: Date): string =>
  value.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();

export function resolveVerificationMode(
  task: DomainTask,
  goalAccountability?: string
): GoalVerificationMode {
  const mode =
    task.verificationMode ||
    task.accountabilityType ||
    goalAccountability ||
    "task_completion";
  if (
    mode === "photo" ||
    mode === "video" ||
    mode === "voice" ||
    mode === "check_in" ||
    mode === "task_completion" ||
    mode === "time-window"
  ) {
    return mode;
  }
  return "task_completion";
}

export function actionLabelForMode(mode: GoalVerificationMode): string {
  if (mode === "voice") return "Record";
  if (mode === "video") return "Upload";
  if (mode === "photo") return "Upload";
  if (
    mode === "check_in" ||
    mode === "time-window" ||
    mode === "task_completion"
  )
    return "Check In";
  return "Complete";
}
