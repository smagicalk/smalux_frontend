import type { ReactNode } from "react";
import { CheckCircle2, Cpu, Layers, Waves } from "lucide-react";

import { Sparkline, DualSparkline } from "@/shared/charts/sparkline";
import { formatCpuPercent, formatRate } from "@/shared/lib/utils";

import type { AggSeries, ClusterAggregate } from "../lib/overview-types";

interface FleetCounts {
  online: number;
  warning: number;
  offline: number;
  total: number;
}

/**
 * KPI strip with live sparklines. Each tile shows a headline number and the
 * shape of its recent history — online node count, avg CPU, and aggregate
 * throughput all drawn from the monitoring store, so the sparkline tracks the
 * same data the charts below plot. 节点总数 is a near-static count so it gets
 * a status-breakdown bar instead of a trend line; 集群流量 splits into
 * 上行/下行/总共 so direction is visible.
 */
export function KpiStrip({ counts, agg }: { counts: FleetCounts; agg: ClusterAggregate }) {
  const onlineRatio = counts.total ? counts.online / counts.total : 0;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <KpiTile
        label="节点总数"
        value={String(counts.total)}
        hint={`${agg.live.at(-1)?.value ?? 0} 活跃上报`}
        icon={<Layers className="size-4" />}
        color="var(--primary)"
      >
        <NodeStatusBar counts={counts} />
      </KpiTile>
      <KpiTile
        label="在线节点"
        value={String(counts.online)}
        hint={`在线率 ${Math.round(onlineRatio * 100)}%`}
        icon={<CheckCircle2 className="size-4" />}
        color="var(--success)"
        progress={onlineRatio}
      />
      <KpiTile
        label="集群 CPU"
        value={formatCpuPercent(agg.cpu.at(-1)?.value ?? 0)}
        hint="实时均值"
        icon={<Cpu className="size-4" />}
        color="var(--cyan)"
        points={agg.cpu}
        domain={[0, 1]}
      />
      <KpiTile
        label="集群流量"
        value={formatRate(agg.flow.at(-1)?.value ?? 0)}
        hint="上行 + 下行"
        icon={<Waves className="size-4" />}
        color="var(--violet)"
      >
        <FlowBreakdown agg={agg} />
      </KpiTile>
    </div>
  );
}

/**
 * Stacked online/warning/offline bar for the 节点总数 tile. Node count rarely
 * changes, so a trend line is meaningless — a composition bar reads the fleet
 * health at a glance instead.
 */
function NodeStatusBar({ counts }: { counts: FleetCounts }) {
  const segs = [
    { label: "在线", value: counts.online, color: "var(--success)" },
    { label: "预警", value: counts.warning, color: "var(--warning)" },
    { label: "离线", value: counts.offline, color: "var(--danger)" }
  ];
  const total = Math.max(1, counts.total);
  return (
    <div className="mt-2">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
        {segs.map((s) => s.value > 0 ? (
          <div
            key={s.label}
            className="h-full transition-all"
            style={{ width: `${(s.value / total) * 100}%`, background: s.color, boxShadow: `0 0 6px ${s.color}` }}
            title={`${s.label} ${s.value}`}
          />
        ) : null)}
      </div>
      <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
        {segs.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1">
            <span className="size-1.5 rounded-full" style={{ background: s.color }} />
            <span className="tabular-nums">{s.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * 集群流量 breakdown: a two-line mini chart (下行 rx vs 上行 tx) over the
 * shared timestamp axis, with the current 上行 / 下行 / 总共 values listed
 * below so direction is visible instead of a single merged number.
 */
function FlowBreakdown({ agg }: { agg: { flowRx: AggSeries; flowTx: AggSeries; flow: AggSeries } }) {
  const rxNow = agg.flowRx.at(-1)?.value ?? 0;
  const txNow = agg.flowTx.at(-1)?.value ?? 0;
  const rx = agg.flowRx;
  const tx = agg.flowTx;
  return (
    <div className="mt-1">
      {rx.length > 1 || tx.length > 1 ? (
        <div className="h-6 w-full">
          <DualSparkline a={rx} b={tx} aColor="var(--primary)" bColor="var(--warning)" />
        </div>
      ) : null}
      <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="text-primary">↓</span>
          <span className="tabular-nums">{formatRate(rxNow)}</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="text-warning">↑</span>
          <span className="tabular-nums">{formatRate(txNow)}</span>
        </span>
      </div>
    </div>
  );
}

function KpiTile({
  label,
  value,
  hint,
  icon,
  color,
  points,
  progress,
  domain,
  children
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  color: string;
  points?: AggSeries;
  progress?: number;
  domain?: [number, number];
  /** Custom body (status bar, flow breakdown) — takes precedence over
   *  sparkline/progress when present. */
  children?: ReactNode;
}) {
  return (
    <div className="glass cornered group relative overflow-hidden rounded-md border border-border px-3 py-2.5 transition-all hover:border-primary/40 hover:shadow-[0_4px_16px_-8px_rgba(0,0,0,0.4)]">
      <span className="absolute inset-x-0 top-0 h-px opacity-60 transition-opacity group-hover:opacity-100" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      <span className="pointer-events-none absolute -right-6 -top-6 size-16 rounded-full opacity-20 blur-xl" style={{ background: color }} />
      <div className="relative flex items-center gap-1 text-xs text-muted-foreground">
        {icon ? <span style={{ color }}>{icon}</span> : null}
        {label}
      </div>
      <div className="relative mt-1 text-2xl font-semibold tabular-nums" style={{ color }}>{value}</div>
      {children ? (
        <div className="relative">{children}</div>
      ) : points && points.length > 1 ? (
        <div className="relative mt-1 h-7 w-full">
          <Sparkline points={points} color={color} height={26} domain={domain} />
        </div>
      ) : progress != null ? (
        <div className="relative mt-2 h-1 w-full overflow-hidden rounded bg-muted">
          <div className="h-full rounded transition-all" style={{ width: `${Math.min(100, progress * 100)}%`, background: color }} />
        </div>
      ) : null}
      {hint ? <div className="relative mt-0.5 text-[11px] text-muted-foreground">{hint}</div> : null}
    </div>
  );
}
