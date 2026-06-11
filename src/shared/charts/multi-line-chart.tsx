import { toPolylinePoints, type ChartSeries } from "@/shared/charts/chart-utils";

type MultiLineChartProps = {
  series: ChartSeries[];
  label: string;
  height?: number;
};

export function MultiLineChart({ series, label, height = 180 }: MultiLineChartProps) {
  const allValues = series.flatMap((item) => item.values);
  const domain = {
    min: Math.min(...allValues, 0),
    max: Math.max(...allValues, 1)
  };

  return (
    <div className="flex flex-col gap-3">
      <svg
        role="img"
        aria-label={label}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full rounded-[1.1rem] bg-[color:var(--surface-muted)] p-3"
        style={{ height }}
      >
        {[18, 36, 54, 72, 90].map((y) => (
          <line
            key={y}
            x1="0"
            x2="100"
            y1={y}
            y2={y}
            stroke="var(--border)"
            strokeWidth="0.5"
            strokeDasharray="2 4"
          />
        ))}
        {series.map((item) => (
          <polyline
            key={item.name}
            fill="none"
            points={toPolylinePoints(item.values, 100, 100, 8, domain)}
            stroke={item.color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.2"
          />
        ))}
      </svg>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {series.map((item) => (
          <span key={item.name} className="inline-flex items-center gap-2 rounded-full bg-[color:var(--surface-muted)] px-2.5 py-1 dark:bg-white/6">
            <span
              className="size-2 rounded-sm"
              style={{ backgroundColor: item.color }}
              aria-hidden
            />
            {item.name}
          </span>
        ))}
      </div>
    </div>
  );
}
