"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { DollarSign, TrendingUp, Users, FileText, Download } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { StatCard, StatCardSkeleton } from "@/components/dashboard/StatCard";
import { ErrorCard, EmptyState } from "@/components/ui/StateViews";
import { SkeletonBlock } from "@/components/ui/LoadingSpinner";
import { DataTable, Pagination } from "@/components/ui/DataTable";
import { useDashboardStore } from "@/store/dashboard";
import { formatCurrency, formatDate, downloadCSV } from "@/lib/utils";
import type { RevenueRecord, Farmer } from "@/types";

const PAGE_SIZE = 10;
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const STATUS_TONE: Record<string, "green" | "orange" | "red" | "grey"> = {
  paid: "green",
  pending: "orange",
  overdue: "red",
  waived: "grey",
};

export interface RevenueRow extends RevenueRecord {
  farmerName: string | null;
}

interface RevenueData {
  records: RevenueRow[];
  activeFarmerCount: number;
}

async function fetchRevenue(): Promise<RevenueData> {
  const supabase = createClient();
  const [{ data: records, error }, { count: activeFarmerCount }] = await Promise.all([
    supabase.from("revenue_records").select("*").order("created_at", { ascending: false }).limit(500),
    supabase.from("farmers").select("id", { count: "exact", head: true }).eq("subscription_status", "active"),
  ]);
  if (error) throw error;

  const farmerIds = (records ?? []).map((r) => r.farmer_id).filter((id): id is string => !!id);
  let farmerNames: Record<string, string> = {};
  if (farmerIds.length > 0) {
    const { data: farmers } = await supabase.from("farmers").select("id, full_name").in("id", farmerIds);
    farmerNames = Object.fromEntries(((farmers ?? []) as Pick<Farmer, "id" | "full_name">[]).map((f) => [f.id, f.full_name]));
  }

  return {
    records: (records ?? []).map((r) => ({ ...r, farmerName: r.farmer_id ? farmerNames[r.farmer_id] ?? null : null })),
    activeFarmerCount: activeFarmerCount ?? 0,
  };
}

export default function RevenuePage() {
  const addToast = useDashboardStore((s) => s.addToast);
  const [page, setPage] = useState(1);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const { data, error, isLoading, mutate } = useSWR("revenue-data", fetchRevenue);

  const records = data?.records ?? [];
  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const pageData = records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const collected = records.filter((r) => r.status === "paid").reduce((sum, r) => sum + r.amount_usd, 0);
    const pending = records.filter((r) => r.status === "pending" || r.status === "overdue").reduce((sum, r) => sum + r.amount_usd, 0);
    const thisMonth = records
      .filter((r) => r.period_month === currentMonth && r.period_year === currentYear)
      .reduce((sum, r) => sum + r.amount_usd, 0);

    return { collected, pending, thisMonth };
  }, [records]);

  const monthlyChart = useMemo(() => {
    const buckets: Record<string, number> = {};
    for (const r of records) {
      if (r.period_month == null || r.period_year == null) continue;
      const key = `${r.period_year}-${String(r.period_month).padStart(2, "0")}`;
      buckets[key] = (buckets[key] ?? 0) + r.amount_usd;
    }
    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, total]) => {
        const [year, month] = key.split("-");
        return { label: `${MONTH_NAMES[Number(month) - 1]} ${year.slice(2)}`, total: Math.round(total * 100) / 100 };
      });
  }, [records]);

  async function handleGenerateInvoices() {
    setGenerating(true);
    try {
      const supabase = createClient();
      const now = new Date();
      const period_month = now.getMonth() + 1;
      const period_year = now.getFullYear();

      const { data: activeFarmers, error: farmersError } = await supabase
        .from("farmers")
        .select("id, monthly_fee_usd")
        .eq("subscription_status", "active");
      if (farmersError) throw farmersError;

      const { data: existing } = await supabase
        .from("revenue_records")
        .select("farmer_id")
        .eq("record_type", "subscription")
        .eq("period_month", period_month)
        .eq("period_year", period_year);
      const existingIds = new Set((existing ?? []).map((r) => r.farmer_id));

      const toInsert = (activeFarmers ?? [])
        .filter((f) => !existingIds.has(f.id))
        .map((f) => ({
          farmer_id: f.id,
          record_type: "subscription",
          amount_usd: f.monthly_fee_usd,
          period_month,
          period_year,
          status: "pending",
        }));

      if (toInsert.length === 0) {
        addToast({ variant: "info", title: "No new invoices to generate", description: "All active farmers already have invoices for this month." });
      } else {
        const { error: insertError } = await supabase.from("revenue_records").insert(toInsert);
        if (insertError) throw insertError;
        addToast({ variant: "success", title: "Invoices generated", description: `${toInsert.length} invoice${toInsert.length === 1 ? "" : "s"} created for ${MONTH_NAMES[period_month - 1]} ${period_year}.` });
      }
      setConfirmOpen(false);
      mutate();
    } catch (e) {
      addToast({ variant: "error", title: "Could not generate invoices", description: e instanceof Error ? e.message : "An unexpected error occurred" });
    } finally {
      setGenerating(false);
    }
  }

  function handleExport() {
    downloadCSV(
      "revenue-records.csv",
      records.map((r) => ({
        farmer: r.farmerName ?? "—",
        type: r.record_type,
        amount_usd: r.amount_usd,
        period: r.period_month && r.period_year ? `${MONTH_NAMES[r.period_month - 1]} ${r.period_year}` : "—",
        status: r.status,
        paid_at: r.paid_at ?? "—",
        created_at: r.created_at,
      }))
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-ink-dark">Revenue</h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleExport} disabled={records.length === 0}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setConfirmOpen(true)}>
            <FileText className="h-4 w-4" />
            Generate Monthly Invoices
          </Button>
        </div>
      </div>

      {error ? (
        <ErrorCard message={error.message} onRetry={() => mutate()} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
            ) : (
              <>
                <StatCard label="Total Collected" value={formatCurrency(stats.collected)} icon={DollarSign} tone="primary" />
                <StatCard label="Pending / Overdue" value={formatCurrency(stats.pending)} icon={TrendingUp} tone="orange" />
                <StatCard label="This Month" value={formatCurrency(stats.thisMonth)} icon={FileText} tone="gold" />
                <StatCard label="Active Subscribers" value={data?.activeFarmerCount ?? 0} icon={Users} tone="blue" />
              </>
            )}
          </div>

          <Card title="Monthly Revenue">
            {isLoading ? (
              <SkeletonBlock className="h-64 w-full" />
            ) : monthlyChart.length === 0 ? (
              <EmptyState title="No revenue data yet" description="Monthly revenue totals will appear here once records exist." className="h-[260px]" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#555" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#555" }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="total" fill="#1A6B3A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card title="Records">
            {isLoading ? (
              <SkeletonBlock className="h-64 w-full" />
            ) : records.length === 0 ? (
              <EmptyState title="No revenue records" description="Generate monthly invoices to start tracking revenue." className="h-[200px]" />
            ) : (
              <>
                <DataTable
                  columns={[
                    { key: "farmer", header: "Farmer", render: (r: RevenueRow) => r.farmerName ?? "—" },
                    { key: "type", header: "Type", render: (r: RevenueRow) => <span className="capitalize">{r.record_type.replace(/_/g, " ")}</span> },
                    { key: "amount", header: "Amount", render: (r: RevenueRow) => formatCurrency(r.amount_usd) },
                    { key: "period", header: "Period", render: (r: RevenueRow) => (r.period_month && r.period_year ? `${MONTH_NAMES[r.period_month - 1]} ${r.period_year}` : "—") },
                    { key: "status", header: "Status", render: (r: RevenueRow) => <Badge tone={STATUS_TONE[r.status] ?? "grey"} className="capitalize">{r.status}</Badge> },
                    { key: "paid_at", header: "Paid At", render: (r: RevenueRow) => (r.paid_at ? formatDate(r.paid_at) : "—") },
                  ]}
                  data={pageData}
                  rowKey={(r) => r.id}
                />
                <Pagination page={page} totalPages={totalPages} onChange={setPage} />
              </>
            )}
          </Card>
        </>
      )}

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Generate Monthly Invoices">
        <div className="space-y-4">
          <p className="text-sm text-ink-dark">
            This will create a pending invoice for the current month for every active subscriber that doesn&apos;t already have one. Continue?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerateInvoices} loading={generating}>Generate Invoices</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
