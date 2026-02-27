"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";

import { useProgressMetrics, useStreakHistoryCalendar } from "@/hooks/useProgressMetrics";
import { useUser } from "@/contexts/UserContext";
import { getRangeFromPreset } from "@/lib/progress/dateRange";
import type { DatePreset } from "@/lib/progress/types";

import ProgressHeader from "@/components/progress/ProgressHeader";
import ProgressFilters from "@/components/progress/ProgressFilters";
import ProgressKpiGrid from "@/components/progress/ProgressKpiGrid";
import ProgressTrendChart from "@/components/progress/ProgressTrendChart";
import ProgressConsistencyChart from "@/components/progress/ProgressConsistencyChart";
import GoalProgressCards from "@/components/progress/GoalProgressCards";
import GoalProgressTable from "@/components/progress/GoalProgressTable";
import AchievementPanel from "@/components/progress/AchievementPanel";
import ProgressLoadingState from "@/components/progress/ProgressLoadingState";
import ProgressErrorState from "@/components/progress/ProgressErrorState";
import ProgressEmptyState from "@/components/progress/ProgressEmptyState";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import StreakHistoryCalendar from "@/components/progress/StreakHistoryCalendar";

export default function ProgressPage() {
  const { userDetails } = useUser();
  const hasPartner = !!userDetails?.partner_id;

  const [preset, setPreset] = useState<DatePreset>("30d");
  const [includePartner, setIncludePartner] = useState(true);
  const [retryNonce, setRetryNonce] = useState(0);

  const range = useMemo(() => getRangeFromPreset(preset), [preset, retryNonce]);

  const { data, isLoading } = useProgressMetrics({
    ...range,
    includePartner: includePartner && hasPartner,
  });
  const { data: streakHistoryData, isLoading: isStreakHistoryLoading } = useStreakHistoryCalendar({
    ...range,
    includePartner: includePartner && hasPartner,
  });

  const [stableData, setStableData] = useState<typeof data>(undefined);
  const [stableStreakHistoryData, setStableStreakHistoryData] = useState<typeof streakHistoryData>(undefined);

  useEffect(() => {
    if (data !== undefined) {
      setStableData(data);
    }
  }, [data]);

  useEffect(() => {
    if (streakHistoryData !== undefined) {
      setStableStreakHistoryData(streakHistoryData);
    }
  }, [streakHistoryData]);

  const displayData = data ?? stableData;
  const displayStreakHistoryData = streakHistoryData ?? stableStreakHistoryData;
  const isRefreshing = isLoading && !!stableData;
  const isHistoryRefreshing = isStreakHistoryLoading && !!stableStreakHistoryData;

  if (!displayData && isLoading) {
    return <ProgressLoadingState />;
  }

  if (!displayData) {
    return <ProgressErrorState onRetry={() => setRetryNonce((value) => value + 1)} />;
  }

  if (displayData.summary.totalTasks === 0 && displayData.goalBreakdown.length === 0) {
    return (
      <div className="space-y-5">
        <ProgressHeader partnerName={displayData.partnerComparison?.partnerName || userDetails?.partner_full_name} />
        <ProgressFilters
          selectedPreset={preset}
          onPresetChange={setPreset}
          includePartner={includePartner && hasPartner}
          onIncludePartnerChange={setIncludePartner}
          partnerToggleDisabled={!hasPartner}
          isUpdating={isRefreshing || isHistoryRefreshing}
        />
        <ProgressEmptyState onSelectPreset={setPreset} />
        {displayStreakHistoryData ? (
          <StreakHistoryCalendar data={displayStreakHistoryData} showPartnerComparison={includePartner && hasPartner} />
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <ProgressHeader partnerName={displayData.partnerComparison?.partnerName || userDetails?.partner_full_name} />

      <ProgressFilters
        selectedPreset={preset}
        onPresetChange={setPreset}
        includePartner={includePartner && hasPartner}
        onIncludePartnerChange={setIncludePartner}
        partnerToggleDisabled={!hasPartner}
        isUpdating={isRefreshing || isHistoryRefreshing}
      />

      {displayData.warnings.length > 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Partner comparison is limited</AlertTitle>
          <AlertDescription>{displayData.warnings[0]}</AlertDescription>
        </Alert>
      ) : null}

      <ProgressKpiGrid
        summary={displayData.summary}
        partnerComparison={displayData.partnerComparison}
        showPartnerComparison={includePartner && hasPartner}
      />

      <ProgressTrendChart
        trends={displayData.trends}
        partnerComparison={displayData.partnerComparison}
        showPartnerComparison={includePartner && hasPartner}
      />

      <ProgressConsistencyChart consistency={displayData.consistency} />

      {displayStreakHistoryData ? (
        <StreakHistoryCalendar data={displayStreakHistoryData} showPartnerComparison={includePartner && hasPartner} />
      ) : null}

      <GoalProgressCards goals={displayData.goalBreakdown} />
      <GoalProgressTable goals={displayData.goalBreakdown} />

      <AchievementPanel achievements={displayData.achievements} />
    </div>
  );
}
