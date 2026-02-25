"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Repeat,
  Trophy,
} from "lucide-react";
import { DomainGoal } from "../../../packages/domain/src/goals";
import { resolveVerificationMode } from "./utils";

export default function FullPlanTab({
  goal,
  collapsedMilestones,
  onToggleMilestone,
}: {
  goal: DomainGoal;
  collapsedMilestones: Record<number, boolean>;
  onToggleMilestone: (idx: number) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-border bg-card"
    >
      <div className="border-b border-border p-4 sm:px-5 sm:py-4">
        <h2 className="text-sm font-bold text-foreground">Full Plan</h2>
      </div>
      <div className="space-y-0">
        {goal.aiPlan?.milestones &&
        goal.aiPlan.milestones.reduce((acc, m) => acc + (m.task_count || 0), 0) ===
          goal.tasks.length
          ? goal.aiPlan.milestones.map((milestone, mIdx) => {
              const pastTasksCount = goal.aiPlan!.milestones
                .slice(0, mIdx)
                .reduce((acc, m) => acc + (m.task_count || 0), 0);
              const milestoneTasks = goal.tasks.slice(
                pastTasksCount,
                pastTasksCount + (milestone.task_count || 0)
              );
              const isCollapsed = collapsedMilestones[mIdx];

              return (
                <motion.div
                  key={mIdx}
                  className="border-b border-border last:border-b-0"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: mIdx * 0.08, duration: 0.3 }}
                >
                  <button
                    type="button"
                    onClick={() => onToggleMilestone(mIdx)}
                    className="flex w-full items-start gap-2 p-4 text-left transition-colors hover:bg-background/50 sm:gap-3 sm:px-5 sm:pb-2 sm:pt-4"
                  >
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sand sm:h-7 sm:w-7">
                      <Trophy className="h-3 w-3 text-espresso sm:h-3.5 sm:w-3.5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-foreground">
                          {milestone.name}
                        </h3>
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground sm:gap-2 sm:text-xs">
                          Wk {milestone.target_week}
                          {isCollapsed ? (
                            <ChevronRight className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted-foreground sm:line-clamp-none">
                        {milestone.description}
                      </p>
                    </div>
                  </button>

                  <AnimatePresence>
                    {!isCollapsed ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pl-9 pt-0 sm:px-5 sm:pb-4 sm:pl-14">
                          <div className="space-y-2">
                            {milestoneTasks.map((task) => (
                              <div
                                key={task.id}
                                className="rounded-lg border border-border/50 bg-background/50 px-3 py-2.5 transition-colors hover:bg-background/80"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2.5">
                                    <div
                                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                        task.status === "completed"
                                          ? "border-emerald-500 bg-emerald-500"
                                          : "border-taupe/40 bg-transparent"
                                      }`}
                                    >
                                      {task.status === "completed" ? (
                                        <CheckCircle2 className="h-3 w-3 text-white" />
                                      ) : null}
                                    </div>
                                    <div>
                                      <p
                                        className={`text-xs font-semibold ${
                                          task.status === "completed"
                                            ? "line-through text-emerald-700/70 dark:text-emerald-400/50"
                                            : "text-foreground"
                                        }`}
                                      >
                                        {task.name}
                                      </p>
                                      {task.description ? (
                                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                                          {task.description}
                                        </p>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                                <div className="ml-6 mt-2 flex flex-wrap gap-1.5">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-sand/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-espresso">
                                    {task.status}
                                  </span>
                                  {task.repeat_frequency ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-sand/60 px-2 py-0.5 text-[10px] font-medium capitalize text-espresso">
                                      <Repeat className="h-2.5 w-2.5" />
                                      {task.repeat_frequency.replace(
                                        "biweekly",
                                        "every 2 weeks"
                                      )}
                                    </span>
                                  ) : null}
                                  {task.cadenceDays && task.cadenceDays.length > 0 ? (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-sand/60 px-2 py-0.5 text-[10px] font-medium capitalize text-espresso">
                                      <Calendar className="h-2.5 w-2.5" />
                                      {task.cadenceDays
                                        .map(
                                          (d: string) =>
                                            d.charAt(0).toUpperCase() + d.slice(1)
                                        )
                                        .join(", ")}
                                    </span>
                                  ) : null}
                                  <span className="inline-flex items-center gap-1 rounded-full bg-sand/60 px-2 py-0.5 text-[10px] font-medium text-espresso">
                                    <Clock className="h-2.5 w-2.5" />
                                    {task.timeWindowDurationMinutes || 60}min
                                  </span>
                                  <span className="inline-flex items-center rounded-full bg-sand/60 px-2 py-0.5 text-[10px] font-medium capitalize text-espresso">
                                    {resolveVerificationMode(
                                      task,
                                      goal.accountabilityType || undefined
                                    ).replace("_", " ")}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.div>
              );
            })
          : (
            <div className="space-y-2 p-4 sm:px-5 sm:py-4">
              {goal.tasks.map((task, tIdx) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(tIdx * 0.03, 0.3) }}
                  className="rounded-xl border border-border/50 bg-background/50 px-3 py-2.5 transition-colors hover:bg-background/80"
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                        task.status === "completed"
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-taupe/40 bg-transparent"
                      }`}
                    >
                      {task.status === "completed" ? (
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      ) : null}
                    </div>
                    <div>
                      <p
                        className={`text-xs font-semibold ${
                          task.status === "completed"
                            ? "line-through text-emerald-700/70 dark:text-emerald-400/50"
                            : "text-foreground"
                        }`}
                      >
                        {task.name}
                      </p>
                      {task.description ? (
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {task.description}
                        </p>
                      ) : null}
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-sand/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-espresso">
                          {task.status}
                        </span>
                        {task.repeat_frequency ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-sand/60 px-2 py-0.5 text-[10px] font-medium capitalize text-espresso">
                            <Repeat className="h-2.5 w-2.5" />
                            {task.repeat_frequency.replace(
                              "biweekly",
                              "every 2 weeks"
                            )}
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1 rounded-full bg-sand/60 px-2 py-0.5 text-[10px] font-medium capitalize text-espresso">
                          {resolveVerificationMode(
                            task,
                            goal.accountabilityType || undefined
                          ).replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
      </div>
    </motion.div>
  );
}
