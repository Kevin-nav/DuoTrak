"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PartnerComparison, ProgressTrendPoint } from "@/lib/progress/types";
import { LineChart, Line, CartesianGrid, Tooltip, XAxis, YAxis, ResponsiveContainer, Legend } from "recharts";

type ProgressTrendChartProps = {
  trends: ProgressTrendPoint[];
  partnerComparison: PartnerComparison | null;
  showPartnerComparison: boolean;
};

export default function ProgressTrendChart({
  trends,
  partnerComparison,
  showPartnerComparison,
}: ProgressTrendChartProps) {
  const merged = trends.map((point, index) => ({
    label: point.label,
    you: point.completionRate,
    partner:
      showPartnerComparison && partnerComparison?.partnerTrends[index]
        ? partnerComparison.partnerTrends[index].completionRate
        : undefined,
  }));

  return (
    <Card className="border-landing-clay">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-landing-espresso">Daily Completion Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={merged} margin={{ top: 8, right: 8, bottom: 8, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" minTickGap={24} tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="you" stroke="#b85b3e" strokeWidth={2.5} dot={false} name="You" />
              {showPartnerComparison && partnerComparison ? (
                <Line
                  type="monotone"
                  dataKey="partner"
                  stroke="#1f6aa5"
                  strokeWidth={2}
                  dot={false}
                  name={partnerComparison.partnerName}
                />
              ) : null}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

