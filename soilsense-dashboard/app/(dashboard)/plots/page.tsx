"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import useSWR from "swr";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { ErrorCard, EmptyState } from "@/components/ui/StateViews";
import { SkeletonBlock } from "@/components/ui/LoadingSpinner";
import { StatusPill } from "@/components/ui/StatusPill";
import { getOverallStatus } from "@/lib/soil-thresholds";
import { cropLabel } from "@/types";
import { cn } from "@/lib/utils";
import type { MapPlotMarker } from "@/components/map/FarmerMap";

const FarmerMap = dynamic(() => import("@/components/map/FarmerMap").then((m) => m.FarmerMap), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center"><SkeletonBlock className="h-full w-full" /></div>,
});

async function fetchPlotMarkers(): Promise<MapPlotMarker[]> {
  const supabase = createClient();

  const { data: plots, error } = await supabase
    .from("plots")
    .select("id, plot_name, crop, crop_other, latitude, longitude, farmer:farmers(id, full_name)")
    .not("latitude", "is", null)
    .not("longitude", "is", null);
  if (error) throw error;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const plotRows = (plots ?? []) as unknown as {
    id: string;
    plot_name: string;
    crop: string;
    crop_other: string | null;
    latitude: number | null;
    longitude: number | null;
    farmer?: { id: string; full_name: string } | null;
  }[];

  const markers: MapPlotMarker[] = [];
  for (const plot of plotRows) {
    const farmer = plot.farmer;
    if (!farmer || plot.latitude == null || plot.longitude == null) continue;

    const { data: latest } = await supabase
      .from("soil_readings")
      .select("id, ph, moisture_percent, nitrogen_mg_kg, phosphorus_mg_kg, potassium_mg_kg, electrical_conductivity_ds_m, reading_taken_at")
      .eq("plot_id", plot.id)
      .order("reading_taken_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const isStale = !latest || latest.reading_taken_at < sevenDaysAgo;

    markers.push({
      id: plot.id,
      farmerId: farmer.id,
      farmerName: farmer.full_name,
      plotName: plot.plot_name,
      crop: plot.crop,
      cropOther: plot.crop_other,
      latitude: Number(plot.latitude),
      longitude: Number(plot.longitude),
      status: isStale ? "stale" : getOverallStatus(latest, plot.crop),
      latestReadingId: latest?.id ?? null,
      ph: latest?.ph ?? null,
      moisture: latest?.moisture_percent ?? null,
      nitrogen: latest?.nitrogen_mg_kg ?? null,
    });
  }

  return markers;
}

export default function PlotMapPage() {
  const [alertsOnly, setAlertsOnly] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);

  const { data, error, isLoading, mutate } = useSWR("plot-map-markers", fetchPlotMarkers, { refreshInterval: 5 * 60000 });

  const filtered = useMemo(() => {
    const markers = data ?? [];
    if (!alertsOnly) return markers;
    return markers.filter((m) => m.status === "warning" || m.status === "critical");
  }, [data, alertsOnly]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-ink-dark">Plot Map</h2>
        <label className="inline-flex items-center gap-2 text-sm text-ink-dark cursor-pointer">
          <input type="checkbox" checked={alertsOnly} onChange={(e) => setAlertsOnly(e.target.checked)} className="accent-primary" />
          Alerts Only
        </label>
      </div>

      {error ? (
        <ErrorCard message={error.message} onRetry={() => mutate()} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
          <Card className="lg:max-h-[640px] lg:overflow-y-auto">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <SkeletonBlock key={i} className="h-16 w-full" />)}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState title="No plots to show" description={alertsOnly ? "No plots currently have alerts." : "Plots with location data will appear here."} className="h-[200px]" />
            ) : (
              <div className="space-y-2">
                {filtered.map((marker) => (
                  <button
                    key={marker.id}
                    onClick={() => setFocusId(marker.id)}
                    className={cn(
                      "w-full text-left border rounded-lg p-3 transition-colors",
                      focusId === marker.id ? "border-primary bg-primary-light/40" : "border-gray-100 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-ink-dark text-sm truncate">{marker.plotName}</p>
                      {marker.status === "stale" ? (
                        <span className="text-xs text-ink-grey">No recent data</span>
                      ) : (
                        <StatusPill status={marker.status} />
                      )}
                    </div>
                    <p className="text-xs text-ink-grey truncate">{marker.farmerName} · {cropLabel(marker.crop, marker.cropOther)}</p>
                    <Link
                      href={`/farmers/${marker.farmerId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                    >
                      <MapPin className="h-3 w-3" />
                      View farmer
                    </Link>
                  </button>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-0 overflow-hidden h-[420px] lg:h-[640px]">
            <FarmerMap markers={filtered} height="100%" zoom={9} focusId={focusId ?? undefined} className="h-full w-full" />
          </Card>
        </div>
      )}
    </div>
  );
}
