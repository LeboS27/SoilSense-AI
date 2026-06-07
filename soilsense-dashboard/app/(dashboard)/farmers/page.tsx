"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { UserPlus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/DataTable";
import { ErrorCard, EmptyState } from "@/components/ui/StateViews";
import { FarmerCard, FarmerCardSkeleton, type FarmerCardData } from "@/components/farmers/FarmerCard";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

const FILTER_CHIPS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "cancelled", label: "Cancelled" },
];

async function fetchFarmers(): Promise<FarmerCardData[]> {
  const supabase = createClient();
  const { data: farmers, error } = await supabase.from("farmers").select("*").order("created_at", { ascending: false });
  if (error) throw error;

  const results: FarmerCardData[] = [];
  for (const farmer of farmers ?? []) {
    const [{ count: plotCount }, { count: deviceCount }, { data: latestReading }] = await Promise.all([
      supabase.from("plots").select("id", { count: "exact", head: true }).eq("farmer_id", farmer.id),
      supabase.from("devices").select("id", { count: "exact", head: true }).eq("farmer_id", farmer.id),
      supabase
        .from("soil_readings")
        .select("reading_taken_at")
        .eq("farmer_id", farmer.id)
        .order("reading_taken_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    results.push({
      ...farmer,
      plotCount: plotCount ?? 0,
      deviceCount: deviceCount ?? 0,
      lastReadingAt: latestReading?.reading_taken_at ?? null,
    });
  }

  return results;
}

export default function FarmersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data, error, isLoading, mutate } = useSWR("farmers-list", fetchFarmers);

  const filtered = useMemo(() => {
    let result = data ?? [];
    if (statusFilter !== "all") result = result.filter((f) => f.subscription_status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((f) => f.full_name.toLowerCase().includes(q) || f.phone_number.includes(q));
    }
    return result;
  }, [data, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-ink-dark">Farmers</h2>
        <Button onClick={() => router.push("/farmers/new")}>
          <UserPlus className="h-4 w-4" />
          Register Farmer
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-grey" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name or phone number…"
          className="pl-9"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.value}
            onClick={() => {
              setStatusFilter(chip.value);
              setPage(1);
            }}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors",
              statusFilter === chip.value
                ? "bg-primary text-white border-primary"
                : "bg-white text-ink-grey border-gray-300 hover:bg-gray-50"
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <FarmerCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <ErrorCard message={error.message} onRetry={() => mutate()} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No farmers found" description="Try a different search term or register a new farmer to get started." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pageData.map((farmer) => (
              <FarmerCard key={farmer.id} farmer={farmer} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
