import { toPolylinePoints } from "@/shared/charts/chart-utils";

type AreaTrendChartProps = {
  values: number[];
  label: string;
  color?: string;
  height?: number;
};

export function AreaTrendChart({
  values,
  label,
  color = "var(--chart-1)",
  height = 96
}: AreaTrendChartProps) {
  const chartHeight = 100;
  const points = toPolylinePoints(values, 100, chartHeight, 8);
  const areaPoints = `0,${chartHeight} ${points} 100,${chartHeight}`;

  return (
    <div className="rounded-[1.1rem] bg-[color:var(--surface-muted)] p-3 dark:bg-white/6">
      <svg
        role="img"
        aria-label={label}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full overflow-visible"
        style={{ height }}
      >
        {[18, 38, 58, 78].map((y) => (
          <line
            key={y}
            x1="0"
            x2="100"
            y1={y}
            y2={y}
            stroke="var(--border)"
            strokeWidth="0.6"
            strokeDasharray="2 4"
          />
        ))}
        <polygon fill={color} opacity="0.12" points={areaPoints} />
        <polyline
          fill="none"
          points={points}
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.4"
        />
      </svg>
    </div>
  );
}
