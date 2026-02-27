export type DatePreset = "7d" | "30d" | "90d";

export type ProgressSummary = {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  activeGoals: number;
  completedGoals: number;
  currentStreakDays: number;
  longestStreakDays: number;
};

export type ProgressTrendPoint = {
  date: number;
  label: string;
  completed: number;
  total: number;
  completionRate: number;
};

export type ProgressConsistencyPoint = {
  weekStart: number;
  weekLabel: string;
  completed: number;
  total: number;
  completionRate: number;
};

export type GoalBreakdownItem = {
  goalId: string;
  goalName: string;
  completed: number;
  total: number;
  completionRate: number;
  status: "on_track" | "at_risk" | "completed";
};

export type AchievementItem = {
  id: string;
  title: string;
  description: string;
  earned: boolean;
};

export type PartnerComparison = {
  partnerName: string;
  partnerSummary: ProgressSummary;
  partnerTrends: ProgressTrendPoint[];
  delta: {
    completionRateDelta: number;
    completedTasksDelta: number;
  };
};

export type ProgressMetrics = {
  range: {
    startDate: number;
    endDate: number;
    dayCount: number;
    weekCount: number;
  };
  summary: ProgressSummary;
  trends: ProgressTrendPoint[];
  consistency: ProgressConsistencyPoint[];
  goalBreakdown: GoalBreakdownItem[];
  achievements: AchievementItem[];
  partnerComparison: PartnerComparison | null;
  warnings: string[];
  generatedAt: number;
};

export type StreakDayStatus = "done" | "missed" | "no_plan";

export type StreakDayActor = {
  status: StreakDayStatus;
  completedTasks: number;
  totalTasks: number;
};

export type StreakHistoryDay = {
  date: number;
  label: string;
  user: StreakDayActor;
  partner: StreakDayActor | null;
};

export type StreakHistoryCalendarData = {
  range: {
    startDate: number;
    endDate: number;
    dayCount: number;
  };
  days: StreakHistoryDay[];
  partnerName: string | null;
  warnings: string[];
  generatedAt: number;
};
