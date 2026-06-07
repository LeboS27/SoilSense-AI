"use client";

import { useRouter } from "next/navigation";
import { WifiOff } from "lucide-react";
import { StatusPill } from "@/components/ui/StatusPill";
import { SkeletonTable } from "@/components/ui/LoadingSpinner";
import { ErrorCard, EmptyState } from "@/components/ui/StateViews";
import { formatDateTime, cn } from "@/lib/utils";
import { getOverallStatus } from "@/lib/soil-thresholds";
import { cropLabel } from "@/types";
import type { ReadingWithRelations } from "@/types";

export function RecentReadingsTable({
  readings,
  loading,
  error,
  onRetry,
  flashIds = [],
}: {
  readings: ReadingWithRelations[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
  flashIds?: string[];
}) {
  const router = useRouter();

  if (loading) return <SkeletonTable rows={6} cols={9} />;
  if (error) return <ErrorCard message={error} onRetry={onRetry} />;
  if (readings.length === 0) {
    return <EmptyState title="No readings yet" description="Soil readings from deployed devices will appear here as they come in." />;
  }

  return (
    <div className="overflow-x-auto -mx-5">
      <table className="w-full text-sm min-w-[760px]">
        <thead>
          <tr className="border-b border-gray-100 text-left text-ink-grey text-xs uppercase tracking-wide">
            <th className="px-3 py-2.5 font-medium">Time</th>
            <th className="px-3 py-2.5 font-medium">Farmer</th>
            <th className="px-3 py-2.5 font-medium">Crop</th>
            <th className="px-3 py-2.5 font-medium">pH</th>
            <th className="px-3 py-2.5 font-medium">N</th>
            <th className="px-3 py-2.5 font-medium">P</th>
            <th className="px-3 py-2.5 font-medium">K</th>
            <th className="px-3 py-2.5 font-medium">Moisture</th>
            <th className="px-3 py-2.5 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {readings.map((r) => {
            const crop = r.plot?.crop ?? "maize";
            const status = getOverallStatus(r, crop);
            const flash = flashIds.includes(r.id);
            return (
              <tr
                key={r.id}
                onClick={() => router.push(`/readings/${r.id}`)}
                className={cn(
                  "border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors",
                  flash && "animate-flash-in"
                )}
              >
                <td className="px-3 py-3 whitespace-nowrap text-ink-grey">
                  <span className="inline-flex items-center gap-1.5">
                    {r.was_offline_sync && <WifiOff className="h-3.5 w-3.5 text-alert-orange" />}
                    {formatDateTime(r.reading_taken_at)}
                  </span>
                </td>
                <td className="px-3 py-3 font-medium text-ink-dark whitespace-nowrap">{r.farmer?.full_name ?? "—"}</td>
                <td className="px-3 py-3 whitespace-nowrap">{cropLabel(r.plot?.crop ?? "maize", r.plot?.crop_other)}</td>
                <td className="px-3 py-3 whitespace-nowrap">{r.ph ?? "—"}</td>
                <td className="px-3 py-3 whitespace-nowrap">{r.nitrogen_mg_kg ?? "—"}</td>
                <td className="px-3 py-3 whitespace-nowrap">{r.phosphorus_mg_kg ?? "—"}</td>
                <td className="px-3 py-3 whitespace-nowrap">{r.potassium_mg_kg ?? "—"}</td>
                <td className="px-3 py-3 whitespace-nowrap">{r.moisture_percent ?? "—"}%</td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <StatusPill status={status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
