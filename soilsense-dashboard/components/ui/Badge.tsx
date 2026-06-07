import { cn } from "@/lib/utils";

type Tone = "green" | "grey" | "red" | "orange" | "blue" | "gold";

const TONE_CLASSES: Record<Tone, string> = {
  green: "bg-green-100 text-primary",
  grey: "bg-gray-100 text-ink-grey",
  red: "bg-red-100 text-alert-red",
  orange: "bg-orange-100 text-alert-orange",
  blue: "bg-blue-100 text-alert-blue",
  gold: "bg-amber-100 text-amber-700",
};

export function Badge({
  children,
  tone = "grey",
  className,
  strikethrough = false,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
  strikethrough?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
        TONE_CLASSES[tone],
        strikethrough && "line-through",
        className
      )}
    >
      {children}
    </span>
  );
}
