"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
  Users,
  Cpu,
  MapPin,
  Sparkles,
  DollarSign,
  Settings,
  X,
} from "lucide-react";
import { Logo } from "./Logo";
import { useDashboardStore } from "@/store/dashboard";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/readings", label: "Readings", icon: Activity },
  { href: "/farmers", label: "Farmers", icon: Users },
  { href: "/devices", label: "Devices", icon: Cpu },
  { href: "/plots", label: "Plot Map", icon: MapPin },
  { href: "/recommendations", label: "Recommendations", icon: Sparkles },
  { href: "/revenue", label: "Revenue", icon: DollarSign },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {NAV_ITEMS.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              active ? "bg-primary-light text-primary" : "text-ink-grey hover:bg-gray-50 hover:text-ink-dark"
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter() {
  return (
    <div className="px-5 py-4 border-t border-gray-100">
      <Logo className="text-base" />
      <p className="text-xs text-ink-grey mt-1">
        v{process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0"}
      </p>
      <p className="text-[11px] text-ink-grey/70 mt-2">A Mudau Technologies product</p>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex lg:flex-col w-60 shrink-0 h-screen sticky top-0 bg-white border-r border-gray-100">
      <div className="px-5 py-5 border-b border-gray-100">
        <Logo />
      </div>
      <NavLinks />
      <SidebarFooter />
    </aside>
  );
}

export function MobileSidebarDrawer() {
  const open = useDashboardStore((s) => s.sidebarOpen);
  const setOpen = useDashboardStore((s) => s.setSidebarOpen);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
      <aside className="absolute left-0 top-0 h-full w-64 bg-white flex flex-col shadow-xl animate-slide-down">
        <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
          <Logo />
          <button onClick={() => setOpen(false)} className="text-ink-grey hover:text-ink-dark">
            <X className="h-5 w-5" />
          </button>
        </div>
        <NavLinks onNavigate={() => setOpen(false)} />
        <SidebarFooter />
      </aside>
    </div>
  );
}
