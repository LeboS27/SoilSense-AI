"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Select";
import { ErrorCard, EmptyState } from "@/components/ui/StateViews";
import { DeviceCard, DeviceCardSkeleton, type DeviceCardData } from "@/components/devices/DeviceCard";
import { useDeviceStatus } from "@/hooks/useDeviceStatus";
import { cn } from "@/lib/utils";

const FILTER_CHIPS = [
  { value: "all", label: "All" },
  { value: "available", label: "Available" },
  { value: "deployed", label: "Deployed" },
  { value: "maintenance", label: "Maintenance" },
  { value: "retired", label: "Retired" },
];

async function fetchDevices(): Promise<DeviceCardData[]> {
  const supabase = createClient();
  const { data: devices, error } = await supabase.from("devices").select("*").order("created_at", { ascending: false });
  if (error) throw error;

  const farmerIds = (devices ?? []).map((d) => d.farmer_id).filter((id): id is string => !!id);
  let farmerNames: Record<string, string> = {};
  if (farmerIds.length > 0) {
    const { data: farmers } = await supabase.from("farmers").select("id, full_name").in("id", farmerIds);
    farmerNames = Object.fromEntries((farmers ?? []).map((f) => [f.id, f.full_name]));
  }

  return (devices ?? []).map((d) => ({ ...d, farmerName: d.farmer_id ? farmerNames[d.farmer_id] ?? null : null }));
}

export default function DevicesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useDeviceStatus();

  const { data, error, isLoading, mutate } = useSWR("devices-list", fetchDevices);

  const filtered = useMemo(() => {
    let result = data ?? [];
    if (statusFilter !== "all") result = result.filter((d) => d.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((d) => d.serial_number.toLowerCase().includes(q) || (d.farmerName ?? "").toLowerCase().includes(q));
    }
    return result;
  }, [data, statusFilter, search]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-ink-dark">Devices</h2>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-grey" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by serial number or farmer…" className="pl-9" />
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.value}
            onClick={() => setStatusFilter(chip.value)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors",
              statusFilter === chip.value ? "bg-primary text-white border-primary" : "bg-white text-ink-grey border-gray-300 hover:bg-gray-50"
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <DeviceCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <ErrorCard message={error.message} onRetry={() => mutate()} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No devices found" description="Try a different search term or status filter." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((device) => <DeviceCard key={device.id} device={device} />)}
        </div>
      )}
    </div>
  );
}
