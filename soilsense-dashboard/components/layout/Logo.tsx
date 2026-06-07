import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("font-bold text-xl tracking-tight", className)}>
      <span className="text-primary">SoilSense</span> <span className="text-accent-gold">AI</span>
    </span>
  );
}
