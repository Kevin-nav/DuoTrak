"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GoalBreakdownItem } from "@/lib/progress/types";

type GoalProgressTableProps = {
  goals: GoalBreakdownItem[];
};

function statusLabel(status: GoalBreakdownItem["status"]): string {
  if (status === "completed") return "Completed";
  if (status === "on_track") return "On Track";
  return "At Risk";
}

export default function GoalProgressTable({ goals }: GoalProgressTableProps) {
  return (
    <Card className="hidden border-landing-clay lg:block">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-landing-espresso">Goal Progress</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-landing-clay text-landing-espresso-light">
              <th className="pb-2">Goal</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Completed</th>
              <th className="pb-2">Rate</th>
            </tr>
          </thead>
          <tbody>
            {goals.map((goal) => (
              <tr key={goal.goalId} className="border-b border-landing-clay/40 text-landing-espresso">
                <td className="py-3 font-medium">{goal.goalName}</td>
                <td className="py-3">{statusLabel(goal.status)}</td>
                <td className="py-3">
                  {goal.completed}/{goal.total}
                </td>
                <td className="py-3">{goal.completionRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

