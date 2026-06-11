type Segment = {
  label: string;
  value: number;
  color: string;
};

type SegmentedBarProps = {
  segments: Segment[];
  label: string;
};

export function SegmentedBar({ segments, label }: SegmentedBarProps) {
  const total = Math.max(
    segments.reduce((sum, segment) => sum + segment.value, 0),
    1
  );

  return (
    <div role="img" aria-label={label} className="grid gap-3">
      <div className="flex h-4 overflow-hidden rounded-full bg-[color:var(--surface-muted)] dark:bg-white/6">
        {segments.map((segment) => (
          <span
            key={segment.label}
            style={{
              width: `${(segment.value / total) * 100}%`,
              backgroundColor: segment.color
            }}
            aria-label={`${segment.label}: ${segment.value}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {segments.map((segment) => (
          <span
            key={segment.label}
            className="inline-flex items-center gap-2 rounded-full bg-[color:var(--surface-muted)] px-2.5 py-1 dark:bg-white/6"
          >
            <span
              className="size-2 rounded-sm"
              style={{ backgroundColor: segment.color }}
              aria-hidden
            />
            {segment.label} {segment.value}
          </span>
        ))}
      </div>
    </div>
  );
}
