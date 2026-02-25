"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProgressConsistencyPoint } from "@/lib/progress/types";
import { BarChart, Bar, CartesianGrid, Tooltip, XAxis, YAxis, ResponsiveContainer } from "recharts";

type ProgressConsistencyChartProps = {
  consistency: ProgressConsistencyPoint[];
};

export default function ProgressConsistencyChart({ consistency }: ProgressConsistencyChartProps) {
  const chartData = consistency.map((point) => ({
    week: point.weekLabel,
    completion: point.completionRate,
  }));

  return (
    <Card className="border-landing-clay">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-landing-espresso">Weekly Consistency</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="completion" fill="#3a89c9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

