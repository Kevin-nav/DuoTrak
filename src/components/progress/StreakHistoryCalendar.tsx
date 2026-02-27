"use client";

import { useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { StreakDayActor, StreakDayStatus, StreakHistoryCalendarData, StreakHistoryDay } from "@/lib/progress/types";
import { cn } from "@/lib/utils";

type StreakHistoryCalendarProps = {
  data: StreakHistoryCalendarData;
  showPartnerComparison: boolean;
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function statusLabel(status: StreakDayStatus): string {
  if (status === "done") return "Done";
  if (status === "missed") return "Missed";
  return "No Plan";
}

function statusColor(status: StreakDayStatus): string {
  if (status === "done") return "bg-emerald-500";
  if (status === "missed") return "bg-rose-500";
  return "bg-slate-300";
}

function statusSurfaceClass(status: StreakDayStatus): string {
  if (status === "done") return "bg-emerald-50 border-emerald-200 text-emerald-900";
  if (status === "missed") return "bg-rose-50 border-rose-200 text-rose-900";
  return "bg-slate-50 border-slate-200 text-slate-700";
}

function DayActorCard({ title, actor }: { title: string; actor: StreakDayActor }) {
  return (
    <div className={cn("rounded-md border p-3", statusSurfaceClass(actor.status))}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{title}</p>
        <Badge variant="outline" className="border-current text-[10px] uppercase tracking-wide">
          {statusLabel(actor.status)}
        </Badge>
      </div>
      <p className="mt-2 text-sm">
        {actor.completedTasks} completed / {actor.totalTasks} total tasks
      </p>
    </div>
  );
}

export default function StreakHistoryCalendar({ data, showPartnerComparison }: StreakHistoryCalendarProps) {
  const [selectedDay, setSelectedDay] = useState<StreakHistoryDay | null>(null);

  const leadingSlots = useMemo(() => {
    const start = new Date(data.range.startDate);
    return start.getDay();
  }, [data.range.startDate]);

  const today = useMemo(() => {
    const current = new Date();
    current.setHours(0, 0, 0, 0);
    return current.getTime();
  }, []);

  return (
    <Card className="border-landing-clay">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-bold text-landing-espresso">Streak History Calendar</CardTitle>
            <p className="mt-1 text-xs text-landing-espresso-light">Tap a day to view completion details.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-landing-espresso-light">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Done
            </div>
            <div className="flex items-center gap-1 text-xs text-landing-espresso-light">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              Missed
            </div>
            <div className="flex items-center gap-1 text-xs text-landing-espresso-light">
              <span className="h-2 w-2 rounded-full bg-slate-300" />
              No plan
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {data.warnings.length > 0 ? (
          <p className="text-xs text-amber-700">{data.warnings[0]}</p>
        ) : null}

        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAY_LABELS.map((label) => (
            <p key={label} className="text-[10px] font-medium uppercase tracking-wide text-landing-espresso-light">
              {label}
            </p>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {Array.from({ length: leadingSlots }).map((_, index) => (
            <div key={`lead-${index}`} className="h-12 rounded-md border border-transparent sm:h-14" aria-hidden />
          ))}

          {data.days.map((day) => {
            const date = new Date(day.date);
            const dayNumber = date.getDate();
            const isToday = day.date === today;
            const partnerStatus = showPartnerComparison ? day.partner?.status ?? null : null;

            return (
              <button
                type="button"
                key={day.date}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "relative h-12 rounded-md border px-1 py-1 text-left transition-colors hover:brightness-95 sm:h-14",
                  statusSurfaceClass(day.user.status),
                  isToday ? "ring-2 ring-landing-ocean ring-offset-1" : ""
                )}
              >
                <span className="block text-xs font-semibold">{dayNumber}</span>
                <span className="mt-1 block h-1.5 w-full rounded-full">
                  <span className={cn("block h-1.5 w-full rounded-full", statusColor(day.user.status))} />
                </span>
                {partnerStatus ? (
                  <span className={cn("absolute right-1 top-1 h-2.5 w-2.5 rounded-full border border-white", statusColor(partnerStatus))} />
                ) : null}
              </button>
            );
          })}
        </div>
      </CardContent>

      <Sheet open={!!selectedDay} onOpenChange={(open) => (!open ? setSelectedDay(null) : null)}>
        <SheetContent side="bottom" className="max-h-[80vh] rounded-t-xl border-landing-clay">
          {selectedDay ? (
            <div className="space-y-4">
              <SheetHeader>
                <SheetTitle>{new Date(selectedDay.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</SheetTitle>
                <SheetDescription>Task completion snapshot for this day.</SheetDescription>
              </SheetHeader>

              <DayActorCard title="You" actor={selectedDay.user} />

              {showPartnerComparison && selectedDay.partner ? (
                <DayActorCard title={data.partnerName || "Partner"} actor={selectedDay.partner} />
              ) : null}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </Card>
  );
}
