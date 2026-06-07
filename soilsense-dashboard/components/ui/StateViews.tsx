import { AlertCircle } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

export function ErrorCard({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("card border-2 border-alert-red/30 p-6 text-center space-y-3", className)}>
      <AlertCircle className="h-8 w-8 text-alert-red mx-auto" />
      <p className="text-sm text-ink-dark font-medium">Something went wrong</p>
      <p className="text-sm text-ink-grey">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  title = "No data yet",
  description,
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-12 px-4", className)}>
      <svg width="96" height="96" viewBox="0 0 96 96" fill="none" className="mb-4 opacity-70">
        <circle cx="48" cy="48" r="46" fill="#E8F5E9" />
        <rect x="44" y="28" width="8" height="38" rx="4" fill="#1A6B3A" />
        <circle cx="48" cy="24" r="8" fill="#1A6B3A" />
        <path d="M30 66c0 8 8 14 18 14s18-6 18-14" stroke="#1A6B3A" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M48 28c-6 4-8 10-4 16 4-2 8-8 4-16z" fill="#F5A623" />
        <path d="M48 28c6 4 8 10 4 16-4-2-8-8-4-16z" fill="#F5A623" opacity="0.7" />
      </svg>
      <p className="font-medium text-ink-dark">{title}</p>
      {description && <p className="text-sm text-ink-grey mt-1 max-w-xs">{description}</p>}
    </div>
  );
}
