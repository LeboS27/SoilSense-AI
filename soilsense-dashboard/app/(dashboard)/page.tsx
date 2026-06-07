"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Cpu, Users, Activity, AlertTriangle, WifiOff, DollarSign } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeReadings } from "@/hooks/useRealtimeReadings";
import { useDeviceStatus } from "@/hooks/useDeviceStatus";
import { useDashboardStore } from "@/store/dashboard";
import { Card } from "@/components/ui/Card";
import { StatCard, StatCardSkeleton } from "@/components/dashboard/StatCard";
import { RecentReadingsTable } from "@/components/dashboard/RecentReadingsTable";
import { AlertsBanner, type AlertListItem } from "@/components/dashboard/AlertsBanner";
import { NetworkMapWidget } from "@/components/dashboard/NetworkMapWidget";
import { NPKBarChart, type CropAverages } from "@/components/charts/NPKBarChart";
import { ReadingsOverTimeChart, type DailyReadingCount } from "@/components/charts/ReadingsOverTimeChart";
import { formatCurrency, formatDate, startOfTodayZimbabwe } from "@/lib/utils";
import { resolveCropKey } from "@/lib/soil-thresholds";
import { cropLabel, type AIRecommendation, type ReadingWithRelations } from "@/types";
import type { MapPlotMarker } from "@/components/map/FarmerMap";
import { getOverallStatus } from "@/lib/soil-thresholds";

interface OverviewStats {
  activeDevices: number;
  totalDevices: number;
  enrolledFarmers: number;
  readingsToday: number;
  pendingAlerts: number;
  offlineSyncsPending: number;
  mrr: number;
}

async function fetchOverviewStats(): Promise<OverviewStats> {
  const supabase = createClient();
  const todayStart = startOfTodayZimbabwe();
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: activeDevices },
    { count: totalDevices },
    { count: enrolledFarmers },
    { count: readingsToday },
    { data: recentRecs },
    { data: deployedDevices },
  ] = await Promise.all([
    supabase.from("devices").select("id", { count: "exact", head: true }).eq("status", "deployed"),
    supabase.from("devices").select("id", { count: "exact", head: true }),
    supabase.from("farmers").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("soil_readings").select("id", { count: "exact", head: true }).gte("reading_taken_at", todayStart),
    supabase.from("ai_recommendations").select("id, alerts").gte("created_at", last24h),
    supabase.from("devices").select("offline_readings_count").eq("status", "deployed"),
  ]);

  const pendingAlerts = (recentRecs ?? []).filter((r) => Array.isArray(r.alerts) && (r.alerts as unknown[]).length > 0).length;
  const offlineSyncsPending = (deployedDevices ?? []).reduce((sum, d) => sum + (d.offline_readings_count ?? 0), 0);

  return {
    activeDevices: activeDevices ?? 0,
    totalDevices: totalDevices ?? 0,
    enrolledFarmers: enrolledFarmers ?? 0,
    readingsToday: readingsToday ?? 0,
    pendingAlerts,
    offlineSyncsPending,
    mrr: (enrolledFarmers ?? 0) * 5,
  };
}

async function fetchLatestReadings(): Promise<ReadingWithRelations[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("soil_readings")
    .select(
      "*, farmer:farmers(id, full_name, phone_number, language), plot:plots(id, plot_name, crop, crop_other, growth_stage), device:devices(id, serial_number)"
    )
    .order("reading_taken_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data ?? []) as unknown as ReadingWithRelations[];
}

async function fetchActiveAlerts(): Promise<AlertListItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ai_recommendations")
    .select("*, farmer:farmers(full_name), plot:plots(crop_other)")
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) throw error;

  const rows = (data ?? []) as unknown as (AIRecommendation & {
    farmer?: { full_name?: string } | null;
    plot?: { crop_other?: string } | null;
  })[];

  const withAlerts = rows.filter((r) => Array.isArray(r.alerts) && (r.alerts as unknown[]).length > 0).slice(0, 5);

  return withAlerts.map((r) => ({
    ...r,
    farmer_name: r.farmer?.full_name ?? null,
    crop_other: r.plot?.crop_other ?? null,
  })) as unknown as AlertListItem[];
}

async function fetchCropAverages(): Promise<CropAverages[]> {
  const supabase = createClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("soil_readings")
    .select("nitrogen_mg_kg, phosphorus_mg_kg, potassium_mg_kg, plot:plots(crop)")
    .gte("reading_taken_at", since);
  if (error) throw error;

  const rows = (data ?? []) as unknown as {
    nitrogen_mg_kg: number | null;
    phosphorus_mg_kg: number | null;
    potassium_mg_kg: number | null;
    plot?: { crop?: string } | null;
  }[];

  const groups = new Map<string, { n: number[]; p: number[]; k: number[] }>();
  for (const row of rows) {
    const crop = row.plot?.crop ?? "other";
    if (!groups.has(crop)) groups.set(crop, { n: [], p: [], k: [] });
    const g = groups.get(crop)!;
    if (row.nitrogen_mg_kg != null) g.n.push(row.nitrogen_mg_kg);
    if (row.phosphorus_mg_kg != null) g.p.push(row.phosphorus_mg_kg);
    if (row.potassium_mg_kg != null) g.k.push(row.potassium_mg_kg);
  }

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

  return Array.from(groups.entries()).map(([crop, g]) => ({
    crop: cropLabel(crop),
    nitrogen: Math.round(avg(g.n) * 10) / 10,
    phosphorus: Math.round(avg(g.p) * 10) / 10,
    potassium: Math.round(avg(g.k) * 10) / 10,
  }));
}

async function fetchMapMarkers(): Promise<MapPlotMarker[]> {
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

async function fetchReadingsOverTime(): Promise<DailyReadingCount[]> {
  const supabase = createClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const { data, error } = await supabase
    .from("soil_readings")
    .select("reading_taken_at, was_offline_sync")
    .gte("reading_taken_at", since.toISOString());
  if (error) throw error;

  const buckets = new Map<string, { total: number; offline: number; date: Date }>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { total: 0, offline: 0, date: d });
  }

  for (const row of data ?? []) {
    const key = row.reading_taken_at.slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.total += 1;
    if (row.was_offline_sync) bucket.offline += 1;
  }

  return Array.from(buckets.entries()).map(([, b]) => ({
    date: formatDate(b.date),
    total: b.total,
    offline: b.offline,
  }));
}

export default function OverviewPage() {
  const [flashIds, setFlashIds] = useState<string[]>([]);
  const setUnreadAlerts = useDashboardStore((s) => s.setUnreadAlerts);

  const stats = useSWR("overview-stats", fetchOverviewStats, { refreshInterval: 60000 });
  const readings = useSWR("overview-latest-readings", fetchLatestReadings, { refreshInterval: 30000 });
  const alerts = useSWR("overview-active-alerts", fetchActiveAlerts, { refreshInterval: 60000 });
  const cropAverages = useSWR("overview-crop-averages", fetchCropAverages, { refreshInterval: 5 * 60000 });
  const mapMarkers = useSWR("overview-map-markers", fetchMapMarkers, { refreshInterval: 5 * 60000 });
  const readingsOverTime = useSWR("overview-readings-over-time", fetchReadingsOverTime, { refreshInterval: 5 * 60000 });

  useDeviceStatus();

  const handleInsert = useCallback(
    (reading: ReadingWithRelations) => {
      readings.mutate((current) => (current ? [reading, ...current].slice(0, 10) : [reading]), { revalidate: false });
      stats.mutate();
      setFlashIds((ids) => [reading.id, ...ids].slice(0, 5));
      setTimeout(() => setFlashIds((ids) => ids.filter((id) => id !== reading.id)), 1200);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useRealtimeReadings({ onInsert: handleInsert });

  useEffect(() => {
    if (stats.data) setUnreadAlerts(stats.data.pendingAlerts);
  }, [stats.data, setUnreadAlerts]);

  const statCards = useMemo(
    () => [
      {
        label: "Active Devices",
        value: stats.data?.activeDevices ?? 0,
        subtitle: `of ${stats.data?.totalDevices ?? 0} total`,
        icon: Cpu,
        tone: "primary" as const,
        href: "/devices",
      },
      {
        label: "Farmers Enrolled",
        value: stats.data?.enrolledFarmers ?? 0,
        icon: Users,
        tone: "primary" as const,
        href: "/farmers",
      },
      {
        label: "Readings Today",
        value: stats.data?.readingsToday ?? 0,
        icon: Activity,
        tone: "gold" as const,
        href: "/readings",
      },
      {
        label: "Pending Alerts",
        value: stats.data?.pendingAlerts ?? 0,
        subtitle: "last 24 hours",
        icon: AlertTriangle,
        tone: "red" as const,
        href: "/recommendations?alerts=true",
      },
      {
        label: "Offline Syncs Pending",
        value: stats.data?.offlineSyncsPending ?? 0,
        icon: WifiOff,
        tone: "orange" as const,
        href: "/devices",
      },
      {
        label: "MRR",
        value: formatCurrency(stats.data?.mrr ?? 0),
        subtitle: "rental only",
        icon: DollarSign,
        tone: "primary" as const,
        href: "/revenue",
      },
    ],
    [stats.data]
  );

  return (
    <div className="space-y-6">
      {/* ROW 1 — Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.isLoading
          ? Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statCards.map((card) => <StatCard key={card.label} {...card} />)}
      </div>

      {/* ROW 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="Latest Soil Readings">
            <RecentReadingsTable
              readings={readings.data ?? []}
              loading={readings.isLoading}
              error={readings.error?.message}
              onRetry={() => readings.mutate()}
              flashIds={flashIds}
            />
          </Card>
        </div>
        <div>
          <Card title="Active Alerts">
            <AlertsBanner
              items={alerts.data ?? []}
              loading={alerts.isLoading}
              error={alerts.error?.message}
              onRetry={() => alerts.mutate()}
            />
          </Card>
        </div>
      </div>

      {/* ROW 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Soil Health by Crop">
          <p className="text-xs text-ink-grey -mt-2 mb-2">Average N / P / K over the last 30 days</p>
          <NPKBarChart
            data={cropAverages.data ?? []}
            loading={cropAverages.isLoading}
            error={cropAverages.error?.message}
            onRetry={() => cropAverages.mutate()}
          />
        </Card>
        <Card title="Network Map Preview" className="overflow-hidden">
          <NetworkMapWidget
            markers={mapMarkers.data ?? []}
            loading={mapMarkers.isLoading}
            error={mapMarkers.error?.message}
            onRetry={() => mapMarkers.mutate()}
          />
        </Card>
      </div>

      {/* ROW 4 */}
      <Card title="Readings Over Time">
        <p className="text-xs text-ink-grey -mt-2 mb-2">Daily reading counts over the last 30 days</p>
        <ReadingsOverTimeChart
          data={readingsOverTime.data ?? []}
          loading={readingsOverTime.isLoading}
          error={readingsOverTime.error?.message}
          onRetry={() => readingsOverTime.mutate()}
        />
      </Card>
    </div>
  );
}
