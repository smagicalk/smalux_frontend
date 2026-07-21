import { useMemo, useState } from "react";

import { RealtimeLineChart, resolveVar } from "@/shared/charts/realtime-line-chart";
import { EChart, chartPalette } from "@/shared/charts/echart";
import { ChartPopout } from "@/shared/charts/chart-popout";
import { diskIoOption, pingLatencyOption, ringProgressOption } from "@/shared/charts/chart-options";
import { cn, formatBytes, formatCpuPercent, formatPercent, formatRate } from "@/shared/lib/utils";
import type { PingHistoryRange, ServerMetrics } from "@/shared/api/methods";

import { usePingSamples } from "../hooks/use-server-ping";
import { Switch } from "@/shared/ui/switch";
import { ChartCard } from "./server-detail-cards";

type Point = { ts: number; value: number | null };

/** Footer line for a popped-out chart: how many samples and the span they
 *  cover — gives the reader the sampling context (density + recency) so a
 *  flat-looking line can be read as "5 min, 300 points" vs "10 s, 3 points". */
function sampleContext(points: Point[]): string {
  const n = points.length;
  const s = (points[n - 1].ts - points[0].ts) / 1000;
  const span = s < 60 ? `${s.toFixed(0)} 秒` : `${Math.floor(s / 60)} 分 ${Math.round(s % 60)} 秒`;
  return `${n} 个采样点 · 覆盖 ${span}`;
}

/** Resource rings — CPU / 内存 / 磁盘 occupancy (+ Swap when configured). The
 *  former CPU gauge card duplicated the CPU ring, so it's gone; this card is
 *  the single at-a-glance resource-occupancy summary. IO speed gets its own
 *  chart next to it (DiskIoStrip). */
export function ResourceStrip({ metrics }: { metrics: ServerMetrics | undefined }) {
  const palette = useMemo(() => chartPalette(), []);
  const cpuRatio = metrics?.cpuUsage ?? 0;
  const memRatio = metrics && metrics.memTotal ? metrics.memUsed / metrics.memTotal : 0;
  const diskRatio = metrics && metrics.diskTotal ? metrics.diskUsed / metrics.diskTotal : 0;
  const hasSwap = !!metrics && metrics.swapTotal > 0;
  const swapRatio = hasSwap ? metrics!.swapUsed / metrics!.swapTotal : 0;

  const cpuRing = useMemo(() => ringProgressOption(cpuRatio, "CPU", palette.cyan), [cpuRatio, palette.cyan]);
  const memRing = useMemo(() => ringProgressOption(memRatio, "内存", palette.violet), [memRatio, palette.violet]);
  const diskRing = useMemo(() => ringProgressOption(diskRatio, "磁盘", palette.warning), [diskRatio, palette.warning]);
  // Swap only renders when the host actually has swap configured — a permanent
  // 0% ring on swap-less nodes would be noise.
  const swapRing = useMemo(
    () => (hasSwap ? ringProgressOption(swapRatio, "Swap", palette.magenta) : null),
    [hasSwap, swapRatio, palette.magenta]
  );

  return (
    <ChartCard title="资源水位" subtitle="实时占用">
      <div className={hasSwap ? "grid grid-cols-4 gap-2" : "grid grid-cols-3 gap-2"}>
        <EChart option={cpuRing} height={130} />
        <EChart option={memRing} height={130} />
        <EChart option={diskRing} height={130} />
        {swapRing ? <EChart option={swapRing} height={130} /> : null}
      </div>
    </ChartCard>
  );
}

/** Disk IO speed — read / write throughput over time, the chart the metric
 *  grid's 磁盘读速/写速 numbers only hinted at. Gated by the diskIo collection
 *  switch: when off (or no IO data), the card shows "关闭统计" instead of a
 *  flat zero line. */
export function DiskIoStrip({
  metrics,
  read,
  write
}: {
  metrics: ServerMetrics | undefined;
  read: Point[];
  write: Point[];
}) {
  const palette = useMemo(() => chartPalette(), []);
  // Three states, mirroring the switchable-metrics convention: no metrics at
  // all (offline/just-registered) → "等待数据"; metrics present but the disk-IO
  // collection switch is off → "关闭统计"; switch on with data → the chart.
  const hasMetrics = !!metrics;
  const enabled = hasMetrics && !!metrics!.diskIoEnabled && !!metrics!.diskIo;
  const [open, setOpen] = useState(false);

  const option = useMemo(() => {
    if (!enabled || read.length < 2) return null;
    return diskIoOption(
      read.map((p) => p.ts),
      [
        { name: "读速", values: read.map((p) => p.value), color: palette.cyan },
        { name: "写速", values: write.map((p) => p.value), color: palette.warning }
      ]
    );
  }, [enabled, read, write, palette.cyan, palette.warning]);

  const value = enabled && metrics?.diskIo
    ? `读 ${formatRate(metrics.diskIo.readSpeed)} · 写 ${formatRate(metrics.diskIo.writeSpeed)}`
    : hasMetrics
      ? "-"
      : "-";

  return (
    <>
      <ChartCard title="磁盘 IO 速度" subtitle="读 / 写" value={value}>
        {!hasMetrics ? (
          <div className="flex h-[120px] items-center justify-center text-xs text-muted-foreground">等待数据…</div>
        ) : !enabled ? (
          <div className="flex h-[120px] items-center justify-center text-xs text-muted-foreground/60">关闭统计</div>
        ) : option ? (
          <div className="cursor-pointer" onClick={() => setOpen(true)} role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(true); } }}>
            <EChart option={option} height={140} />
          </div>
        ) : (
          <div className="flex h-[120px] items-center justify-center text-xs text-muted-foreground">等待数据…</div>
        )}
      </ChartCard>

      <ChartPopout
        title="磁盘 IO 速度"
        subtitle="读 / 写"
        value={value}
        open={open}
        onOpenChange={(v) => { if (!v) setOpen(false); }}
        footer={read.length > 0 ? sampleContext(read) : undefined}
      >
        {option ? <EChart option={option} height={320} /> : null}
      </ChartPopout>
    </>
  );
}

/** Three live sparklines: CPU, 内存, 网络 (aggregate). Click any to pop out a
 *  larger, axis-labelled version. */
export function LiveStrip({ metrics, cpu, mem, net }: { metrics: ServerMetrics | undefined; cpu: Point[]; mem: Point[]; net: Point[] }) {
  // Which card is blown up (null = none). One popout for the strip keeps the
  // DOM light; only the expanded series needs the axes-on detailed chart.
  const [open, setOpen] = useState<null | "cpu" | "mem" | "net">(null);
  const expanded = open
    ? open === "cpu"
      ? { key: open, title: "CPU", subtitle: "占用率", value: metrics ? formatCpuPercent(metrics.cpuUsage) : "-", points: cpu, color: resolveVar("--primary"), domain: [0, 1] as [number, number], formatValue: (v: number) => formatPercent(v) }
      : open === "mem"
        ? { key: open, title: "内存", subtitle: "使用率", value: metrics ? formatBytes(metrics.memUsed) : "-", points: mem, color: resolveVar("--success"), domain: [0, 1] as [number, number], formatValue: (v: number) => formatPercent(v) }
        : { key: open, title: "网络", subtitle: "总流量", value: metrics ? formatRate(metrics.netRxSpeed + metrics.netTxSpeed) : "-", points: net, color: resolveVar("--primary"), domain: undefined, formatValue: (v: number) => formatRate(v) }
    : null;

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <ChartCard title="CPU" value={metrics ? formatCpuPercent(metrics.cpuUsage) : "-"} onExpand={() => setOpen("cpu")}>
        <RealtimeLineChart points={cpu} height={120} color={resolveVar("--primary")} domain={[0, 1]} />
      </ChartCard>
      <ChartCard title="内存" value={metrics ? formatBytes(metrics.memUsed) : "-"} onExpand={() => setOpen("mem")}>
        <RealtimeLineChart points={mem} height={120} color={resolveVar("--success")} domain={[0, 1]} />
      </ChartCard>
      <ChartCard title="网络" subtitle="总流量" value={metrics ? formatRate(metrics.netRxSpeed + metrics.netTxSpeed) : "-"} onExpand={() => setOpen("net")}>
        <RealtimeLineChart points={net} height={120} color={resolveVar("--primary")} />
      </ChartCard>

      <ChartPopout
        title={expanded?.title ?? ""}
        subtitle={expanded?.subtitle}
        value={expanded?.value}
        open={!!expanded}
        onOpenChange={(v) => { if (!v) setOpen(null); }}
        footer={expanded && expanded.points.length > 0 ? sampleContext(expanded.points) : undefined}
      >
        {expanded ? (
          <RealtimeLineChart
            key={expanded.key}
            points={expanded.points}
            height={320}
            color={expanded.color}
            domain={expanded.domain}
            label={expanded.title}
            formatValue={expanded.formatValue}
            detailed
          />
        ) : null}
      </ChartPopout>
    </div>
  );
}

/** Separate up/down network sparklines — the finer-grained net detail. Click
 *  either to pop out a larger, axis-labelled version. */
export function NetworkSplit({ metrics, tx, rx }: { metrics: ServerMetrics | undefined; tx: Point[]; rx: Point[] }) {
  const [open, setOpen] = useState<null | "tx" | "rx">(null);
  const expanded = open
    ? open === "tx"
      ? { key: open, title: "网络上行", value: metrics ? formatRate(metrics.netTxSpeed) : "-", points: tx, color: resolveVar("--warning"), formatValue: (v: number) => formatRate(v) }
      : { key: open, title: "网络下行", value: metrics ? formatRate(metrics.netRxSpeed) : "-", points: rx, color: resolveVar("--primary"), formatValue: (v: number) => formatRate(v) }
    : null;

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <ChartCard title="网络上行" value={metrics ? formatRate(metrics.netTxSpeed) : "-"} onExpand={() => setOpen("tx")}>
        <RealtimeLineChart points={tx} height={100} color={resolveVar("--warning")} />
      </ChartCard>
      <ChartCard title="网络下行" value={metrics ? formatRate(metrics.netRxSpeed) : "-"} onExpand={() => setOpen("rx")}>
        <RealtimeLineChart points={rx} height={100} color={resolveVar("--primary")} />
      </ChartCard>

      <ChartPopout
        title={expanded?.title ?? ""}
        value={expanded?.value}
        open={!!expanded}
        onOpenChange={(v) => { if (!v) setOpen(null); }}
        footer={expanded && expanded.points.length > 0 ? sampleContext(expanded.points) : undefined}
      >
        {expanded ? (
          <RealtimeLineChart
            key={expanded.key}
            points={expanded.points}
            height={300}
            color={expanded.color}
            label={expanded.title}
            formatValue={expanded.formatValue}
            detailed
          />
        ) : null}
      </ChartPopout>
    </div>
  );
}

/** Format a latency in ms for the card value / axis. Sub-millisecond probes
 *  show in μs; null reads as a probe timeout. */
function formatLatency(ms: number | null | undefined): string {
  if (ms == null) return "超时";
  if (ms < 1) return `${(ms * 1000).toFixed(0)} μs`;
  if (ms < 10) return `${ms.toFixed(1)} ms`;
  return `${Math.round(ms)} ms`;
}

/** Dedicated ping / latency chart for this server — a separate probe stream
 *  from the resource metrics, so reachability reads on its own axis (ms) rather
 *  than being buried under CPU/mem. Timeouts draw as gaps (null latency) so an
 *  unreachable box shows a broken line, not a misleading 0. Click to pop out a
 *  larger, axis-labelled view like the other strips. */
type PingRange = "live" | PingHistoryRange;

const PING_RANGES: { key: PingRange; label: string }[] = [
  { key: "live", label: "实时" },
  { key: "1h", label: "1 小时" },
  { key: "6h", label: "6 小时" },
  { key: "24h", label: "24 小时" },
  { key: "7d", label: "7 天" }
];

export function PingStrip({ serverId }: { serverId: string }) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<PingRange>("live");
  // Smooth toggle: off → near-straight segments (jitter/spikes legible); on →
  // heavier smoothing so a noisy live stream reads as a calm trend.
  const [smooth, setSmooth] = useState(false);

  // "live" reads the rolling subscribe stream; the historical ranges fetch a
  // downsampled series. Both return PingSample[] so the alignment logic below
  // is identical regardless of source.
  const { samples: ping, intervalMs, isLoading } = usePingSamples(serverId, range);

  // Stable target list: the union of every target seen across samples, in
  // first-seen order. Targets are operator-configured per server, so this set
  // is effectively fixed once the first sample lands — but computing it from
  // the stream (not a one-shot config fetch) keeps the chart self-contained.
  const targets = useMemo(() => {
    const seen = new Set<string>();
    const order: string[] = [];
    for (const s of ping) for (const p of s.probes) {
      if (!seen.has(p.target)) { seen.add(p.target); order.push(p.target); }
    }
    return order;
  }, [ping]);

  // Align every target onto the shared timestamp axis. Index each sample's
  // probes by target for O(1) lookup; a target absent from a sample (or null)
  // yields null → a gap in that line.
  const { timestamps, series } = useMemo(() => {
    const timestamps = ping.map((s) => s.ts);
    const series = targets.map((target) => ({
      name: target,
      values: ping.map((s) => {
        const p = s.probes.find((pr) => pr.target === target);
        return p ? p.latencyMs : null;
      })
    }));
    return { timestamps, series };
  }, [ping, targets]);

  const option = useMemo(
    () => timestamps.length > 1 ? pingLatencyOption(timestamps, series, { smooth: smooth ? 0.5 : false }) : null,
    [timestamps, series, smooth]
  );

  // Headline value: the latest sample's mean latency across targets that
  // answered (ignoring timeouts), so the number reflects reachable RTT. Loss
  // rate is timeouts over all probes in the window.
  const latestMean = useMemo(() => {
    const latest = ping.at(-1);
    if (!latest) return null;
    const ok = latest.probes.map((p) => p.latencyMs).filter((v): v is number => v != null);
    return ok.length ? ok.reduce((a, b) => a + b, 0) / ok.length : null;
  }, [ping]);
  const lossRate = useMemo(() => {
    let total = 0, lost = 0;
    for (const s of ping) for (const p of s.probes) { total++; if (p.latencyMs == null) lost++; }
    return total ? lost / total : 0;
  }, [ping]);

  const hasProbes = targets.length > 0;
  // Historical ranges carry a bucket size — surface it so a flat-looking 7-day
  // line reads as "每点 ≈ 1 小时" rather than "no movement".
  const density = intervalMs ? ` · 每点 ≈ ${formatBucket(intervalMs)}` : "";
  const subtitle = hasProbes
    ? `${targets.length} 个探测点 · 丢包 ${formatPercent(lossRate, 1)}${density}`
    : undefined;
  const footer = hasProbes && ping.length > 0
    ? `${ping.length} 个采样点 · 丢包 ${formatPercent(lossRate, 1)}${density}`
    : undefined;

  return (
    <div className="grid grid-cols-1 gap-3">
      <ChartCard
        title="延迟检测"
        subtitle={subtitle}
        value={hasProbes ? formatLatency(latestMean) : "-"}
      >
        <div className="mb-2 flex flex-wrap items-center gap-1">
          {PING_RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={cn(
                "rounded px-2 py-0.5 text-[11px] transition-colors",
                range === r.key
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {r.label}
            </button>
          ))}
          <label className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            平滑
            <Switch checked={smooth} onCheckedChange={setSmooth} aria-label="切换曲线平滑" />
          </label>
        </div>
        {!hasProbes ? (
          <div className="flex h-[120px] items-center justify-center text-xs text-muted-foreground">未配置探测点</div>
        ) : isLoading ? (
          <div className="flex h-[120px] items-center justify-center text-xs text-muted-foreground">加载中…</div>
        ) : option ? (
          // Click the chart (not the whole card) to pop out a larger view —
          // keeps the range/smooth controls free of the expand trigger.
          <div className="cursor-pointer" onClick={() => setOpen(true)} role="button" tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(true); } }}>
            <EChart option={option} height={140} />
          </div>
        ) : (
          <div className="flex h-[120px] items-center justify-center text-xs text-muted-foreground">等待数据…</div>
        )}
      </ChartCard>

      <ChartPopout
        title="延迟检测"
        subtitle={subtitle}
        value={hasProbes ? formatLatency(latestMean) : "-"}
        open={open}
        onOpenChange={(v) => { if (!v) setOpen(false); }}
        footer={footer}
      >
        {option ? <EChart option={option} height={340} /> : null}
      </ChartPopout>
    </div>
  );
}

/** Format a downsample bucket size (ms) as a human density label. */
function formatBucket(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)} 秒`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)} 分`;
  return `${Math.round(ms / 3_600_000)} 小时`;
}
