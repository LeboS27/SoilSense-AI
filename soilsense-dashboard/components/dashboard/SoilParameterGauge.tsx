import { cn } from "@/lib/utils";
import { getOptimalRange, getParameterStatus, STATUS_LABELS, type SoilParameter } from "@/lib/soil-thresholds";

const STATUS_TEXT_COLOURS: Record<string, string> = {
  optimal: "text-primary",
  low_warning: "text-alert-orange",
  high_warning: "text-alert-orange",
  low_critical: "text-alert-red",
  high_critical: "text-alert-red",
};

export function SoilParameterGauge({
  parameter,
  label,
  unit,
  value,
  crop,
}: {
  parameter: SoilParameter;
  label: string;
  unit: string;
  value: number | null;
  crop: string;
}) {
  const range = getOptimalRange(parameter, crop);
  const status = getParameterStatus(parameter, value, crop);

  // Map the value onto a 0–100% bar where the optimal range occupies the middle 60%
  const span = range.max - range.min;
  const barMin = range.min - span * 0.6;
  const barMax = range.max + span * 0.6;
  const barSpan = barMax - barMin || 1;

  const clampedValue = value ?? barMin;
  const valuePct = Math.min(100, Math.max(0, ((clampedValue - barMin) / barSpan) * 100));
  const optimalStartPct = ((range.min - barMin) / barSpan) * 100;
  const optimalEndPct = ((range.max - barMin) / barSpan) * 100;

  return (
    <div className="rounded-lg border border-gray-100 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs font-medium text-ink-grey uppercase tracking-wide">{label}</p>
        <span className={cn("text-xs font-semibold", STATUS_TEXT_COLOURS[status])}>{STATUS_LABELS[status]}</span>
      </div>
      <p className="text-2xl font-bold text-ink-dark mt-1">
        {value ?? "—"}
        {unit && <span className="text-sm font-normal text-ink-grey ml-1">{unit}</span>}
      </p>
      <div className="relative h-2.5 mt-3 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="absolute inset-y-0 bg-primary-light"
          style={{ left: `${optimalStartPct}%`, width: `${Math.max(0, optimalEndPct - optimalStartPct)}%` }}
        />
        <div
          className={cn(
            "absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 border-white shadow",
            status === "optimal" ? "bg-primary" : status.includes("critical") ? "bg-alert-red" : "bg-alert-orange"
          )}
          style={{ left: `calc(${valuePct}% - 7px)` }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-ink-grey mt-1">
        <span>{range.min}</span>
        <span className="text-primary font-medium">optimal</span>
        <span>{range.max}</span>
      </div>
    </div>
  );
}

export function HealthScoreGauge({ score }: { score: number }) {
  const colour = score >= 80 ? "text-primary" : score >= 50 ? "text-alert-orange" : "text-alert-red";
  const ringColour = score >= 80 ? "#1A6B3A" : score >= 50 ? "#F57C00" : "#D32F2F";
  const circumference = 2 * Math.PI * 36;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="rounded-lg border border-gray-100 p-4 flex items-center gap-4">
      <svg width="84" height="84" viewBox="0 0 84 84" className="shrink-0 -rotate-90">
        <circle cx="42" cy="42" r="36" stroke="#E5E7EB" strokeWidth="8" fill="none" />
        <circle
          cx="42"
          cy="42"
          r="36"
          stroke={ringColour}
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div>
        <p className="text-xs font-medium text-ink-grey uppercase tracking-wide">Overall Health Score</p>
        <p className={cn("text-3xl font-bold mt-1", colour)}>{score}%</p>
        <p className="text-xs text-ink-grey mt-0.5">of parameters in optimal range</p>
      </div>
    </div>
  );
}
