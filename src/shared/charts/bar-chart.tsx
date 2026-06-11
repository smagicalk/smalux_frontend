import { clampPercent, type ChartPoint } from "@/shared/charts/chart-utils";

type BarChartProps = {
  data: ChartPoint[];
  label: string;
  color?: string;
  height?: number;
  baseline?: number;
};

export function BarChart({
  data,
  label,
  color = "var(--chart-3)",
  height = 150,
  baseline = 0
}: BarChartProps) {
  const max = Math.max(...data.map((item) => item.value), 1);
  const range = Math.max(max - baseline, 1);

  return (
    <div className="flex flex-col gap-3">
      <div
        role="img"
        aria-label={label}
        className="flex items-stretch gap-2 rounded-[1.1rem] bg-[color:var(--surface-muted)] p-4"
        style={{ height }}
      >
        {data.map((item) => (
          <div key={item.label} className="flex h-full min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex min-h-0 w-full flex-1 items-end">
              <span
                className="w-full rounded-t-xl"
                style={{
                  height: `${clampPercent(((item.value - baseline) / range) * 100)}%`,
                  backgroundColor: color
                }}
                aria-label={`${item.label}: ${item.value}`}
              />
            </div>
            <span className="max-w-full truncate text-[11px] font-medium tracking-[-0.01em] text-muted-foreground">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
