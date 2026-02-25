"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { ProgressMetrics } from "@/lib/progress/types";
import { normalizeDateRange } from "@/lib/progress/dateRange";

type ProgressParams = {
  startDate: number;
  endDate: number;
  includePartner: boolean;
};

export function useProgressMetrics(params: ProgressParams) {
  const normalized = normalizeDateRange(params);

  const data = useQuery((api as any).progress.getDashboardMetrics, {
    ...normalized,
    includePartner: params.includePartner,
  }) as ProgressMetrics | null | undefined;

  return {
    data,
    isLoading: data === undefined,
  };
}
