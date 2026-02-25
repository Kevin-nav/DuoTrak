"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Mic,
  Target,
} from "lucide-react";
import { actionLabelForMode, resolveVerificationMode } from "./utils";

export default function ThisWeekTab({
  weekStart,
  weekInstances,
  weekSummary,
  onTaskAction,
}: {
  weekStart: number;
  weekInstances: any[];
  weekSummary: {
    completed: number;
    awaitingReview: number;
    notCompleted: number;
    rejected: number;
    pending: number;
  };
  onTaskAction: (task: any) => void;
}) {
  const dayBuckets = (() => {
    const groups: Array<{ label: string; dateKey: number; tasks: any[]; isToday: boolean }> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i += 1) {
      const date = new Date(weekStart + i * 24 * 60 * 60 * 1000);
      const key = date.getTime();
      const label = date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
      groups.push({
        label: i === 0 ? `${label} (MON)` : label,
        dateKey: key,
        tasks: weekInstances.filter((task) => task.instance_date === key),
        isToday: key === today.getTime(),
      });
    }
    return groups;
  })();

  const statusBadge = (task: any) => {
    const status = String(task.status || "pending");
    if (status === "completed" || status === "verified") return "Completed";
    if (status === "pending-verification") return "Awaiting review";
    if (status === "rejected") return "Rejected";
    if (status === "missed" || status === "skipped" || status === "failed") return "Not completed";
    return "Pending";
  };

  const canAct = (task: any) => {
    const status = String(task.status || "pending");
    return status === "pending" || status === "rejected";
  };

  const activityTime = (task: any) => {
    const completedAt = task.completed_at || task.verification_reviewed_at || task.verification_submitted_at;
    if (!completedAt) return null;
    return new Date(completedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-border bg-card"
    >
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-bold text-foreground">Tasks This Week</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-sand/70 px-2 py-0.5 text-[10px] font-medium text-espresso">
            Completed {weekSummary.completed}
          </span>
          <span className="rounded-full bg-sand/70 px-2 py-0.5 text-[10px] font-medium text-espresso">
            Awaiting review {weekSummary.awaitingReview}
          </span>
          <span className="rounded-full bg-sand/70 px-2 py-0.5 text-[10px] font-medium text-espresso">
            Not completed {weekSummary.notCompleted}
          </span>
          <span className="rounded-full bg-sand/70 px-2 py-0.5 text-[10px] font-medium text-espresso">
            Pending {weekSummary.pending}
          </span>
        </div>
      </div>

      <div className="space-y-0">
        {dayBuckets.map((group) => (
          <div key={group.label} className="border-b border-border last:border-b-0">
            <div className="flex items-center gap-2 px-5 pb-2 pt-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {group.label}
              </h3>
              {!group.isToday ? (
                <AlertCircle className="h-3 w-3 text-amber-500" />
              ) : null}
            </div>
            <div className="px-4 pb-4 sm:px-5">
              {group.tasks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 bg-background/30 px-4 py-3 text-center text-xs text-muted-foreground">
                  No instances for this day.
                </div>
              ) : (
                <div className="space-y-2">
                  {group.tasks.map((task, tIdx) => {
                    const mode = resolveVerificationMode(
                      {
                        verificationMode: task.task_verification_mode,
                        accountabilityType: task.task_accountability_type,
                      } as any,
                      task.task_accountability_type || undefined
                    );
                    const isDone = task.status === "completed" || task.status === "verified";
                    return (
                      <motion.div
                        key={task._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: tIdx * 0.05, duration: 0.2 }}
                        className="rounded-xl border border-border/60 bg-background/50 px-3 py-2.5 transition-all hover:bg-background/80"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <div
                              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                isDone
                                  ? "border-emerald-500 bg-emerald-500"
                                  : "border-taupe/40 bg-transparent"
                              }`}
                            >
                              {isDone ? (
                                <CheckCircle2 className="h-3 w-3 text-white" />
                              ) : null}
                            </div>
                            <div>
                              <p
                                className={`text-xs font-semibold ${
                                  isDone
                                    ? "line-through text-emerald-700/70 dark:text-emerald-400/50"
                                    : "text-foreground"
                                }`}
                              >
                                {task.task_name}
                              </p>
                              <p className="mt-0.5 text-[10px] text-muted-foreground">
                                {statusBadge(task)}
                                {activityTime(task) ? ` - ${activityTime(task)}` : ""}
                              </p>
                            </div>
                          </div>

                          {canAct(task) ? (
                            <button
                              onClick={() => onTaskAction(task)}
                              className="shrink-0 rounded-md bg-sand px-2.5 py-1.5 text-[11px] font-bold text-espresso shadow-sm transition-colors hover:bg-sand/80"
                            >
                              {actionLabelForMode(mode)}
                            </button>
                          ) : null}
                        </div>
                        <div className="ml-[1.65rem] mt-2 flex flex-wrap gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-sand/60 px-2 py-0.5 text-[10px] font-medium text-espresso">
                            <Clock className="h-2.5 w-2.5" />
                            {task.task_time_window_duration_minutes || 60}min
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-sand/60 px-2 py-0.5 text-[10px] font-medium text-espresso">
                            {mode === "voice" ? (
                              <Mic className="h-2.5 w-2.5" />
                            ) : (
                              <Target className="h-2.5 w-2.5" />
                            )}
                            {mode.replace("_", " ")}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
