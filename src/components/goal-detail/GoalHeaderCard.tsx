"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Target } from "lucide-react";
import { DomainGoal } from "../../../packages/domain/src/goals";

export default function GoalHeaderCard({
  goal,
  archetype,
  completedCount,
  progressModel,
  onBack,
}: {
  goal: DomainGoal;
  archetype: string;
  completedCount: number;
  progressModel: any;
  onBack: () => void;
}) {
  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-border bg-card sm:mb-5">
      <div className="border-b border-border p-4 sm:p-5">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            onClick={onBack}
            className="mr-1 hidden rounded-lg p-1.5 transition-colors hover:bg-background sm:inline-flex sm:-ml-1.5"
          >
            <ArrowLeft className="h-4.5 w-4.5 text-muted-foreground" />
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sand">
            <Target className="h-4.5 w-4.5 text-espresso" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-foreground">{goal.name}</h2>
            <p className="text-xs text-muted-foreground">{goal.category}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5 pl-[2.75rem] sm:gap-2 sm:pl-[3.25rem]">
          <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-espresso sm:px-2.5">
            <Target className="h-3 w-3" />
            {archetype.replace("_", " ")}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-espresso sm:px-2.5">
            {goal.accountabilityType?.replace("_", " ") || "Task Completion"}
          </span>
        </div>
      </div>

      <div className="p-4 sm:px-5 sm:py-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-medium">{progressModel.title}</span>
          <span>
            {completedCount}/{goal.tasks.length} tasks completed
          </span>
        </div>

        {goal.aiPlan?.milestones && goal.aiPlan.milestones.length > 0 ? (
          <>
            <div className="mt-2.5 flex h-2.5 overflow-hidden rounded-full bg-sand">
              {goal.aiPlan.milestones.map((milestone, i) => {
                const colors = [
                  "bg-amber-400",
                  "bg-orange-400",
                  "bg-rose-400",
                  "bg-emerald-400",
                  "bg-sky-400",
                ];
                const totalWeight =
                  goal.aiPlan!.milestones.reduce(
                    (s, m) => s + (m.progress_weight || 0),
                    0
                  ) || 100;
                return (
                  <div
                    key={i}
                    className={`${colors[i % colors.length]} transition-all`}
                    style={{
                      width: `${(milestone.progress_weight / totalWeight) * 100}%`,
                    }}
                    title={`${milestone.name} (${milestone.progress_weight}%)`}
                  />
                );
              })}
            </div>
            <div className="mt-2 flex justify-between">
              {goal.aiPlan.milestones.map((m, i) => (
                <span
                  key={i}
                  className="text-[10px] font-medium text-muted-foreground"
                >
                  {m.progress_weight}%
                </span>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mt-2.5 flex h-2.5 overflow-hidden rounded-full bg-sand">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressModel.percent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all"
              />
            </div>
            <div className="mt-2 flex justify-between">
              <span className="text-[10px] text-muted-foreground">
                {progressModel.helper}
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground">
                {Math.round(progressModel.percent)}%
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
