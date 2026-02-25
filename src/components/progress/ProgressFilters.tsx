"use client";

import { Button } from "@/components/ui/button";
import type { DatePreset } from "@/lib/progress/types";

type ProgressFiltersProps = {
  selectedPreset: DatePreset;
  onPresetChange: (preset: DatePreset) => void;
  includePartner: boolean;
  onIncludePartnerChange: (next: boolean) => void;
  partnerToggleDisabled?: boolean;
};

const PRESETS: DatePreset[] = ["7d", "30d", "90d"];

function presetLabel(preset: DatePreset): string {
  if (preset === "7d") return "7D";
  if (preset === "90d") return "90D";
  return "30D";
}

export default function ProgressFilters({
  selectedPreset,
  onPresetChange,
  includePartner,
  onIncludePartnerChange,
  partnerToggleDisabled = false,
}: ProgressFiltersProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-landing-clay bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((preset) => (
          <Button
            key={preset}
            size="sm"
            variant={selectedPreset === preset ? "default" : "outline"}
            onClick={() => onPresetChange(preset)}
            className={selectedPreset === preset ? "bg-landing-terracotta hover:bg-landing-espresso" : ""}
          >
            {presetLabel(preset)}
          </Button>
        ))}
      </div>
      <div className="flex items-center justify-between rounded-xl border border-landing-clay bg-landing-cream px-3 py-2 sm:justify-end">
        <label className="flex items-center gap-2 text-sm font-semibold text-landing-espresso">
          <input
            type="checkbox"
            checked={includePartner}
            onChange={(event) => onIncludePartnerChange(event.target.checked)}
            disabled={partnerToggleDisabled}
            className="h-4 w-4 rounded border-landing-clay accent-landing-terracotta disabled:cursor-not-allowed"
          />
          Compare with partner
        </label>
      </div>
    </div>
  );
}

