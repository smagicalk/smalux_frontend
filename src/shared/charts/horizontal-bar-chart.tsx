import { clampPercent, type ChartPoint } from "@/shared/charts/chart-utils";

type HorizontalBarChartProps = {
  data: ChartPoint[];
  label: string;
  color?: string;
};

export function HorizontalBarChart({
  data,
  label,
  color = "var(--chart-1)"
}: HorizontalBarChartProps) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div role="img" aria-label={label} className="grid gap-3">
      {data.map((item) => (
        <div key={item.label} className="grid gap-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-muted-foreground">{item.label}</span>
            <span className="font-semibold tracking-[-0.02em]">{item.value}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-[color:var(--surface-muted)] dark:bg-white/6">
            <span
              className="block h-full rounded-full"
              style={{
                width: `${clampPercent((item.value / max) * 100)}%`,
                backgroundColor: color
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
