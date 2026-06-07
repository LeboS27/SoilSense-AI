"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SkeletonBlock } from "@/components/ui/LoadingSpinner";
import { ErrorCard, EmptyState } from "@/components/ui/StateViews";

export interface CropAverages {
  crop: string;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
}

export function NPKBarChart({
  data,
  loading,
  error,
  onRetry,
}: {
  data: CropAverages[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  if (loading) return <SkeletonBlock className="h-[300px]" />;
  if (error) return <ErrorCard message={error} onRetry={onRetry} />;
  if (data.length === 0) {
    return <EmptyState title="No readings in the last 30 days" description="Soil health by crop will appear once readings come in." className="h-[300px]" />;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
        <XAxis dataKey="crop" tick={{ fontSize: 12, fill: "#555" }} />
        <YAxis tick={{ fontSize: 12, fill: "#555" }} label={{ value: "mg/kg", angle: -90, position: "insideLeft", fontSize: 12, fill: "#555" }} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13 }}
          formatter={(value: number) => [`${value.toFixed(1)} mg/kg`]}
        />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Bar dataKey="nitrogen" name="Nitrogen" fill="#1A6B3A" radius={[4, 4, 0, 0]} />
        <Bar dataKey="phosphorus" name="Phosphorus" fill="#F5A623" radius={[4, 4, 0, 0]} />
        <Bar dataKey="potassium" name="Potassium" fill="#1565C0" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
