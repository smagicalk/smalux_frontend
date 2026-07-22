import { type ReactNode, useMemo, useState } from "react";

import { RealtimeLineChart, resolveVar } from "@/shared/charts/realtime-line-chart";
import { EChart, chartPalette, type EChartsOption } from "@/shared/charts/echart";
import { ChartPopout } from "@/shared/charts/chart-popout";
import { diskIoOption, metricBreakdownOption, pingLatencyOption, ringProgressOption } from "@/shared/charts/chart-options";
import { cn, formatBytes, formatCpuPercent, formatPercent, formatRate } from "@/shared/lib/utils";
import type { PingHistoryRange, ServerMetrics } from "@/shared/api/methods";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { usePingSamples } from "../hooks/use-server-ping";
import type { DetailMultiSeries } from "../hooks/use-server-detail-series";
import { Switch } from "@/shared/ui/switch";
import { ChartCard, MonitoringOverlay } from "./server-detail-cards";

type Point = { ts: number; value: number | null };

interface MetricBreakdown {
  detailLabel: string;
  option: EChartsOption | null;
  monitored: boolean;
  emptyText: string;
  note: string;
}

/** Aggregate history and the latest device snapshot are separate views. */
function MetricBreakdownTabs({ breakdown, children }: { breakdown: MetricBreakdown; children: ReactNode }) {
  return (
    <Tabs defaultValue="trend" className="flex min-h-0 flex-col">
      <TabsList className="px-0">
        <TabsTrigger value="trend">趋势</TabsTrigger>
        <TabsTrigger value="details">{breakdown.detailLabel}</TabsTrigger>
      </TabsList>
      <TabsContent value="trend" className="overflow-visible p-0 pt-2">{children}</TabsContent>
      <TabsContent value="details" className="overflow-visible p-0 pt-2">
        <MonitoringOverlay monitored={breakdown.monitored}>
          {breakdown.option ? (
            <EChart option={breakdown.option} height={320} />
          ) : (
            <div className="h-[320px]" aria-label={breakdown.emptyText} />
          )}
        </MonitoringOverlay>
        <div className="px-2 pt-2 text-[11px] text-muted-foreground">{breakdown.note}</div>
      </TabsContent>
    </Tabs>
  );
}

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
      <MonitoringOverlay monitored={!!metrics}>
        <div className={hasSwap ? "grid grid-cols-4 gap-2" : "grid grid-cols-3 gap-2"}>
          <EChart option={cpuRing} height={130} />
          <EChart option={memRing} height={130} />
          <EChart option={diskRing} height={130} />
          {swapRing ? <EChart option={swapRing} height={130} /> : null}
        </div>
      </MonitoringOverlay>
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
  write,
  deviceRead,
  deviceWrite
}: {
  metrics: ServerMetrics | undefined;
  read: Point[];
  write: Point[];
  deviceRead: DetailMultiSeries;
  deviceWrite: DetailMultiSeries;
}) {
  const palette = useMemo(() => chartPalette(), []);
  // Three states, mirroring the switchable-metrics convention: no metrics at
  // all (offline/just-registered) → "等待数据"; metrics present but the disk-IO
  // collection switch is off → "关闭统计"; switch on with data → the chart.
  const hasMetrics = !!metrics;
  const enabled = hasMetrics && !!metrics!.diskIoEnabled && !!metrics!.diskIo;
  const [open, setOpen] = useState(false);
  const deviceOption = useMemo(() => {
    const series = [...deviceRead.series, ...deviceWrite.series];
    return series.length > 0 && deviceRead.timestamps.length > 1
      ? metricBreakdownOption(deviceRead.timestamps, series, "rate", {
          // Separate legend components force a stable two-row pairing: every
          // disk appears in the read row first and the write row beneath it.
          legendRows: [
            deviceRead.series.map((item) => item.name),
            deviceWrite.series.map((item) => item.name)
          ]
        })
      : null;
  }, [deviceRead, deviceWrite]);
  const breakdown: MetricBreakdown = {
    detailLabel: "硬盘明细",
    option: deviceOption,
    monitored: enabled,
    emptyText: "当前 Agent 仅提供磁盘汇总，没有可绘制的块设备历史。",
    note: "图例按块设备区分读速与写速；点击图例可单独隐藏或显示某条线。"
  };

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
      <ChartCard
        title="磁盘 IO 速度"
        subtitle="读 / 写"
        value={value}
        onExpand={hasMetrics ? () => setOpen(true) : undefined}
      >
        <MonitoringOverlay monitored={enabled}>
          {option ? <EChart option={option} height={140} /> : <div className="h-[140px]" />}
        </MonitoringOverlay>
      </ChartCard>

      <ChartPopout
        title="磁盘详情"
        subtitle="汇总与块设备"
        value={value}
        open={open}
        onOpenChange={(v) => { if (!v) setOpen(false); }}
        footer={read.length > 0 ? sampleContext(read) : undefined}
      >
        <MetricBreakdownTabs breakdown={breakdown}>
          <MonitoringOverlay monitored={enabled}>
            {option ? <EChart option={option} height={320} /> : <div className="h-[320px]" />}
          </MonitoringOverlay>
        </MetricBreakdownTabs>
      </ChartPopout>
    </>
  );
}

/** Three live sparklines: CPU, 内存, 网络 (aggregate). Click any to pop out a
 *  larger, axis-labelled version. */
export function LiveStrip({
  metrics,
  cpu,
  mem,
  net,
  cpuCores,
  networkInterfaces
}: {
  metrics: ServerMetrics | undefined;
  cpu: Point[];
  mem: Point[];
  net: Point[];
  cpuCores: DetailMultiSeries;
  networkInterfaces: DetailMultiSeries;
}) {
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
  const cpuCoreOption = useMemo(
    () => cpuCores.series.length > 0 && cpuCores.timestamps.length > 1
      ? metricBreakdownOption(cpuCores.timestamps, cpuCores.series, "percent")
      : null,
    [cpuCores]
  );
  const networkInterfaceOption = useMemo(
    () => networkInterfaces.series.length > 0 && networkInterfaces.timestamps.length > 1
      ? metricBreakdownOption(networkInterfaces.timestamps, networkInterfaces.series, "rate")
      : null,
    [networkInterfaces]
  );
  const breakdown: MetricBreakdown | null = open === "cpu"
    ? {
        detailLabel: "核心明细",
        option: cpuCoreOption,
        monitored: !!metrics && cpuCores.series.length > 0,
        emptyText: "当前 Agent 仅提供 CPU 汇总，没有可绘制的逻辑核心历史。",
        note: "每条折线代表一个逻辑核心；CPU 总占用是全部核心的平均值。"
      }
    : open === "net"
      ? {
          detailLabel: "网卡明细",
          option: networkInterfaceOption,
          monitored: !!metrics && networkInterfaces.series.length > 0,
          emptyText: "当前 Agent 仅提供网络汇总，没有可绘制的网卡历史。",
          note: "每条折线代表一张网卡的接收与发送速率合计。"
        }
      : null;

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <ChartCard title="CPU" value={metrics ? formatCpuPercent(metrics.cpuUsage) : "-"} onExpand={() => setOpen("cpu")}>
        <MonitoringOverlay monitored={!!metrics}><RealtimeLineChart points={cpu} height={120} color={resolveVar("--primary")} domain={[0, 1]} /></MonitoringOverlay>
      </ChartCard>
      <ChartCard title="内存" value={metrics ? formatBytes(metrics.memUsed) : "-"} onExpand={() => setOpen("mem")}>
        <MonitoringOverlay monitored={!!metrics}><RealtimeLineChart points={mem} height={120} color={resolveVar("--success")} domain={[0, 1]} /></MonitoringOverlay>
      </ChartCard>
      <ChartCard title="网络" subtitle="总流量" value={metrics ? formatRate(metrics.netRxSpeed + metrics.netTxSpeed) : "-"} onExpand={() => setOpen("net")}>
        <MonitoringOverlay monitored={!!metrics}><RealtimeLineChart points={net} height={120} color={resolveVar("--primary")} /></MonitoringOverlay>
      </ChartCard>

      <ChartPopout
        title={expanded?.title ?? ""}
        subtitle={expanded?.subtitle}
        value={expanded?.value}
        open={!!expanded}
        onOpenChange={(v) => { if (!v) setOpen(null); }}
        footer={expanded && expanded.points.length > 0 ? sampleContext(expanded.points) : undefined}
      >
        {expanded && breakdown ? (
          <MetricBreakdownTabs breakdown={breakdown}>
            <MonitoringOverlay monitored={!!metrics}>
              <RealtimeLineChart key={expanded.key} points={expanded.points} height={320} color={expanded.color} domain={expanded.domain} label={expanded.title} formatValue={expanded.formatValue} detailed />
            </MonitoringOverlay>
          </MetricBreakdownTabs>
        ) : expanded ? (
          <MonitoringOverlay monitored={!!metrics}>
            <RealtimeLineChart key={expanded.key} points={expanded.points} height={320} color={expanded.color} domain={expanded.domain} label={expanded.title} formatValue={expanded.formatValue} detailed />
          </MonitoringOverlay>
        ) : null}
      </ChartPopout>
    </div>
  );
}

/** Separate up/down network sparklines — the finer-grained net detail. Click
 *  either to pop out a larger, axis-labelled version. */
export function NetworkSplit({
  metrics,
  tx,
  rx,
  interfaceTx,
  interfaceRx
}: {
  metrics: ServerMetrics | undefined;
  tx: Point[];
  rx: Point[];
  interfaceTx: DetailMultiSeries;
  interfaceRx: DetailMultiSeries;
}) {
  const [open, setOpen] = useState<null | "tx" | "rx">(null);
  const interfaceOption = useMemo(() => {
    const detail = open === "tx" ? interfaceTx : interfaceRx;
    return open && detail.series.length > 0 && detail.timestamps.length > 1
      ? metricBreakdownOption(detail.timestamps, detail.series, "rate")
      : null;
  }, [open, interfaceTx, interfaceRx]);
  const breakdown: MetricBreakdown = {
    detailLabel: "网卡明细",
    option: interfaceOption,
    monitored: !!metrics && (open === "tx" ? interfaceTx.series.length > 0 : interfaceRx.series.length > 0),
    emptyText: "当前 Agent 仅提供网络汇总，没有可绘制的网卡历史。",
    note: `每条折线代表一张网卡的${open === "tx" ? "发送" : "接收"}速率。`
  };
  const expanded = open
    ? open === "tx"
      ? { key: open, title: "网络上行", value: metrics ? formatRate(metrics.netTxSpeed) : "-", points: tx, color: resolveVar("--warning"), formatValue: (v: number) => formatRate(v) }
      : { key: open, title: "网络下行", value: metrics ? formatRate(metrics.netRxSpeed) : "-", points: rx, color: resolveVar("--primary"), formatValue: (v: number) => formatRate(v) }
    : null;

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      <ChartCard title="网络上行" value={metrics ? formatRate(metrics.netTxSpeed) : "-"} onExpand={() => setOpen("tx")}>
        <MonitoringOverlay monitored={!!metrics}><RealtimeLineChart points={tx} height={100} color={resolveVar("--warning")} /></MonitoringOverlay>
      </ChartCard>
      <ChartCard title="网络下行" value={metrics ? formatRate(metrics.netRxSpeed) : "-"} onExpand={() => setOpen("rx")}>
        <MonitoringOverlay monitored={!!metrics}><RealtimeLineChart points={rx} height={100} color={resolveVar("--primary")} /></MonitoringOverlay>
      </ChartCard>

      <ChartPopout
        title={expanded?.title ?? ""}
        value={expanded?.value}
        open={!!expanded}
        onOpenChange={(v) => { if (!v) setOpen(null); }}
        footer={expanded && expanded.points.length > 0 ? sampleContext(expanded.points) : undefined}
      >
        {expanded ? (
          <MetricBreakdownTabs breakdown={breakdown}>
            <MonitoringOverlay monitored={!!metrics}>
              <RealtimeLineChart key={expanded.key} points={expanded.points} height={300} color={expanded.color} label={expanded.title} formatValue={expanded.formatValue} detailed />
            </MonitoringOverlay>
          </MetricBreakdownTabs>
        ) : null}
      </ChartPopout>
    </div>
  );
}

type ProcessSort = "cpu" | "memory" | "network";

const PROCESS_SORTS: { value: ProcessSort; label: string }[] = [
  { value: "cpu", label: "CPU" },
  { value: "memory", label: "内存" },
  { value: "network", label: "网络" }
];

/** Final two-column operational row: connection history and hot processes. */
export function ConnectionAndProcessRow({
  metrics,
  tcp,
  udp
}: {
  metrics: ServerMetrics | undefined;
  tcp: Point[];
  udp: Point[];
}) {
  const [connectionOpen, setConnectionOpen] = useState(false);
  const connectionMonitored = !!metrics && (!!metrics.tcpEnabled || !!metrics.udpEnabled);
  const connectionOption = useMemo(() => {
    const timestamps = tcp.map((point) => point.ts);
    const series = [
      ...(metrics?.tcpEnabled ? [{ name: "TCP", values: tcp.map((point) => point.value) }] : []),
      ...(metrics?.udpEnabled ? [{ name: "UDP", values: udp.map((point) => point.value) }] : [])
    ];
    return timestamps.length > 1 && series.length > 0
      ? metricBreakdownOption(timestamps, series, "count")
      : null;
  }, [metrics?.tcpEnabled, metrics?.udpEnabled, tcp, udp]);
  const connectionValue = metrics
    ? `TCP ${metrics.tcpConnections ?? "-"} · UDP ${metrics.udpConnections ?? "-"}`
    : "-";

  const connectionPoints = tcp.length > 0 ? tcp : udp;

  return (
    <>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <ChartCard
          title="连接数趋势"
          subtitle="TCP / UDP"
          value={connectionValue}
          onExpand={() => setConnectionOpen(true)}
        >
          <MonitoringOverlay monitored={connectionMonitored}>
            {connectionOption ? <EChart option={connectionOption} height={240} /> : <div className="h-[240px]" />}
          </MonitoringOverlay>
        </ChartCard>
        <ProcessList metrics={metrics} />
      </div>

      {/* Reuse the exact inline option so TCP/UDP colors, enabled protocols and
          null gaps stay identical between the compact card and enlarged view. */}
      <ChartPopout
        title="连接数趋势"
        subtitle="TCP / UDP"
        value={connectionValue}
        open={connectionOpen}
        onOpenChange={setConnectionOpen}
        footer={connectionPoints.length > 0 ? sampleContext(connectionPoints) : undefined}
      >
        <MonitoringOverlay monitored={connectionMonitored}>
          {connectionOption ? <EChart option={connectionOption} height={340} /> : <div className="h-[340px]" />}
        </MonitoringOverlay>
      </ChartPopout>
    </>
  );
}

function ProcessList({ metrics }: { metrics: ServerMetrics | undefined }) {
  const monitored = !!metrics?.processesEnabled;
  return (
    <ChartCard title="进程列表" subtitle="资源占用排序" value={metrics ? `${metrics.processCount} 个` : "-"}>
      <MonitoringOverlay monitored={monitored}>
        <Tabs defaultValue="cpu" className="flex h-[240px] min-h-0 flex-col">
          <TabsList className="shrink-0 px-0">
            {PROCESS_SORTS.map((sort) => <TabsTrigger key={sort.value} value={sort.value}>{sort.label}</TabsTrigger>)}
          </TabsList>
          {PROCESS_SORTS.map((sort) => (
            <TabsContent key={sort.value} value={sort.value} className="overflow-y-auto p-0 pt-1">
              <ProcessRows processes={metrics?.processes ?? []} sort={sort.value} />
            </TabsContent>
          ))}
        </Tabs>
      </MonitoringOverlay>
    </ChartCard>
  );
}

type ProcessMetric = ServerMetrics["processes"][number];

function ProcessRows({ processes, sort }: { processes: ProcessMetric[]; sort: ProcessSort }) {
  const sorted = [...processes]
    .sort((left, right) => processSortValue(right, sort) - processSortValue(left, sort))
    .slice(0, 5);

  if (!sorted.length) {
    return <div className="flex h-44 items-center justify-center text-xs text-muted-foreground">暂无进程数据</div>;
  }

  return (
    <div role="table" aria-label={`按${sort}排序的进程`}>
      <div className="grid grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(4rem,1fr))] gap-2 border-b border-border px-2 py-1.5 text-[10px] text-muted-foreground" role="row">
        <span role="columnheader">进程</span>
        <span className="text-right" role="columnheader">CPU</span>
        <span className="text-right" role="columnheader">内存</span>
        <span className="text-right" role="columnheader">网络</span>
      </div>
      {sorted.map((process) => (
        <div key={process.pid} className="grid grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(4rem,1fr))] items-center gap-2 border-b border-border/70 px-2 py-1 text-xs last:border-b-0" role="row">
          <div className="min-w-0" role="rowheader">
            <div className="truncate font-medium">{process.name}</div>
            <div className="text-[10px] text-muted-foreground">PID {process.pid}</div>
          </div>
          <span className="text-right font-mono tabular-nums" role="cell">{formatCpuPercent(process.cpuUsage)}</span>
          <span className="text-right font-mono tabular-nums" role="cell">{formatBytes(process.memUsed)}</span>
          <span className="text-right font-mono tabular-nums" role="cell">{formatRate(process.netRxSpeed + process.netTxSpeed)}</span>
        </div>
      ))}
    </div>
  );
}

function processSortValue(process: ProcessMetric, sort: ProcessSort): number {
  if (sort === "cpu") return process.cpuUsage;
  if (sort === "memory") return process.memUsed;
  return process.netRxSpeed + process.netTxSpeed;
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
        // Range and smoothing controls must not open the dialog, so the card
        // keeps its chart-only click handler while still advertising that the
        // visualization is interactive when the pointer enters the panel.
        className="cursor-pointer [&_canvas]:cursor-pointer"
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
        <MonitoringOverlay monitored={hasProbes}>
          {isLoading ? (
            <div className="flex h-[140px] items-center justify-center text-xs text-muted-foreground">加载中…</div>
          ) : option ? (
            // Click the chart (not the whole card) to pop out a larger view —
            // keeps the range/smooth controls free of the expand trigger.
            <div className="cursor-pointer" onClick={() => setOpen(true)} role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(true); } }}>
              <EChart option={option} height={140} />
            </div>
          ) : <div className="h-[140px]" />}
        </MonitoringOverlay>
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
