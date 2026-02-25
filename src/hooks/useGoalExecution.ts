"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useGoalExecution(goalId: string, options?: { timelineLimit?: number; weekStart?: number }) {
  const data = useQuery(
    (api as any).taskInstances.getGoalExecutionView,
    goalId
      ? {
          goal_id: goalId as any,
          timeline_limit: options?.timelineLimit,
          week_start: options?.weekStart,
        }
      : "skip"
  ) as
    | {
        goal_id: string;
        week_start: number;
        week_end: number;
        today_start: number;
        today_end: number;
        week_instances: any[];
        all_instances: any[];
        week_summary: {
          completed: number;
          awaitingReview: number;
          notCompleted: number;
          rejected: number;
          pending: number;
        };
      }
    | undefined;

  return {
    data: data ?? null,
    isLoading: data === undefined,
  };
}
