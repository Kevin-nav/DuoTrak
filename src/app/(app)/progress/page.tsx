"use client";

import { useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";

import { useProgressMetrics } from "@/hooks/useProgressMetrics";
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

  if (isLoading) {
    return <ProgressLoadingState />;
  }

  if (!data) {
    return <ProgressErrorState onRetry={() => setRetryNonce((value) => value + 1)} />;
  }

  if (data.summary.totalTasks === 0 && data.goalBreakdown.length === 0) {
    return (
      <div className="space-y-5">
        <ProgressHeader partnerName={data.partnerComparison?.partnerName || userDetails?.partner_full_name} />
        <ProgressFilters
          selectedPreset={preset}
          onPresetChange={setPreset}
          includePartner={includePartner && hasPartner}
          onIncludePartnerChange={setIncludePartner}
          partnerToggleDisabled={!hasPartner}
        />
        <ProgressEmptyState onSelectPreset={setPreset} />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      <ProgressHeader partnerName={data.partnerComparison?.partnerName || userDetails?.partner_full_name} />

      <ProgressFilters
        selectedPreset={preset}
        onPresetChange={setPreset}
        includePartner={includePartner && hasPartner}
        onIncludePartnerChange={setIncludePartner}
        partnerToggleDisabled={!hasPartner}
      />

      {data.warnings.length > 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Partner comparison is limited</AlertTitle>
          <AlertDescription>{data.warnings[0]}</AlertDescription>
        </Alert>
      ) : null}

      <ProgressKpiGrid
        summary={data.summary}
        partnerComparison={data.partnerComparison}
        showPartnerComparison={includePartner && hasPartner}
      />

      <ProgressTrendChart
        trends={data.trends}
        partnerComparison={data.partnerComparison}
        showPartnerComparison={includePartner && hasPartner}
      />

      <ProgressConsistencyChart consistency={data.consistency} />

      <GoalProgressCards goals={data.goalBreakdown} />
      <GoalProgressTable goals={data.goalBreakdown} />

      <AchievementPanel achievements={data.achievements} />
    </div>
  );
}
