"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { SkeletonBlock } from "@/components/ui/LoadingSpinner";
import { ErrorCard, EmptyState } from "@/components/ui/StateViews";
import { timeAgo, cn } from "@/lib/utils";
import { cropLabel, type AIRecommendation, type RecommendationAlert } from "@/types";

export interface AlertListItem extends AIRecommendation {
  farmer_name?: string | null;
  crop_other?: string | null;
}

function mostUrgentAlert(alerts: RecommendationAlert[]): RecommendationAlert | null {
  if (alerts.length === 0) return null;
  const critical = alerts.find((a) => a.level === "critical");
  return critical ?? alerts[0];
}

export function AlertsBanner({
  items,
  loading,
  error,
  onRetry,
}: {
  items: AlertListItem[];
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-14" />
        ))}
      </div>
    );
  }

  if (error) return <ErrorCard message={error} onRetry={onRetry} />;

  if (items.length === 0) {
    return <EmptyState title="No active alerts" description="Critical recommendations will show up here as soon as they're generated." />;
  }

  return (
    <div className="space-y-3">
      {items.map((rec) => {
        const alerts = (rec.alerts as unknown as RecommendationAlert[]) ?? [];
        const alert = mostUrgentAlert(alerts);
        return (
          <Link
            key={rec.id}
            href={rec.reading_id ? `/readings/${rec.reading_id}` : "/recommendations"}
            className="flex items-start gap-3 rounded-lg border border-red-100 bg-red-50/60 px-3 py-2.5 hover:bg-red-50 transition-colors"
          >
            <div className={cn("h-8 w-8 rounded-full bg-red-100 flex items-center justify-center shrink-0")}>
              <AlertTriangle className="h-4 w-4 text-alert-red" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink-dark truncate">
                {rec.farmer_name ?? "Unknown farmer"} &middot; {cropLabel(rec.crop, rec.crop_other)}
              </p>
              <p className="text-xs text-ink-grey truncate mt-0.5">{alert?.message ?? "Critical condition detected"}</p>
            </div>
            <span className="text-xs text-ink-grey shrink-0">{timeAgo(rec.created_at)}</span>
          </Link>
        );
      })}
      <Link href="/recommendations?alerts=true" className="block text-sm text-primary font-medium text-center pt-1 hover:underline">
        View All
      </Link>
    </div>
  );
}
