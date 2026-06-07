"use client";

import { useEffect, useState } from "react";
import { Menu, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDashboardStore } from "@/store/dashboard";
import { createClient } from "@/lib/supabase/client";
import { formatZimbabweTime } from "@/lib/utils";

function ZimbabweClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return <div className="w-32 h-5" />;

  return (
    <div className="hidden sm:flex flex-col items-end leading-tight">
      <span className="text-sm font-medium text-ink-dark tabular-nums">
        {formatZimbabweTime(now, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      </span>
      <span className="text-[11px] text-ink-grey">Zimbabwe (UTC+2)</span>
    </div>
  );
}

export function Topbar({ title, initials = "AD" }: { title: string; initials?: string }) {
  const setSidebarOpen = useDashboardStore((s) => s.setSidebarOpen);
  const unreadAlerts = useDashboardStore((s) => s.unreadAlerts);
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden text-ink-grey hover:text-ink-dark p-1 -ml-1"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="font-semibold text-lg text-ink-dark truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-4 sm:gap-5 shrink-0">
        <ZimbabweClock />

        <button
          onClick={() => router.push("/recommendations?alerts=true")}
          className="relative text-ink-grey hover:text-ink-dark"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadAlerts > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-1 rounded-full bg-alert-red text-white text-[10px] font-semibold flex items-center justify-center">
              {unreadAlerts > 99 ? "99+" : unreadAlerts}
            </span>
          )}
        </button>

        <div className="h-9 w-9 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
          {initials}
        </div>
      </div>
    </header>
  );
}

export function useSignOut() {
  const router = useRouter();
  return async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };
}
