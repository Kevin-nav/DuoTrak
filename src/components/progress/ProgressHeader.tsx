"use client";

import { TrendingUp } from "lucide-react";

type ProgressHeaderProps = {
  partnerName?: string | null;
};

export default function ProgressHeader({ partnerName }: ProgressHeaderProps) {
  return (
    <div className="space-y-2">
      <div className="inline-flex items-center gap-2 rounded-full border border-landing-clay bg-landing-cream px-3 py-1 text-xs font-semibold text-landing-espresso">
        <TrendingUp className="h-3.5 w-3.5" />
        Progress Analytics
      </div>
      <h1 className="text-2xl font-black tracking-tight text-landing-espresso sm:text-3xl">Your Progress</h1>
      <p className="text-sm text-landing-espresso-light sm:text-base">
        Track completion trends, consistency, and goal momentum{partnerName ? ` with ${partnerName}` : ""}.
      </p>
    </div>
  );
}

