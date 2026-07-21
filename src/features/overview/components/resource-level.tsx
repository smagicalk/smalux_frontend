import { EChart, type EChartsOption } from "@/shared/charts/echart";
import { Sparkline } from "@/shared/charts/sparkline";
import { formatBytes } from "@/shared/lib/utils";

import type { AggSeries } from "../lib/overview-types";

export interface ResourceSummary {
  live: number;
  avgLoad: number;
  memUsed: number;
  memTotal: number;
  diskUsed: number;
  diskTotal: number;
}

/**
 * Cluster resource-level body: three rings (current CPU/mem/disk) on the left,
 * their recent trend sparklines in the middle, and an aggregate stats strip
 * (live nodes, avg load, total mem/disk used) on the right. Fills the
 * full-width card instead of leaving the three rings adrift in whitespace.
 */
export function ResourceLevel({
  rings,
  trends,
  summary
}: {
  rings: { cpu: EChartsOption; mem: EChartsOption; disk: EChartsOption };
  trends: { cpu: AggSeries; mem: AggSeries; disk: AggSeries };
  summary: ResourceSummary;
}) {
  const memPct = summary.memTotal ? summary.memUsed / summary.memTotal : 0;
  const diskPct = summary.diskTotal ? summary.diskUsed / summary.diskTotal : 0;
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
      {/* Rings: current CPU / mem / disk */}
      <Rings rings={rings} />
      {/* Trends: each resource's recent shape, labeled with its current % */}
      <div className="flex flex-col justify-center gap-1.5 lg:col-span-4">
        <ResourceTrend label="CPU" ratio={trends.cpu.at(-1)?.value ?? 0} color="var(--cyan)" points={trends.cpu} />
        <ResourceTrend label="内存" ratio={trends.mem.at(-1)?.value ?? 0} color="var(--violet)" points={trends.mem} />
        <ResourceTrend label="磁盘" ratio={trends.disk.at(-1)?.value ?? 0} color="var(--warning)" points={trends.disk} />
      </div>
      {/* Aggregate stats */}
      <div className="grid grid-cols-2 gap-2 self-stretch lg:col-span-3">
        <SummaryStat label="活跃上报" value={String(summary.live)} unit="节点" color="var(--primary)" />
        <SummaryStat label="平均负载" value={summary.avgLoad.toFixed(2)} unit="1m" color="var(--cyan)" />
        <SummaryStat label="内存已用" value={formatBytes(summary.memUsed)} unit={memPct ? `${Math.round(memPct * 100)}%` : "-"} color="var(--violet)" />
        <SummaryStat label="磁盘已用" value={formatBytes(summary.diskUsed)} unit={diskPct ? `${Math.round(diskPct * 100)}%` : "-"} color="var(--warning)" />
      </div>
    </div>
  );
}

/** The three ring charts side by side. Kept inline so ResourceLevel reads top-to-bottom. */
function Rings({ rings }: { rings: { cpu: EChartsOption; mem: EChartsOption; disk: EChartsOption } }) {
  return (
    <div className="grid grid-cols-3 gap-2 lg:col-span-5">
      <EChart option={rings.cpu} height={150} />
      <EChart option={rings.mem} height={150} />
      <EChart option={rings.disk} height={150} />
    </div>
  );
}

/** One resource trend row: label + current % on the left, mini sparkline right. */
function ResourceTrend({
  label,
  ratio,
  color,
  points
}: {
  label: string;
  ratio: number;
  color: string;
  points: AggSeries;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex w-16 shrink-0 flex-col">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold tabular-nums" style={{ color }}>{Math.round(ratio * 100)}%</span>
      </div>
      <div className="h-7 flex-1">
        {points.length > 1 ? (
          <Sparkline points={points} color={color} height={26} domain={[0, 1]} />
        ) : (
          <div className="flex h-full items-center text-[11px] text-muted-foreground">等待数据…</div>
        )}
      </div>
    </div>
  );
}

/** Compact stat tile: label + big value + small unit, with an accent dot. */
function SummaryStat({
  label,
  value,
  unit,
  color
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <div className="flex flex-col justify-center rounded-md border border-border bg-muted/20 px-2.5 py-2">
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
        <span className="size-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 5px ${color}` }} />
        {label}
      </div>
      <div className="mt-0.5 truncate text-sm font-semibold tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground">{unit}</div>
    </div>
  );
}
