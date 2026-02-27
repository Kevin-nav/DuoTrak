"use client";

import { JournalCalendarItem } from "@/lib/journal/calendarTypes";
import { format } from "date-fns";

type JournalAgendaListProps = {
  items: JournalCalendarItem[];
  onSelectDay: (date: Date) => void;
};

export default function JournalAgendaList({ items, onSelectDay }: JournalAgendaListProps) {
  const grouped = items.reduce<Record<string, JournalCalendarItem[]>>((acc, item) => {
    const timestamp = item.itemType === "entry" ? item.entryDate : item.dueDate;
    if (!timestamp) return acc;
    const key = format(new Date(timestamp), "yyyy-MM-dd");
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const dayKeys = Object.keys(grouped).sort();

  if (dayKeys.length === 0) {
    return (
      <div className="rounded-xl border border-landing-clay bg-white p-4 text-sm text-landing-espresso-light">
        No calendar activity in this range.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {dayKeys.map((dayKey) => (
        <button
          key={dayKey}
          type="button"
          onClick={() => onSelectDay(new Date(`${dayKey}T12:00:00`))}
          className="w-full rounded-xl border border-landing-clay bg-white p-3 text-left transition hover:bg-landing-cream"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-landing-espresso-light">
            {format(new Date(`${dayKey}T12:00:00`), "EEE, MMM d")}
          </p>
          <div className="mt-1.5 space-y-1">
            {grouped[dayKey].slice(0, 3).map((item) => (
              <div key={`${dayKey}-${item.itemType}-${item.id}`} className="flex items-center gap-2 text-xs">
                <span
                  className={`rounded-full px-2 py-0.5 font-semibold ${
                    item.itemType === "entry"
                      ? "bg-landing-sand text-landing-espresso-light"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {item.itemType === "entry" ? "Entry" : "Todo"}
                </span>
                <span className="truncate text-landing-espresso">{item.title}</span>
              </div>
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}
