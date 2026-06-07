"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SkeletonBlock } from "@/components/ui/LoadingSpinner";
import { ErrorCard, EmptyState } from "@/components/ui/StateViews";

export interface DailyReadingCount {
  date: string; // formatted label, e.g. "12 Jun"
  total: number;
  offline: number;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; dataKey: string }[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  const total = payload.find((p) => p.dataKey === "total")?.value ?? 0;
  const offline = payload.find((p) => p.dataKey === "offline")?.value ?? 0;
  const pct = total > 0 ? ((offline / total) * 100).toFixed(0) : "0";

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-semibold text-ink-dark mb-1">{label}</p>
      <p className="text-primary">Total readings: {total}</p>
      <p className="text-alert-orange">Offline syncs: {offline} ({pct}%)</p>
    </div>
  );
}

export function ReadingsOverTimeChart({
  data,
  loading,
  error,
  onRetry,
}: {
  data: DailyReadingCount[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  if (loading) return <SkeletonBlock className="h-[300px]" />;
  if (error) return <ErrorCard message={error} onRetry={onRetry} />;
  if (data.length === 0) {
    return <EmptyState title="No reading history yet" description="Daily reading counts will appear here once devices start syncing." className="h-[300px]" />;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
        <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#555" }} />
        <YAxis tick={{ fontSize: 12, fill: "#555" }} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Line type="monotone" dataKey="total" name="Total Readings" stroke="#1A6B3A" strokeWidth={2.5} dot={false} />
        <Line
          type="monotone"
          dataKey="offline"
          name="Offline Syncs"
          stroke="#F57C00"
          strokeWidth={2}
          strokeDasharray="6 4"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
