"use client";

import { Button } from "@/components/ui/button";
import type { DatePreset } from "@/lib/progress/types";

type ProgressEmptyStateProps = {
  onSelectPreset: (preset: DatePreset) => void;
};

export default function ProgressEmptyState({ onSelectPreset }: ProgressEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-landing-clay bg-white p-6 text-center">
      <h2 className="text-lg font-bold text-landing-espresso">No activity in this range</h2>
      <p className="mt-2 text-sm text-landing-espresso-light">
        Try a broader date range to view your progress trends and goal analytics.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <Button variant="outline" onClick={() => onSelectPreset("7d")}>
          Last 7 Days
        </Button>
        <Button variant="outline" onClick={() => onSelectPreset("30d")}>
          Last 30 Days
        </Button>
        <Button variant="outline" onClick={() => onSelectPreset("90d")}>
          Last 90 Days
        </Button>
      </div>
    </div>
  );
}

