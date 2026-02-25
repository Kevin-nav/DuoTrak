"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Mic,
  Target,
} from "lucide-react";
import { DomainGoal, DomainTask } from "../../../packages/domain/src/goals";
import { WeekGroup } from "./types";
import { actionLabelForMode, resolveVerificationMode } from "./utils";

export default function ThisWeekTab({
  goal,
  groupedWeekTasks,
  onTaskAction,
}: {
  goal: DomainGoal;
  groupedWeekTasks: WeekGroup[];
  onTaskAction: (task: DomainTask) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-border bg-card"
    >
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-bold text-foreground">Tasks This Week</h2>
      </div>

      <div className="space-y-0">
        {groupedWeekTasks.map((group) => (
          <div key={group.label} className="border-b border-border last:border-b-0">
            <div className="flex items-center gap-2 px-5 pb-2 pt-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {group.label}
              </h3>
              {group.label !== "TODAY" ? (
                <AlertCircle className="h-3 w-3 text-amber-500" />
              ) : null}
            </div>
            <div className="px-4 pb-4 sm:px-5">
              {group.tasks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 bg-background/30 px-4 py-3 text-center text-xs text-muted-foreground">
                  No tasks scheduled.
                </div>
              ) : (
                <div className="space-y-2">
                  {group.tasks.map((task, tIdx) => {
                    const mode = resolveVerificationMode(
                      task,
                      goal.accountabilityType || undefined
                    );
                    const isDone = task.status === "completed";
                    return (
                      <motion.div
                        key={task.id}
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
                                {task.name}
                              </p>
                            </div>
                          </div>

                          {!isDone ? (
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
                            60min
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
