"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, CheckCircle2, Clock3, XCircle } from "lucide-react";

type FilterKey = "all" | "past" | "today" | "future";

export default function AllTasksTab({
  allInstances,
  todayStart,
  todayEnd,
}: {
  allInstances: any[];
  todayStart: number;
  todayEnd: number;
}) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const rows = useMemo(() => {
    const base = allInstances;
    return base.filter((row) => {
      if (filter === "all") return true;
      if (filter === "past") return row.instance_date < todayStart;
      if (filter === "today")
        return row.instance_date >= todayStart && row.instance_date <= todayEnd;
      return row.instance_date > todayEnd;
    });
  }, [allInstances, filter, todayStart, todayEnd]);

  const statusLabel = (row: any) => {
    if (row.status === "completed" || row.status === "verified") return "Completed";
    if (row.status === "pending-verification" || row.status === "pending_verification") return "Awaiting review";
    if (row.status === "missed" || row.status === "skipped" || row.status === "failed") return "Not completed";
    if (row.status === "rejected") return "Rejected";
    return "Pending";
  };

  const timestampLabel = (row: any) => {
    const ts = row.completed_at || row.verification_reviewed_at || row.verification_submitted_at;
    return ts ? new Date(ts).toLocaleString() : null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-border bg-card"
    >
      <div className="border-b border-border p-4 sm:px-5 sm:py-4">
        <h2 className="text-sm font-bold text-foreground">All Tasks Timeline</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {([
            ["all", "All"],
            ["past", "Past"],
            ["today", "Today"],
            ["future", "Future"],
          ] as Array<[FilterKey, string]>).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                filter === key
                  ? "bg-espresso text-white"
                  : "bg-sand/60 text-espresso"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 p-4 sm:px-5 sm:py-4">
        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 bg-background/30 px-4 py-3 text-center text-xs text-muted-foreground">
            No task instances in this range.
          </div>
        ) : (
          rows.map((row) => (
            <div
              key={row._id}
              className="rounded-xl border border-border/50 bg-background/50 px-3 py-2.5 transition-colors hover:bg-background/80"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">{row.task_name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {new Date(row.instance_date).toLocaleDateString()} - {statusLabel(row)}
                  </p>
                  {timestampLabel(row) ? (
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      Updated: {timestampLabel(row)}
                    </p>
                  ) : null}
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-sand/60 px-2 py-0.5 text-[10px] font-medium text-espresso">
                  {row.status === "completed" || row.status === "verified" ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : row.status === "missed" || row.status === "skipped" || row.status === "failed" ? (
                    <XCircle className="h-3 w-3" />
                  ) : row.status === "pending-verification" || row.status === "pending_verification" ? (
                    <CalendarClock className="h-3 w-3" />
                  ) : (
                    <Clock3 className="h-3 w-3" />
                  )}
                  {row.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
