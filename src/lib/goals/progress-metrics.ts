import { DomainGoal } from "../../../packages/domain/src/goals";

type GoalArchetype = "savings" | "marathon" | "daily_habit" | "general";

type SavingsProfile = {
  currency?: string;
  targetAmount?: number;
  currentAmount?: number;
  weeklyContribution?: number;
};

type MarathonProfile = {
  targetDistanceKm?: number;
  currentLongRunKm?: number;
  targetLongRunKm?: number;
  totalWeeks?: number;
  completedWeeks?: number;
};

type HabitProfile = {
  targetStreak?: number;
  currentStreak?: number;
  dailyTarget?: number;
};

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const parseProfile = <T>(raw?: string): T | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const inferGoalArchetype = (goal: DomainGoal): GoalArchetype => {
  if (goal.goalArchetype) return goal.goalArchetype;
  const lower = `${goal.name} ${goal.category || ""}`.toLowerCase();
  if (lower.includes("save") || lower.includes("savings") || lower.includes("$")) return "savings";
  if (lower.includes("marathon") || lower.includes("run")) return "marathon";
  if (goal.isHabit) return "daily_habit";
  return "general";
};

export const getGoalProgressModel = (goal: DomainGoal) => {
  const archetype = inferGoalArchetype(goal);
  const fallbackPercent = goal.total > 0 ? (goal.progress / goal.total) * 100 : 0;

  if (archetype === "savings") {
    const profile = parseProfile<SavingsProfile>(goal.goalProfileJson) || {};
    const target = Math.max(1, Number(profile.targetAmount || 0));
    const current = Math.max(0, Number(profile.currentAmount || 0));
    const percent = clamp((current / target) * 100);
    return {
      archetype,
      title: "Savings Progress",
      percent,
      summary: `${profile.currency || "USD"} ${current.toLocaleString()} / ${target.toLocaleString()}`,
      helper: `Weekly contribution: ${(profile.currency || "USD")} ${(profile.weeklyContribution || 0).toLocaleString()}`,
    };
  }

  if (archetype === "marathon") {
    const profile = parseProfile<MarathonProfile>(goal.goalProfileJson) || {};
    const longRunTarget = Math.max(1, Number(profile.targetLongRunKm || 32));
    const longRunCurrent = Math.max(0, Number(profile.currentLongRunKm || 0));
    const weeksTotal = Math.max(1, Number(profile.totalWeeks || 16));
    const weeksDone = Math.max(0, Number(profile.completedWeeks || 0));
    const distancePercent = longRunCurrent / longRunTarget;
    const weeksPercent = weeksDone / weeksTotal;
    const percent = clamp((distancePercent * 0.6 + weeksPercent * 0.4) * 100);
    return {
      archetype,
      title: "Marathon Readiness",
      percent,
      summary: `Long run ${longRunCurrent}km / ${longRunTarget}km`,
      helper: `Weeks completed: ${weeksDone}/${weeksTotal}`,
    };
  }

  if (archetype === "daily_habit") {
    const profile = parseProfile<HabitProfile>(goal.goalProfileJson) || {};
    const streakTarget = Math.max(1, Number(profile.targetStreak || 21));
    const streakCurrent = Math.max(0, Number(profile.currentStreak || 0));
    const streakPercent = clamp((streakCurrent / streakTarget) * 100);
    const dailyPercent = clamp(fallbackPercent);
    return {
      archetype,
      title: "Daily Habit Consistency",
      percent: dailyPercent,
      summary: `Today: ${Math.round(dailyPercent)}% complete`,
      helper: `Streak: ${streakCurrent}/${streakTarget} days`,
      streakPercent,
    };
  }

  return {
    archetype,
    title: "Overall Progress",
    percent: clamp(fallbackPercent),
    summary: `${goal.progress}/${goal.total} completed`,
    helper: goal.isHabit ? "Habit Building" : "Project Goal",
  };
};
