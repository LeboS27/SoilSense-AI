import Link from "next/link";
import { cn } from "@/lib/utils";

type Tone = "primary" | "gold" | "red" | "orange" | "blue";

const TONE_CLASSES: Record<Tone, { bg: string; text: string }> = {
  primary: { bg: "bg-primary-light", text: "text-primary" },
  gold: { bg: "bg-amber-50", text: "text-accent-gold" },
  red: { bg: "bg-red-50", text: "text-alert-red" },
  orange: { bg: "bg-orange-50", text: "text-alert-orange" },
  blue: { bg: "bg-blue-50", text: "text-alert-blue" },
};

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  tone?: Tone;
  href?: string;
}

export function StatCard({ label, value, subtitle, icon: Icon, tone = "primary", href }: StatCardProps) {
  const colours = TONE_CLASSES[tone];

  const content = (
    <div className="card p-5 flex items-start justify-between gap-3 h-full">
      <div className="min-w-0">
        <p className="text-sm text-ink-grey">{label}</p>
        <p className="text-2xl font-bold text-ink-dark mt-1 truncate">{value}</p>
        {subtitle && <p className="text-xs text-ink-grey mt-1">{subtitle}</p>}
      </div>
      <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", colours.bg)}>
        <Icon className={cn("h-5 w-5", colours.text)} />
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full hover:-translate-y-0.5 transition-transform">
        {content}
      </Link>
    );
  }

  return content;
}

export function StatCardSkeleton() {
  return (
    <div className="card p-5 space-y-3">
      <div className="skeleton h-3 w-1/2" />
      <div className="skeleton h-7 w-1/3" />
      <div className="skeleton h-3 w-1/4" />
    </div>
  );
}
