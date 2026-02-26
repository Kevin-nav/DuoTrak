import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

type TrendPoint = {
  date: number;
  label: string;
  completed: number;
  total: number;
  completionRate: number;
};

type ConsistencyPoint = {
  weekStart: number;
  weekLabel: string;
  completed: number;
  total: number;
  completionRate: number;
};

type GoalBreakdownItem = {
  goalId: string;
  goalName: string;
  completed: number;
  total: number;
  completionRate: number;
  status: "on_track" | "at_risk" | "completed";
};

type AchievementItem = {
  id: string;
  title: string;
  description: string;
  earned: boolean;
};

type Summary = {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  activeGoals: number;
  completedGoals: number;
  currentStreakDays: number;
  longestStreakDays: number;
};

type UserMetrics = {
  summary: Summary;
  trends: TrendPoint[];
  consistency: ConsistencyPoint[];
  goalBreakdown: GoalBreakdownItem[];
  achievements: AchievementItem[];
};

function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function endOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
}

function dayLabel(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function weekLabel(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function weekStart(timestamp: number): number {
  const date = new Date(startOfDay(timestamp));
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diffToMonday);
  return date.getTime();
}

function ratio(completed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((completed / total) * 100);
}

function isCompletedStatus(status: string | undefined): boolean {
  if (!status) return false;
  return status === "completed" || status === "Completed" || status === "verified";
}

function buildAchievements(summary: Summary): AchievementItem[] {
  return [
    {
      id: "completion_80",
      title: "Strong Finisher",
      description: "Reached at least 80% completion in the selected range.",
      earned: summary.completionRate >= 80,
    },
    {
      id: "streak_7",
      title: "7-Day Rhythm",
      description: "Maintained a 7+ day completion streak.",
      earned: summary.longestStreakDays >= 7,
    },
    {
      id: "task_25",
      title: "Execution Engine",
      description: "Completed 25 or more tasks in this range.",
      earned: summary.completedTasks >= 25,
    },
    {
      id: "goal_complete",
      title: "Goal Closer",
      description: "Fully completed at least one goal in this range.",
      earned: summary.completedGoals >= 1,
    },
  ];
}

function calculateStreaks(trends: TrendPoint[]): {
  currentStreakDays: number;
  longestStreakDays: number;
} {
  const hasCompletion = trends.map((point) => point.completed > 0);
  let longestStreak = 0;
  let running = 0;
  for (const done of hasCompletion) {
    if (done) {
      running += 1;
      if (running > longestStreak) longestStreak = running;
    } else {
      running = 0;
    }
  }

  let currentStreak = 0;
  for (let i = hasCompletion.length - 1; i >= 0; i -= 1) {
    if (!hasCompletion[i]) break;
    currentStreak += 1;
  }

  return { currentStreakDays: currentStreak, longestStreakDays: longestStreak };
}

async function getCurrentUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const user = await ctx.db
    .query("users")
    .withIndex("by_firebase_uid", (q: any) => q.eq("firebase_uid", identity.subject))
    .unique();

  return user;
}

async function collectUserMetrics(
  ctx: any,
  userId: Id<"users">,
  rangeStart: number,
  rangeEnd: number
): Promise<UserMetrics> {
  const [goals, taskInstances] = await Promise.all([
    ctx.db
      .query("goals")
      .withIndex("by_user", (q: any) => q.eq("user_id", userId))
      .collect(),
    ctx.db
      .query("task_instances")
      .withIndex("by_user_date", (q: any) =>
        q.eq("user_id", userId).gte("instance_date", rangeStart).lte("instance_date", rangeEnd)
      )
      .collect(),
  ]);

  const activeGoals = goals.filter((goal: any) => !goal.is_archived);
  const goalNameMap = new Map<string, string>();
  for (const goal of activeGoals) {
    goalNameMap.set(String(goal._id), goal.name);
  }

  const trendMap = new Map<number, { completed: number; total: number }>();
  for (let cursor = rangeStart; cursor <= rangeEnd; cursor += DAY_MS) {
    trendMap.set(cursor, { completed: 0, total: 0 });
  }

  const goalAccumulator = new Map<string, { completed: number; total: number }>();
  for (const instance of taskInstances) {
    const day = startOfDay(instance.instance_date);
    const daily = trendMap.get(day);
    if (daily) {
      daily.total += 1;
      if (isCompletedStatus(instance.status)) daily.completed += 1;
    }

    const goalId = String(instance.goal_id);
    const current = goalAccumulator.get(goalId) || { completed: 0, total: 0 };
    current.total += 1;
    if (isCompletedStatus(instance.status)) current.completed += 1;
    goalAccumulator.set(goalId, current);
  }

  const trends: TrendPoint[] = Array.from(trendMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([date, values]) => ({
      date,
      label: dayLabel(date),
      completed: values.completed,
      total: values.total,
      completionRate: ratio(values.completed, values.total),
    }));

  const weeklyAccumulator = new Map<number, { completed: number; total: number }>();
  for (const trend of trends) {
    const key = weekStart(trend.date);
    const current = weeklyAccumulator.get(key) || { completed: 0, total: 0 };
    current.completed += trend.completed;
    current.total += trend.total;
    weeklyAccumulator.set(key, current);
  }

  const consistency: ConsistencyPoint[] = Array.from(weeklyAccumulator.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([weekStartValue, values]) => ({
      weekStart: weekStartValue,
      weekLabel: weekLabel(weekStartValue),
      completed: values.completed,
      total: values.total,
      completionRate: ratio(values.completed, values.total),
    }));

  const goalBreakdown: GoalBreakdownItem[] = activeGoals
    .map((goal: any): GoalBreakdownItem => {
      const agg = goalAccumulator.get(String(goal._id)) || { completed: 0, total: 0 };
      const completionRate = ratio(agg.completed, agg.total);
      const status: GoalBreakdownItem["status"] =
        agg.total > 0 && agg.completed === agg.total
          ? "completed"
          : completionRate >= 60
            ? "on_track"
            : "at_risk";
      return {
        goalId: String(goal._id),
        goalName: goal.name,
        completed: agg.completed,
        total: agg.total,
        completionRate,
        status,
      };
    })
    .sort((a: GoalBreakdownItem, b: GoalBreakdownItem) => b.completionRate - a.completionRate);

  const totalTasks = taskInstances.length;
  const completedTasks = taskInstances.filter((instance: any) => isCompletedStatus(instance.status)).length;
  const completedGoals = goalBreakdown.filter((goal) => goal.total > 0 && goal.completed === goal.total).length;
  const streaks = calculateStreaks(trends);

  const summary: Summary = {
    totalTasks,
    completedTasks,
    completionRate: ratio(completedTasks, totalTasks),
    activeGoals: activeGoals.length,
    completedGoals,
    currentStreakDays: streaks.currentStreakDays,
    longestStreakDays: streaks.longestStreakDays,
  };

  return {
    summary,
    trends,
    consistency,
    goalBreakdown,
    achievements: buildAchievements(summary),
  };
}

export const getDashboardMetrics = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    includePartner: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      return null;
    }

    const rangeStart = startOfDay(args.startDate);
    const rangeEnd = endOfDay(args.endDate);
    if (rangeEnd < rangeStart || rangeEnd - rangeStart > 365 * DAY_MS) {
      throw new Error("Invalid date range");
    }

    const includePartner = args.includePartner ?? true;
    const userMetrics = await collectUserMetrics(ctx, user._id, rangeStart, rangeEnd);

    let partnerComparison: {
      partnerName: string;
      partnerSummary: Summary;
      partnerTrends: TrendPoint[];
      delta: {
        completionRateDelta: number;
        completedTasksDelta: number;
      };
    } | null = null;

    const warnings: string[] = [];

    if (includePartner) {
      if (!user.current_partner_id) {
        warnings.push("Partner comparison unavailable because no active partner was found.");
      } else {
        const partnerId = user.current_partner_id as Id<"users">;
        const partner = await ctx.db.get(partnerId);
        if (!partner) {
          warnings.push("Partner comparison unavailable because partner profile could not be loaded.");
        } else {
          const partnerMetrics = await collectUserMetrics(ctx, partnerId, rangeStart, rangeEnd);
          partnerComparison = {
            partnerName: partner.full_name || partner.nickname || "Partner",
            partnerSummary: partnerMetrics.summary,
            partnerTrends: partnerMetrics.trends,
            delta: {
              completionRateDelta: userMetrics.summary.completionRate - partnerMetrics.summary.completionRate,
              completedTasksDelta: userMetrics.summary.completedTasks - partnerMetrics.summary.completedTasks,
            },
          };
        }
      }
    }

    return {
      range: {
        startDate: rangeStart,
        endDate: rangeEnd,
        dayCount: Math.floor((rangeEnd - rangeStart) / DAY_MS) + 1,
        weekCount: Math.max(1, Math.ceil((rangeEnd - rangeStart + DAY_MS) / WEEK_MS)),
      },
      summary: userMetrics.summary,
      trends: userMetrics.trends,
      consistency: userMetrics.consistency,
      goalBreakdown: userMetrics.goalBreakdown,
      achievements: userMetrics.achievements,
      partnerComparison,
      warnings,
      generatedAt: Date.now(),
    };
  },
});
