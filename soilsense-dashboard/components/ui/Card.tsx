import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  title,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn("card p-5", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="font-semibold text-ink-dark text-base">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
