"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AchievementItem } from "@/lib/progress/types";

type AchievementPanelProps = {
  achievements: AchievementItem[];
};

export default function AchievementPanel({ achievements }: AchievementPanelProps) {
  return (
    <Card id="achievements" className="border-landing-clay">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-landing-espresso">Achievements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`rounded-xl border p-3 ${
              achievement.earned ? "border-emerald-200 bg-emerald-50" : "border-landing-clay bg-landing-cream"
            }`}
          >
            <p className="text-sm font-semibold text-landing-espresso">
              {achievement.title} {achievement.earned ? "Unlocked" : "Locked"}
            </p>
            <p className="text-xs text-landing-espresso-light">{achievement.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

