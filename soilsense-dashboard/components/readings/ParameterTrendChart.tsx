"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SkeletonBlock } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/StateViews";
import { formatDateTime } from "@/lib/utils";
import type { SoilReading } from "@/types";

interface SeriesDef {
  key: keyof SoilReading;
  label: string;
  colour: string;
}

const SERIES: SeriesDef[] = [
  { key: "nitrogen_mg_kg", label: "Nitrogen (mg/kg)", colour: "#1A6B3A" },
  { key: "phosphorus_mg_kg", label: "Phosphorus (mg/kg)", colour: "#F5A623" },
  { key: "potassium_mg_kg", label: "Potassium (mg/kg)", colour: "#1565C0" },
  { key: "ph", label: "pH", colour: "#7C3AED" },
  { key: "electrical_conductivity_ds_m", label: "EC (dS/m)", colour: "#DB2777" },
  { key: "moisture_percent", label: "Moisture (%)", colour: "#0891B2" },
  { key: "temperature_celsius", label: "Temperature (°C)", colour: "#D32F2F" },
];

export function ParameterTrendChart({
  readings,
  loading,
  title = "Parameter Trends",
}: {
  readings: SoilReading[];
  loading?: boolean;
  title?: string;
}) {
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SERIES.map((s) => [s.key, true]))
  );

  if (loading) return <SkeletonBlock className="h-[320px]" />;
  if (readings.length === 0) {
    return <EmptyState title="No readings to chart" description="Trends will appear once there is reading history for this plot." className="h-[280px]" />;
  }

  const chronological = [...readings].reverse();
  const data = chronological.map((r) => ({
    date: formatDateTime(r.reading_taken_at),
    nitrogen_mg_kg: r.nitrogen_mg_kg,
    phosphorus_mg_kg: r.phosphorus_mg_kg,
    potassium_mg_kg: r.potassium_mg_kg,
    ph: r.ph,
    electrical_conductivity_ds_m: r.electrical_conductivity_ds_m,
    moisture_percent: r.moisture_percent,
    temperature_celsius: r.temperature_celsius,
  }));

  return (
    <div>
      {title && <p className="text-sm font-medium text-ink-dark mb-2">{title}</p>}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3">
        {SERIES.map((s) => (
          <label key={s.key} className="inline-flex items-center gap-1.5 text-xs text-ink-grey cursor-pointer select-none">
            <input
              type="checkbox"
              checked={enabled[s.key]}
              onChange={() => setEnabled((e) => ({ ...e, [s.key]: !e[s.key] }))}
              className="accent-current"
              style={{ accentColor: s.colour }}
            />
            <span style={{ color: s.colour }} className="font-medium">
              {s.label}
            </span>
          </label>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#555" }} />
          <YAxis tick={{ fontSize: 11, fill: "#555" }} />
          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 12 }} />
          {SERIES.filter((s) => enabled[s.key]).map((s) => (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.colour} strokeWidth={2} dot={{ r: 2 }} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
