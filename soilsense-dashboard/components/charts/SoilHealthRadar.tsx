"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { EmptyState } from "@/components/ui/StateViews";
import { cn } from "@/lib/utils";

export interface RadarAxisValue {
  parameter: string;
  pctOfOptimal: number; // 0-100+, 100 = exactly mid-optimal
}

export function SoilHealthRadar({ data, averageScore }: { data: RadarAxisValue[]; averageScore: number }) {
  if (data.length === 0) {
    return <EmptyState title="No readings in the last 30 days" description="The soil health summary will appear once readings come in." className="h-[260px]" />;
  }

  const colour = averageScore >= 80 ? "#1A6B3A" : averageScore >= 50 ? "#F57C00" : "#D32F2F";
  const textColour = averageScore >= 80 ? "text-primary" : averageScore >= 50 ? "text-alert-orange" : "text-alert-red";

  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={data} outerRadius="75%">
          <PolarGrid stroke="#E5E7EB" />
          <PolarAngleAxis dataKey="parameter" tick={{ fontSize: 12, fill: "#555" }} />
          <Radar dataKey="pctOfOptimal" stroke={colour} fill={colour} fillOpacity={0.35} />
        </RadarChart>
      </ResponsiveContainer>
      <p className={cn("text-center text-sm font-medium", textColour)}>
        {averageScore}% of optimal range on average (last 30 days)
      </p>
    </div>
  );
}
