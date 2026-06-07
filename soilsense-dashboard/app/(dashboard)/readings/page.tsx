"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { Download, Map as MapIcon, WifiOff, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select, Input } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { StatusPill } from "@/components/ui/StatusPill";
import { DataTable, Pagination, type DataTableColumn } from "@/components/ui/DataTable";
import { SkeletonTable } from "@/components/ui/LoadingSpinner";
import { ErrorCard, EmptyState } from "@/components/ui/StateViews";
import { downloadCSV, formatDateTime, truncateId, cn } from "@/lib/utils";
import { getOverallStatus } from "@/lib/soil-thresholds";
import { CROP_OPTIONS, cropLabel, type ReadingWithRelations } from "@/types";

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: "good", label: "Good" },
  { value: "warning", label: "Warning" },
  { value: "critical", label: "Critical" },
];

interface FilterState {
  from: string;
  to: string;
  farmerId: string;
  crop: string;
  status: string;
  deviceId: string;
}

const EMPTY_FILTERS: FilterState = { from: "", to: "", farmerId: "", crop: "", status: "", deviceId: "" };

async function fetchFilterOptions() {
  const supabase = createClient();
  const [{ data: farmers }, { data: devices }] = await Promise.all([
    supabase.from("farmers").select("id, full_name").order("full_name"),
    supabase.from("devices").select("id, serial_number").order("serial_number"),
  ]);
  return { farmers: farmers ?? [], devices: devices ?? [] };
}

async function fetchReadings(filters: FilterState): Promise<ReadingWithRelations[]> {
  const supabase = createClient();
  let query = supabase
    .from("soil_readings")
    .select(
      "*, farmer:farmers(id, full_name, phone_number, language), plot:plots(id, plot_name, crop, crop_other, growth_stage), device:devices(id, serial_number)"
    )
    .order("reading_taken_at", { ascending: false })
    .limit(1000);

  if (filters.from) query = query.gte("reading_taken_at", new Date(filters.from).toISOString());
  if (filters.to) {
    const to = new Date(filters.to);
    to.setDate(to.getDate() + 1);
    query = query.lt("reading_taken_at", to.toISOString());
  }
  if (filters.farmerId) query = query.eq("farmer_id", filters.farmerId);
  if (filters.deviceId) query = query.eq("device_id", filters.deviceId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as ReadingWithRelations[];
}

type SortKey = "reading_taken_at" | "farmer" | "crop" | "status";

export default function ReadingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("reading_taken_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const farmerId = searchParams.get("farmer_id");
    if (farmerId) {
      setFilters((f) => ({ ...f, farmerId }));
      setAppliedFilters((f) => ({ ...f, farmerId }));
    }
  }, [searchParams]);

  const filterOptions = useSWR("readings-filter-options", fetchFilterOptions);
  const readings = useSWR(["readings", appliedFilters], () => fetchReadings(appliedFilters));

  const filtered = useMemo(() => {
    let data = readings.data ?? [];
    if (appliedFilters.crop) data = data.filter((r) => (r.plot?.crop ?? "") === appliedFilters.crop);
    if (appliedFilters.status) {
      data = data.filter((r) => getOverallStatus(r, r.plot?.crop ?? "maize") === appliedFilters.status);
    }
    return data;
  }, [readings.data, appliedFilters]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "reading_taken_at":
          cmp = new Date(a.reading_taken_at).getTime() - new Date(b.reading_taken_at).getTime();
          break;
        case "farmer":
          cmp = (a.farmer?.full_name ?? "").localeCompare(b.farmer?.full_name ?? "");
          break;
        case "crop":
          cmp = (a.plot?.crop ?? "").localeCompare(b.plot?.crop ?? "");
          break;
        case "status":
          cmp = getOverallStatus(a, a.plot?.crop ?? "maize").localeCompare(getOverallStatus(b, b.plot?.crop ?? "maize"));
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageData = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSort(key: string) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key as SortKey);
      setSortDir("desc");
    }
  }

  function applyFilters() {
    setAppliedFilters(filters);
    setPage(1);
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(1);
  }

  function handleExport() {
    downloadCSV(
      `soilsense-readings-${new Date().toISOString().slice(0, 10)}.csv`,
      sorted.map((r) => ({
        id: r.id,
        date: formatDateTime(r.reading_taken_at),
        farmer: r.farmer?.full_name ?? "",
        plot: r.plot?.plot_name ?? "",
        crop: cropLabel(r.plot?.crop ?? "", r.plot?.crop_other),
        nitrogen_mg_kg: r.nitrogen_mg_kg,
        phosphorus_mg_kg: r.phosphorus_mg_kg,
        potassium_mg_kg: r.potassium_mg_kg,
        ph: r.ph,
        ec_ds_m: r.electrical_conductivity_ds_m,
        moisture_percent: r.moisture_percent,
        temperature_celsius: r.temperature_celsius,
        status: getOverallStatus(r, r.plot?.crop ?? "maize"),
        offline_sync: r.was_offline_sync,
      }))
    );
  }

  const activeFilterPills: { label: string }[] = [];
  if (appliedFilters.from) activeFilterPills.push({ label: `From: ${appliedFilters.from}` });
  if (appliedFilters.to) activeFilterPills.push({ label: `To: ${appliedFilters.to}` });
  if (appliedFilters.farmerId) {
    const f = filterOptions.data?.farmers.find((x) => x.id === appliedFilters.farmerId);
    if (f) activeFilterPills.push({ label: `Farmer: ${f.full_name}` });
  }
  if (appliedFilters.crop) activeFilterPills.push({ label: `Crop: ${cropLabel(appliedFilters.crop)}` });
  if (appliedFilters.status) activeFilterPills.push({ label: `Status: ${appliedFilters.status}` });
  if (appliedFilters.deviceId) {
    const d = filterOptions.data?.devices.find((x) => x.id === appliedFilters.deviceId);
    if (d) activeFilterPills.push({ label: `Device: ${d.serial_number}` });
  }

  const columns: DataTableColumn<ReadingWithRelations>[] = [
    {
      key: "id",
      header: "ID",
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-grey">
          {r.was_offline_sync && <WifiOff className="h-3.5 w-3.5 text-alert-orange" />}
          {truncateId(r.id)}
        </span>
      ),
    },
    {
      key: "reading_taken_at",
      header: "Date & Time",
      sortable: true,
      render: (r) => formatDateTime(r.reading_taken_at),
    },
    { key: "farmer", header: "Farmer", sortable: true, render: (r) => <span className="font-medium text-ink-dark">{r.farmer?.full_name ?? "—"}</span> },
    { key: "plot", header: "Plot", render: (r) => r.plot?.plot_name ?? "—" },
    { key: "crop", header: "Crop", sortable: true, render: (r) => cropLabel(r.plot?.crop ?? "", r.plot?.crop_other) },
    { key: "n", header: "N", render: (r) => r.nitrogen_mg_kg ?? "—" },
    { key: "p", header: "P", render: (r) => r.phosphorus_mg_kg ?? "—" },
    { key: "k", header: "K", render: (r) => r.potassium_mg_kg ?? "—" },
    { key: "ph", header: "pH", render: (r) => r.ph ?? "—" },
    { key: "ec", header: "EC", render: (r) => r.electrical_conductivity_ds_m ?? "—" },
    { key: "moisture", header: "Moisture", render: (r) => (r.moisture_percent != null ? `${r.moisture_percent}%` : "—") },
    { key: "temp", header: "Temp", render: (r) => (r.temperature_celsius != null ? `${r.temperature_celsius}°C` : "—") },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (r) => <StatusPill status={getOverallStatus(r, r.plot?.crop ?? "maize")} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <button onClick={(e) => { e.stopPropagation(); router.push(`/readings/${r.id}`); }} className="text-ink-grey hover:text-primary">
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-ink-dark">Soil Readings</h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExport} disabled={sorted.length === 0}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="secondary" onClick={() => router.push("/plots")}>
            <MapIcon className="h-4 w-4" />
            View Map
          </Button>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-xs font-medium text-ink-grey mb-1">From</label>
            <Input type="date" value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-grey mb-1">To</label>
            <Input type="date" value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-grey mb-1">Farmer</label>
            <Select
              value={filters.farmerId}
              onChange={(e) => setFilters((f) => ({ ...f, farmerId: e.target.value }))}
              placeholder="All farmers"
              options={(filterOptions.data?.farmers ?? []).map((f) => ({ value: f.id, label: f.full_name }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-grey mb-1">Crop</label>
            <Select
              value={filters.crop}
              onChange={(e) => setFilters((f) => ({ ...f, crop: e.target.value }))}
              placeholder="All crops"
              options={CROP_OPTIONS.map((c) => ({ value: c.value, label: c.label }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-grey mb-1">Status</label>
            <Select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              placeholder="All statuses"
              options={STATUS_OPTIONS}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-grey mb-1">Device</label>
            <Select
              value={filters.deviceId}
              onChange={(e) => setFilters((f) => ({ ...f, deviceId: e.target.value }))}
              placeholder="All devices"
              options={(filterOptions.data?.devices ?? []).map((d) => ({ value: d.id, label: d.serial_number }))}
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={applyFilters}>Apply Filters</Button>
          <Button variant="secondary" onClick={clearFilters}>
            Clear
          </Button>
        </div>
      </Card>

      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-sm text-ink-grey">Showing {sorted.length} reading{sorted.length === 1 ? "" : "s"}</p>
        {activeFilterPills.map((p) => (
          <Badge key={p.label} tone="green">
            {p.label}
          </Badge>
        ))}
      </div>

      <Card>
        {readings.isLoading ? (
          <SkeletonTable rows={8} cols={10} />
        ) : readings.error ? (
          <ErrorCard message={readings.error.message} onRetry={() => readings.mutate()} />
        ) : sorted.length === 0 ? (
          <EmptyState title="No readings match your filters" description="Try widening your date range or clearing filters." />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={pageData}
              rowKey={(r) => r.id}
              onRowClick={(r) => router.push(`/readings/${r.id}`)}
              rowClassName={(r) =>
                cn(getOverallStatus(r, r.plot?.crop ?? "maize") === "critical" && "border-l-2 border-l-alert-red/40")
              }
              sortKey={sortKey}
              sortDirection={sortDir}
              onSort={handleSort}
            />
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}
