import { formatPercent } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Progress } from "@/shared/ui/progress";

type PercentBarProps = {
  value: number;
  label?: string;
  layout?: "stacked" | "inline";
  className?: string;
};

export function PercentBar({
  value,
  label,
  layout = "stacked",
  className
}: PercentBarProps) {
  if (layout === "inline") {
    return (
      <div className={cn("flex min-w-[120px] items-center gap-3", className)}>
        <Progress value={value} />
        <span className="w-11 text-right text-xs font-semibold text-muted-foreground">
          {formatPercent(value)}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <div className="flex items-center justify-between gap-2 text-sm">
        {label ? <span className="text-muted-foreground">{label}</span> : null}
        <span className="font-semibold">{formatPercent(value)}</span>
      </div>
      <Progress value={value} />
    </div>
  );
}
