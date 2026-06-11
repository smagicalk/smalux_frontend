type MiniTrendChartProps = {
  values: number[];
  label: string;
};

export function MiniTrendChart({ values, label }: MiniTrendChartProps) {
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 36 - (Math.max(0, Math.min(value, 100)) / 100) * 32;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-[1rem] bg-[color:var(--surface-muted)] p-2.5 dark:bg-white/6">
      <svg
        role="img"
        aria-label={label}
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        className="h-12 w-full overflow-visible"
      >
        <polyline
          fill="none"
          points={points}
          stroke="var(--chart-1)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}
