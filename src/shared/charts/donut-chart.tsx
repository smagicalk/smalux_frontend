import { clampPercent } from "@/shared/charts/chart-utils";

type DonutChartProps = {
  value: number;
  label: string;
  detail: string;
  color?: string;
};

export function DonutChart({
  value,
  label,
  detail,
  color = "var(--chart-1)"
}: DonutChartProps) {
  const percent = clampPercent(value);
  const dash = `${percent} ${100 - percent}`;

  return (
    <div className="flex items-center gap-4 rounded-[1.1rem] bg-[color:var(--surface-muted)] p-4 dark:bg-white/6">
      <svg
        role="img"
        aria-label={label}
        viewBox="0 0 42 42"
        className="size-24 shrink-0 -rotate-90"
      >
        <circle
          cx="21"
          cy="21"
          fill="transparent"
          r="15.915"
          stroke="var(--border)"
          strokeWidth="5"
        />
        <circle
          cx="21"
          cy="21"
          fill="transparent"
          r="15.915"
          stroke={color}
          strokeDasharray={dash}
          strokeLinecap="round"
          strokeWidth="5"
        />
      </svg>
      <div className="min-w-0">
        <p className="text-3xl font-semibold tracking-[-0.04em]">{Math.round(percent)}%</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}
