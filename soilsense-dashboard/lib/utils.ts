import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { OverallStatus } from "@/lib/soil-thresholds";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ZIMBABWE_TZ = "Africa/Harare";

export function formatZimbabweTime(date: Date | string, opts?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: ZIMBABWE_TZ,
    ...opts,
  }).format(d);
}

export function formatDateTime(date: Date | string): string {
  return formatZimbabweTime(date, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(date: Date | string): string {
  return formatZimbabweTime(date, { day: "2-digit", month: "short", year: "numeric" });
}

export function formatTime(date: Date | string): string {
  return formatZimbabweTime(date, { hour: "2-digit", minute: "2-digit" });
}

/** Returns the start of the current day in Zimbabwe time (UTC+2), as a UTC ISO string. */
export function startOfTodayZimbabwe(): string {
  const now = new Date();
  const zimbabweOffsetMs = 2 * 60 * 60 * 1000;
  const zimbabweNow = new Date(now.getTime() + zimbabweOffsetMs);
  const y = zimbabweNow.getUTCFullYear();
  const m = zimbabweNow.getUTCMonth();
  const d = zimbabweNow.getUTCDate();
  // Midnight Zimbabwe time = 22:00 UTC the previous day (UTC+2)
  const midnightUTC = Date.UTC(y, m, d, 0, 0, 0) - zimbabweOffsetMs;
  return new Date(midnightUTC).toISOString();
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

export function truncateId(id: string, length = 8): string {
  return id.slice(0, length);
}

export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLOURS = [
  "bg-primary text-white",
  "bg-emerald-600 text-white",
  "bg-teal-600 text-white",
  "bg-blue-600 text-white",
  "bg-cyan-700 text-white",
  "bg-green-700 text-white",
];

export function avatarColour(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLOURS[Math.abs(hash) % AVATAR_COLOURS.length];
}

export function formatCurrency(amount: number): string {
  return `US$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const STATUS_COLOURS: Record<OverallStatus, { bg: string; text: string; dot: string }> = {
  good: { bg: "bg-green-100", text: "text-primary", dot: "bg-primary" },
  warning: { bg: "bg-orange-100", text: "text-alert-orange", dot: "bg-alert-orange" },
  critical: { bg: "bg-red-100", text: "text-alert-red", dot: "bg-alert-red" },
};

export const STATUS_PILL_LABELS: Record<OverallStatus, string> = {
  good: "Good",
  warning: "Warning",
  critical: "Critical",
};

export function downloadCSV(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (val: unknown) => {
    const s = val === null || val === undefined ? "" : String(val);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const csv = [headers.join(","), ...rows.map((row) => headers.map((h) => escape(row[h])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
