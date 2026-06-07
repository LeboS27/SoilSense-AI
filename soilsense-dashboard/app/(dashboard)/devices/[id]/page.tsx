"use client";

import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import { ArrowLeft, Battery, Signal, RefreshCw, Cpu, Database } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ErrorCard, EmptyState } from "@/components/ui/StateViews";
import { SkeletonBlock, SkeletonCard } from "@/components/ui/LoadingSpinner";
import { DeviceStatusBadge } from "@/components/devices/DeviceStatusBadge";
import { useDeviceStatus } from "@/hooks/useDeviceStatus";
import { formatDateTime, timeAgo, cn } from "@/lib/utils";
import type { Device, Farmer, SoilReading } from "@/types";

interface DeviceDetailData {
  device: Device;
  farmer: Pick<Farmer, "id" | "full_name" | "phone_number"> | null;
  recentReadings: SoilReading[];
}

async function fetchDeviceDetail(id: string): Promise<DeviceDetailData> {
  const supabase = createClient();
  const { data: device, error: deviceError } = await supabase.from("devices").select("*").eq("id", id).single();
  if (deviceError || !device) throw deviceError ?? new Error("Device not found");

  let farmer: Pick<Farmer, "id" | "full_name" | "phone_number"> | null = null;
  if (device.farmer_id) {
    const { data } = await supabase.from("farmers").select("id, full_name, phone_number").eq("id", device.farmer_id).maybeSingle();
    farmer = data ?? null;
  }

  const { data: readings } = await supabase
    .from("soil_readings")
    .select("*")
    .eq("device_id", id)
    .order("reading_taken_at", { ascending: false })
    .limit(10);

  return { device, farmer, recentReadings: readings ?? [] };
}

export default function DeviceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const deviceId = params.id;

  useDeviceStatus();

  const { data, error, isLoading, mutate } = useSWR(deviceId ? ["device-detail", deviceId] : null, () => fetchDeviceDetail(deviceId));

  if (isLoading) {
    return (
      <div className="space-y-5">
        <SkeletonBlock className="h-8 w-40" />
        <SkeletonCard className="h-32" />
        <SkeletonCard className="h-64" />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorCard message={error instanceof Error ? error.message : "Device not found"} onRetry={() => mutate()} />;
  }

  const { device, farmer, recentReadings } = data;

  return (
    <div className="space-y-5">
      <button onClick={() => router.push("/devices")} className="inline-flex items-center gap-1.5 text-sm text-ink-grey hover:text-ink-dark">
        <ArrowLeft className="h-4 w-4" />
        Back to Devices
      </button>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-lg bg-primary-light text-primary flex items-center justify-center">
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-ink-dark">{device.serial_number}</h2>
              <DeviceStatusBadge status={device.status} />
            </div>
            <p className="text-sm text-ink-grey">
              {farmer ? (
                <>Assigned to <Link href={`/farmers/${farmer.id}`} className="text-primary hover:underline">{farmer.full_name}</Link></>
              ) : (
                "Unassigned"
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatTile icon={<Battery className="h-4 w-4" />} label="Battery" value={device.battery_level != null ? `${device.battery_level}%` : "—"} alert={(device.battery_level ?? 100) < 20} />
        <StatTile icon={<Signal className="h-4 w-4" />} label="Signal" value={device.signal_strength != null ? `${device.signal_strength}%` : "—"} />
        <StatTile icon={<RefreshCw className="h-4 w-4" />} label="Last Sync" value={device.last_sync_at ? timeAgo(device.last_sync_at) : "Never"} />
        <StatTile icon={<Database className="h-4 w-4" />} label="Offline Readings" value={String(device.offline_readings_count)} alert={device.offline_readings_count > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Device Info">
          <dl className="space-y-3 text-sm">
            <Row label="Serial Number" value={device.serial_number} />
            <Row label="Firmware Version" value={device.firmware_version ?? "—"} />
            <Row label="Status" value={<DeviceStatusBadge status={device.status} />} />
            <Row label="Deployed" value={device.deployed_at ? formatDateTime(device.deployed_at) : "Not deployed"} />
            <Row label="Notes" value={device.notes ?? "—"} />
          </dl>
        </Card>

        <Card title="Recent Readings">
          {recentReadings.length === 0 ? (
            <EmptyState title="No readings yet" description="Readings synced from this device will appear here." className="h-[180px]" />
          ) : (
            <div className="space-y-2">
              {recentReadings.map((r) => (
                <Link
                  key={r.id}
                  href={`/readings/${r.id}`}
                  className="flex items-center justify-between border border-gray-100 rounded-lg p-3 text-sm hover:border-primary transition-colors"
                >
                  <span className="text-ink-dark">{formatDateTime(r.reading_taken_at)}</span>
                  {r.was_offline_sync && <Badge tone="orange">Offline sync</Badge>}
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatTile({ icon, label, value, alert }: { icon: React.ReactNode; label: string; value: string; alert?: boolean }) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", alert ? "bg-red-100 text-alert-red" : "bg-primary-light text-primary")}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-ink-grey">{label}</p>
        <p className={cn("font-semibold", alert ? "text-alert-red" : "text-ink-dark")}>{value}</p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-ink-grey">{label}</dt>
      <dd className="font-medium text-ink-dark text-right">{value}</dd>
    </div>
  );
}
