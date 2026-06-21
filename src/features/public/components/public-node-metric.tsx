import type { LucideIcon } from "lucide-react";

type PublicNodeMetricProps = {
  icon: LucideIcon;
  label: string;
  value: number;
};

export function PublicNodeMetric({ icon: Icon, label, value }: PublicNodeMetricProps) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)_44px] items-center gap-2 text-xs">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        <span>{label}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-sm bg-white/80 dark:bg-white/10">
        <span
          className="block h-full rounded-sm bg-primary"
          style={{ width: `${Math.max(0, Math.min(value, 100))}%` }}
        />
      </div>
      <span className="text-right font-semibold">{value}%</span>
    </div>
  );
}
