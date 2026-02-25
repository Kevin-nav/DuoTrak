"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { GoalBreakdownItem } from "@/lib/progress/types";

type GoalProgressCardsProps = {
  goals: GoalBreakdownItem[];
};

function statusLabel(status: GoalBreakdownItem["status"]): string {
  if (status === "completed") return "Completed";
  if (status === "on_track") return "On Track";
  return "At Risk";
}

export default function GoalProgressCards({ goals }: GoalProgressCardsProps) {
  return (
    <div data-testid="goal-progress-cards" className="grid grid-cols-1 gap-3 lg:hidden">
      {goals.map((goal) => (
        <Card key={goal.goalId} className="border-landing-clay">
          <CardContent className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-landing-espresso">{goal.goalName}</p>
              <span className="rounded-full bg-landing-cream px-2 py-0.5 text-xs font-semibold text-landing-espresso">
                {statusLabel(goal.status)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-landing-cream">
              <div className="h-2 rounded-full bg-landing-terracotta" style={{ width: `${goal.completionRate}%` }} />
            </div>
            <div className="flex items-center justify-between text-xs text-landing-espresso-light">
              <span>
                {goal.completed}/{goal.total} completed
              </span>
              <span>{goal.completionRate}%</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

