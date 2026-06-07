import Link from "next/link";
import { Cpu, Battery, Signal, RefreshCw } from "lucide-react";
import { DeviceStatusBadge } from "@/components/devices/DeviceStatusBadge";
import { timeAgo, cn } from "@/lib/utils";
import type { Device } from "@/types";

export interface DeviceCardData extends Device {
  farmerName: string | null;
}

export function DeviceCard({ device }: { device: DeviceCardData }) {
  return (
    <Link href={`/devices/${device.id}`} className="card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0">
            <Cpu className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-ink-dark truncate">{device.serial_number}</p>
            <p className="text-xs text-ink-grey truncate">{device.farmerName ?? "Unassigned"}</p>
          </div>
        </div>
        <DeviceStatusBadge status={device.status} />
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-xs border-t border-gray-100 pt-3">
        <div className="flex flex-col items-center gap-1">
          <Battery className={cn("h-4 w-4", (device.battery_level ?? 0) < 20 ? "text-alert-red" : "text-ink-grey")} />
          <p className="font-medium text-ink-dark">{device.battery_level != null ? `${device.battery_level}%` : "—"}</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Signal className="h-4 w-4 text-ink-grey" />
          <p className="font-medium text-ink-dark">{device.signal_strength != null ? `${device.signal_strength}%` : "—"}</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <RefreshCw className="h-4 w-4 text-ink-grey" />
          <p className="font-medium text-ink-dark">{device.last_sync_at ? timeAgo(device.last_sync_at) : "Never"}</p>
        </div>
      </div>

      {device.offline_readings_count > 0 && (
        <p className="text-xs text-alert-orange font-medium">{device.offline_readings_count} offline readings pending sync</p>
      )}
    </Link>
  );
}

export function DeviceCardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="skeleton h-11 w-11 rounded-lg" />
        <div className="space-y-2 flex-1">
          <div className="skeleton h-4 w-2/3" />
          <div className="skeleton h-3 w-1/2" />
        </div>
      </div>
      <div className="skeleton h-10 w-full" />
    </div>
  );
}
