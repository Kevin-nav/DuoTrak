"use client";

import { useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

function startOfWeekMonday(timestampMs: number): number {
  const d = new Date(timestampMs);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun ... 6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.getTime();
}

export function useGoalExecution(goalId: string, options?: { timelineLimit?: number; weekStart?: number }) {
  const generateForGoal = useMutation((api as any).taskInstances.generateForGoal);
  const ensuredWeekKeyRef = useRef<string | null>(null);

  const weekStart = useMemo(
    () => options?.weekStart ?? startOfWeekMonday(Date.now()),
    [options?.weekStart],
  );

  const data = useQuery(
    (api as any).taskInstances.getGoalExecutionView,
    goalId
      ? {
          goal_id: goalId as any,
          timeline_limit: options?.timelineLimit,
          week_start: weekStart,
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

  useEffect(() => {
    if (!goalId) return;
    const weekKey = `${goalId}:${weekStart}`;
    if (ensuredWeekKeyRef.current === weekKey) return;
    ensuredWeekKeyRef.current = weekKey;

    const run = async () => {
      for (let i = 0; i < 7; i += 1) {
        const date = weekStart + i * 24 * 60 * 60 * 1000;
        try {
          await generateForGoal({ goal_id: goalId as any, date });
        } catch {
          // Keep UI resilient even if background scheduling fails.
        }
      }
    };

    run();
  }, [goalId, weekStart, generateForGoal]);

  return {
    data: data ?? null,
    isLoading: data === undefined,
  };
}
