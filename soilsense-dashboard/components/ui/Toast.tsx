"use client";

import { useEffect } from "react";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { useDashboardStore, type ToastItem } from "@/store/dashboard";
import { cn } from "@/lib/utils";

const ICONS: Record<ToastItem["variant"], React.ElementType> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  critical: AlertTriangle,
};

const COLOURS: Record<ToastItem["variant"], string> = {
  success: "border-primary/30 text-primary bg-primary-light",
  error: "border-alert-red/30 text-alert-red bg-red-50",
  info: "border-alert-blue/30 text-alert-blue bg-blue-50",
  critical: "border-alert-red/40 text-alert-red bg-red-50",
};

function ToastCard({ toast }: { toast: ToastItem }) {
  const removeToast = useDashboardStore((s) => s.removeToast);
  const Icon = ICONS[toast.variant];

  useEffect(() => {
    const timer = setTimeout(() => removeToast(toast.id), toast.variant === "critical" ? 8000 : 5000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.variant, removeToast]);

  return (
    <div className={cn("flex items-start gap-3 rounded-lg border shadow-lg px-4 py-3 w-80 bg-white animate-slide-down", COLOURS[toast.variant])}>
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-ink-dark">{toast.title}</p>
        {toast.description && <p className="text-xs text-ink-grey mt-0.5">{toast.description}</p>}
      </div>
      <button onClick={() => removeToast(toast.id)} className="text-ink-grey hover:text-ink-dark">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useDashboardStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} />
      ))}
    </div>
  );
}
