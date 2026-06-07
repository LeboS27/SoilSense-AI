"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SkeletonBlock } from "@/components/ui/LoadingSpinner";
import { ErrorCard, EmptyState } from "@/components/ui/StateViews";
import type { MapPlotMarker } from "@/components/map/FarmerMap";

const FarmerMap = dynamic(() => import("@/components/map/FarmerMap").then((m) => m.FarmerMap), {
  ssr: false,
  loading: () => <SkeletonBlock className="h-[280px]" />,
});

export function NetworkMapWidget({
  markers,
  loading,
  error,
  onRetry,
}: {
  markers: MapPlotMarker[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  if (loading) return <SkeletonBlock className="h-[280px]" />;
  if (error) return <ErrorCard message={error} onRetry={onRetry} />;

  return (
    <div className="relative group">
      <Link
        href="/plots"
        className="absolute top-3 right-3 z-[1] inline-flex items-center gap-1 bg-white/95 backdrop-blur rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary shadow hover:bg-white"
      >
        Open full map <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
      {markers.length === 0 ? (
        <EmptyState title="No plots mapped yet" description="Plots with coordinates will appear here." className="h-[280px]" />
      ) : (
        <Link href="/plots" className="block rounded-lg overflow-hidden border border-gray-100">
          <FarmerMap markers={markers} height={280} zoom={11} scrollWheelZoom={false} />
        </Link>
      )}
    </div>
  );
}
