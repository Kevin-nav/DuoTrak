"use client";

import { CalendarDays, ListChecks, Settings2 } from "lucide-react";
import { TabKey } from "./types";

export default function GoalTabs({
  activeTab,
  onChange,
}: {
  activeTab: TabKey;
  onChange: (tab: TabKey) => void;
}) {
  return (
    <div className="mb-4 rounded-2xl border border-border bg-card p-1.5 sm:mb-5">
      <div className="grid grid-cols-3 gap-1 sm:flex sm:min-w-max">
        <button
          onClick={() => onChange("this-week")}
          className={`flex-1 rounded-xl px-2.5 py-2 text-[11px] font-semibold transition-all sm:px-4 sm:text-xs ${
            activeTab === "this-week"
              ? "bg-sand text-espresso shadow-sm"
              : "text-muted-foreground hover:bg-background hover:text-foreground"
          }`}
        >
          <span className="inline-flex items-center justify-center gap-1.5">
            <CalendarDays className="hidden h-3.5 w-3.5 min-[381px]:block" />
            This Week
          </span>
        </button>
        <button
          onClick={() => onChange("full-plan")}
          className={`flex-1 rounded-xl px-2.5 py-2 text-[11px] font-semibold transition-all sm:px-4 sm:text-xs ${
            activeTab === "full-plan"
              ? "bg-sand text-espresso shadow-sm"
              : "text-muted-foreground hover:bg-background hover:text-foreground"
          }`}
        >
          <span className="inline-flex items-center justify-center gap-1.5">
            <ListChecks className="hidden h-3.5 w-3.5 min-[381px]:block" />
            Full Plan
          </span>
        </button>
        <button
          onClick={() => onChange("settings")}
          className={`flex-1 rounded-xl px-2.5 py-2 text-[11px] font-semibold transition-all sm:px-4 sm:text-xs ${
            activeTab === "settings"
              ? "bg-sand text-espresso shadow-sm"
              : "text-muted-foreground hover:bg-background hover:text-foreground"
          }`}
        >
          <span className="inline-flex items-center justify-center gap-1.5">
            <Settings2 className="hidden h-3.5 w-3.5 min-[381px]:block" />
            Settings
          </span>
        </button>
      </div>
    </div>
  );
}
