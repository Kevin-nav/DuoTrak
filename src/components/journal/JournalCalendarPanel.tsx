"use client";

import { useEffect, useMemo, useState } from "react";
import { addMonths, endOfMonth, format, isSameDay, startOfMonth } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { JournalSpaceType, useJournalCalendarItems } from "@/hooks/useJournal";
import JournalAgendaList from "@/components/journal/JournalAgendaList";
import JournalCalendarMonth from "@/components/journal/JournalCalendarMonth";
import JournalDaySheet from "@/components/journal/JournalDaySheet";
import type { JournalCalendarItem } from "@/lib/journal/calendarTypes";

type CalendarFilter = "all" | "entries" | "todos" | "assigned";

type JournalCalendarPanelProps = {
  spaceType: JournalSpaceType;
};

const filters: Array<{ id: CalendarFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "entries", label: "Entries" },
  { id: "todos", label: "Todos" },
  { id: "assigned", label: "Assigned to me" },
];

export default function JournalCalendarPanel({ spaceType }: JournalCalendarPanelProps) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<"agenda" | "month">("month");
  const [activeFilter, setActiveFilter] = useState<CalendarFilter>("all");
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    const updateViewport = () => {
      const nextIsMobile = window.matchMedia("(max-width: 767px)").matches;
      setIsMobile(nextIsMobile);
      setViewMode(nextIsMobile ? "agenda" : "month");
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const queryParams = useMemo(() => {
    const startDate = startOfMonth(addMonths(month, -1)).getTime();
    const endDate = endOfMonth(addMonths(month, 1)).getTime();
    return {
      startDate,
      endDate,
      spaceType,
      includeEntries: activeFilter === "all" || activeFilter === "entries",
      includeTasks: activeFilter === "all" || activeFilter === "todos" || activeFilter === "assigned",
      assigneeFilter: activeFilter === "assigned" ? "me" : "all",
    } as const;
  }, [activeFilter, month, spaceType]);

  const { items, isLoading } = useJournalCalendarItems(queryParams);

  const itemsByDay = useMemo(() => {
    return items.reduce<Record<string, JournalCalendarItem[]>>((acc, item) => {
      const timestamp = item.itemType === "entry" ? item.entryDate : item.dueDate;
      if (!timestamp) return acc;
      const key = format(new Date(timestamp), "yyyy-MM-dd");
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [items]);

  const selectedItems = useMemo(() => {
    return items.filter((item) => {
      const timestamp = item.itemType === "entry" ? item.entryDate : item.dueDate;
      if (!timestamp) return false;
      return isSameDay(new Date(timestamp), selectedDay);
    });
  }, [items, selectedDay]);

  return (
    <section className="rounded-2xl border border-landing-clay bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="inline-flex items-center gap-2 text-base font-bold text-landing-espresso">
            <CalendarDays className="h-4 w-4" />
            Calendar
          </h2>
          <div className="inline-flex items-center gap-1 rounded-lg border border-landing-clay p-1">
            <button
              type="button"
              onClick={() => setViewMode("agenda")}
              className={`rounded-md px-2 py-1 text-xs font-semibold transition ${viewMode === "agenda" ? "bg-landing-espresso text-landing-cream shadow-sm" : "text-landing-espresso-light hover:bg-landing-cream"
                }`}
            >
              Agenda
            </button>
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={`rounded-md px-2 py-1 text-xs font-semibold transition ${viewMode === "month" ? "bg-landing-espresso text-landing-cream shadow-sm" : "text-landing-espresso-light hover:bg-landing-cream"
                }`}
            >
              Month
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setActiveFilter(filter.id)}
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${activeFilter === filter.id
                ? "border-landing-terracotta bg-landing-terracotta/10 text-landing-espresso"
                : "border-landing-clay text-landing-espresso-light hover:bg-landing-cream"
                }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-xl border border-landing-clay bg-landing-cream p-2.5">
          <button
            type="button"
            onClick={() => setMonth((current) => addMonths(current, -1))}
            className="rounded-md border border-landing-clay bg-white p-1.5 text-landing-espresso-light transition hover:bg-gray-50 hover:text-landing-espresso"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-sm font-semibold text-landing-espresso">{format(month, "MMMM yyyy")}</p>
          <button
            type="button"
            onClick={() => setMonth((current) => addMonths(current, 1))}
            className="rounded-md border border-landing-clay bg-white p-1.5 text-landing-espresso-light transition hover:bg-gray-50 hover:text-landing-espresso"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="mt-3 text-sm text-landing-espresso-light">Loading calendar activity...</p>
      ) : (
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="w-full lg:flex-1 min-w-[240px]">
            {viewMode === "agenda" ? (
              <JournalAgendaList
                items={items}
                onSelectDay={(nextDate) => {
                  setSelectedDay(nextDate);
                  setIsSheetOpen(true);
                }}
              />
            ) : (
              <JournalCalendarMonth
                month={month}
                selectedDay={selectedDay}
                itemsByDay={itemsByDay}
                onSelectDay={(nextDate) => {
                  setSelectedDay(nextDate);
                  setIsSheetOpen(true);
                }}
              />
            )}
          </div>

          {!isMobile ? (
            <div className="hidden lg:block w-[280px] shrink-0">
              <JournalDaySheet date={selectedDay} items={selectedItems} isMobile={false} isOpen onClose={() => { }} />
            </div>
          ) : null}
        </div>
      )}

      {isMobile ? (
        <JournalDaySheet
          date={selectedDay}
          items={selectedItems}
          isMobile
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
        />
      ) : null}
    </section>
  );
}
