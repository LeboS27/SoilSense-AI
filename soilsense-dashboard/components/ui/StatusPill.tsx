import { STATUS_COLOURS, STATUS_PILL_LABELS, cn } from "@/lib/utils";
import type { OverallStatus } from "@/lib/soil-thresholds";

export function StatusPill({ status, className }: { status: OverallStatus; className?: string }) {
  const colours = STATUS_COLOURS[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium", colours.bg, colours.text, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", colours.dot)} />
      {STATUS_PILL_LABELS[status]}
    </span>
  );
}
