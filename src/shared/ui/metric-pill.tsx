import { cn } from "@/shared/lib/utils";

type MetricPillProps = {
  label: string;
  value: string;
  className?: string;
};

export function MetricPill({ label, value, className }: MetricPillProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center justify-between gap-3 rounded-xl border border-white/50 bg-[color:var(--surface-muted)] px-3 py-2.5 dark:border-white/8",
        className
      )}
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="truncate text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}
