"use client";

import { JournalCalendarItem } from "@/lib/journal/calendarTypes";
import { addDays, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from "date-fns";

type JournalCalendarMonthProps = {
  month: Date;
  selectedDay: Date;
  itemsByDay: Record<string, JournalCalendarItem[]>;
  onSelectDay: (date: Date) => void;
};

export default function JournalCalendarMonth({ month, selectedDay, itemsByDay, onSelectDay }: JournalCalendarMonthProps) {
  const monthStart = startOfMonth(month);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });

  const days: Date[] = [];
  let cursor = calendarStart;
  while (cursor <= calendarEnd) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  return (
    <div className="rounded-xl border border-landing-clay bg-white p-3">
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-landing-espresso-light">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const items = itemsByDay[key] ?? [];
          const isSelected = isSameDay(day, selectedDay);
          const inMonth = isSameMonth(day, monthStart);
          const hasTodo = items.some((item) => item.itemType === "task");
          const hasEntry = items.some((item) => item.itemType === "entry");

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDay(day)}
              className={`min-h-16 rounded-lg border px-1 py-1.5 text-left transition ${
                isSelected
                  ? "border-landing-terracotta bg-landing-terracotta/10"
                  : "border-landing-clay hover:bg-landing-cream"
              } ${inMonth ? "text-landing-espresso" : "text-landing-espresso-light/60"}`}
            >
              <div className="text-xs font-semibold">{format(day, "d")}</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {hasEntry ? <span className="h-1.5 w-1.5 rounded-full bg-landing-terracotta" /> : null}
                {hasTodo ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> : null}
              </div>
              {items.length > 0 ? (
                <p className="mt-1 text-[10px] font-semibold text-landing-espresso-light">{items.length}</p>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
