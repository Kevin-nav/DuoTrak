"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { ProgressSummary, PartnerComparison } from "@/lib/progress/types";

type ProgressKpiGridProps = {
  summary: ProgressSummary;
  partnerComparison: PartnerComparison | null;
  showPartnerComparison: boolean;
};

function KpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="border-landing-clay">
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-landing-espresso-light">{label}</p>
        <p className="mt-2 text-2xl font-black text-landing-espresso">{value}</p>
        {hint ? <p className="mt-1 text-xs text-landing-espresso-light">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

export default function ProgressKpiGrid({ summary, partnerComparison, showPartnerComparison }: ProgressKpiGridProps) {
  const completionHint =
    showPartnerComparison && partnerComparison
      ? `${partnerComparison.delta.completionRateDelta >= 0 ? "+" : ""}${partnerComparison.delta.completionRateDelta}% vs partner`
      : "Completion within selected date range";

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <KpiCard label="Completion" value={`${summary.completionRate}%`} hint={completionHint} />
      <KpiCard label="Completed Tasks" value={`${summary.completedTasks}`} hint={`of ${summary.totalTasks} scheduled`} />
      <KpiCard label="Active Goals" value={`${summary.activeGoals}`} hint={`${summary.completedGoals} fully completed`} />
      <KpiCard label="Current Streak" value={`${summary.currentStreakDays}d`} hint="Consecutive active days" />
      <KpiCard label="Best Streak" value={`${summary.longestStreakDays}d`} hint="Longest in selected range" />
    </section>
  );
}

