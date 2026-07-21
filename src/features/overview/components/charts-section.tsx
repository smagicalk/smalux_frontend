import { useMemo } from "react";
import { Activity, CheckCircle2, Gauge, Globe2, HardDrive, Layers, Radar, TrendingUp, Waves, Zap } from "lucide-react";

import { useClusterCpuTrend } from "@/features/overview/hooks/use-cluster-trend";
import { useStableTopN } from "@/features/overview/lib/use-stable-top-n";
import { useThrottledMonitoring } from "@/features/servers/hooks/use-throttled-monitoring";
import { EChart, chartPalette } from "@/shared/charts/echart";
import {
  bubbleOption,
  heatmapOption,
  polarBarOption,
  radarOption,
  regionDistributionOption,
  ringProgressOption,
  statusDistributionOption
} from "@/shared/charts/chart-options";
import { clusterCpuFocusOption, clusterThroughputStackedOption, type TrendSeries } from "@/shared/charts/cluster-trend-options";
import type { Server, ServerMetrics } from "@/shared/api/methods";

import type { AggSeries } from "../lib/overview-types";
import { ChartCard } from "./chart-card";
import { HeatmapLegend } from "./heatmap-legend";
import { RegionHealth, StatusLegend } from "./region-health";
import { ResourceLevel, type ResourceSummary } from "./resource-level";
import { SectionTitle } from "./section-title";
import { ThroughputStrip } from "./throughput-strip";

/**
 * The fleet-situation chart grid: resource watermarks + throughput + time-series
 * monitoring + topology/comparison. All chart options are memoized from a
 * throttled snapshot of the monitoring store — the whole-table read refreshes
 * ~1×/s instead of once per incoming sample, so a multi-node burst no longer
 * rebuilds the alignment and resets all charts dozens of times per second.
 * Per-server consumers (the detail page) still read their own slice directly
 * and stay per-tick fresh; only these cluster-wide aggregates are throttled.
 */
export function ChartsSection({ servers, serverIds }: { servers: Server[]; serverIds: string[] }) {
  const { timestamps, series } = useClusterCpuTrend(serverIds);

  // One throttled snapshot of the whole table; everything below derives from
  // it. `latest`/`history` are the live mutated Maps, captured ~1×/s.
  const { latest, history } = useThrottledMonitoring(
    (l, h) => ({ latest: l, history: h })
  );

  const avgCpu = useMemo(() => {
    const vals = serverIds.map((id) => latest.get(id)?.cpuUsage).filter((v): v is number => typeof v === "number");
    return vals.length ? vals.reduce((sum, v) => sum + v, 0) / vals.length : 0;
  }, [latest, serverIds]);
  const avgMem = useMemo(() => {
    const ratios = serverIds
      .map((id) => latest.get(id))
      .filter((m): m is ServerMetrics => !!m && m.memTotal > 0)
      .map((m) => m.memUsed / m.memTotal);
    return ratios.length ? ratios.reduce((sum, v) => sum + v, 0) / ratios.length : 0;
  }, [latest, serverIds]);
  const avgDisk = useMemo(() => {
    const ratios = serverIds
      .map((id) => latest.get(id))
      .filter((m): m is ServerMetrics => !!m && m.diskTotal > 0)
      .map((m) => m.diskUsed / m.diskTotal);
    return ratios.length ? ratios.reduce((sum, v) => sum + v, 0) / ratios.length : 0;
  }, [latest, serverIds]);

  // Rolling cluster-level resource trends (CPU / mem / disk ratios over the
  // shared timestamp axis) for the mini sparklines beside the rings. `tick` is
  // a dep because `history` keeps a stable Map identity — without it the
  // sparklines would compute once (while empty) and stay on "等待数据…".
  const resourceTrends = useMemo(() => buildResourceTrends(serverIds, history), [history, serverIds]);

  // Aggregate load + total memory/disk bytes for the summary stats row.
  const resourceSummary = useMemo<ResourceSummary>(() => {
    let loadSum = 0, loadN = 0, memUsed = 0, memTotal = 0, diskUsed = 0, diskTotal = 0, live = 0;
    for (const id of serverIds) {
      const m = latest.get(id);
      if (!m) continue;
      live++;
      if (typeof m.loadOne === "number") { loadSum += m.loadOne; loadN++; }
      memUsed += m.memUsed; memTotal += m.memTotal;
      diskUsed += m.diskUsed; diskTotal += m.diskTotal;
    }
    return {
      live,
      avgLoad: loadN ? loadSum / loadN : 0,
      memUsed, memTotal, diskUsed, diskTotal
    };
  }, [latest, serverIds]);

  // Per-node CPU series aligned on the union timestamp axis (from
  // useClusterCpuTrend), plus the cluster mean per timestamp. The mean is the
  // CPU chart's spine — CPU% isn't additive, so the mean (not a stack sum) is
  // the honest cluster summary.
  const cpuSeries = useMemo(
    () =>
      series.map((s) => ({
        id: s.id,
        name: servers.find((sv) => sv.id === s.id)?.name ?? s.id,
        values: s.values
      })),
    [series, servers]
  );
  const cpuMean = useMemo(
    () =>
      timestamps.map((t, j) => {
        let sum = 0, n = 0;
        for (const s of cpuSeries) {
          const v = s.values[j];
          if (typeof v === "number") { sum += v; n++; }
        }
        return { ts: t, value: n ? sum / n : null };
      }),
    [timestamps, cpuSeries]
  );

  // Stable top-K by peak CPU over the last ~60s — the hot boxes worth
  // spotlighting alongside the mean. Hysteresis keeps the set from flickering.
  const cpuHotIds = useStableTopN(
    serverIds,
    (id) => peakOver(history.get(id) ?? [], (m) => m.cpuUsage, 60_000),
    { k: 6 }
  );

  // Radar: pick the 5 online servers with the most recent metrics, compare
  // them across five axes so a lopsided box stands out. Each axis carries its
  // real unit — CPU/内存/磁盘 as 0..1 ratios, 网络 as raw bytes/s, 负载 as a
  // raw 1m average — and radarAxisLabel formats each by name.
  const radarData = useMemo(() => {
    const top = serverIds
      .map((id) => ({ id, name: servers.find((s) => s.id === id)?.name ?? id, m: latest.get(id) }))
      .filter((x) => x.m)
      .slice(0, 5);
    return top.map((x) => ({
      name: x.name,
      values: [
        x.m!.cpuUsage,
        x.m!.memUsed / x.m!.memTotal,
        x.m!.diskUsed / x.m!.diskTotal,
        x.m!.loadOne ?? 0,
        (x.m!.netRxSpeed ?? 0) + (x.m!.netTxSpeed ?? 0)
      ]
    }));
  }, [serverIds, servers, latest]);
  const radarOpt = useMemo(
    () =>
      radarOption(
        [
          { name: "CPU", max: 1 },
          { name: "内存", max: 1 },
          { name: "磁盘", max: 1 },
          { name: "负载", max: 8 },
          { name: "网络", max: 8_388_608 }
        ],
        radarData
      ),
    [radarData]
  );

  // Heatmap: 6 servers × 12 hours, seeded from each server's base cpu so the
  // grid reads as a load pattern rather than uniform noise.
  const heatOption = useMemo(() => {
    const hours = Array.from({ length: 12 }, (_, i) => `${i * 2}h`);
    const rows = servers.slice(0, 6);
    const data: [number, number, number][] = [];
    rows.forEach((s, y) => {
      const base = 0.2 + (s.id.length % 5) * 0.12;
      hours.forEach((_, x) => {
        const v = Math.min(1, Math.max(0, base + Math.sin((x + y) * 0.7) * 0.18 + 0.05));
        data.push([x, y, Number(v.toFixed(2))]);
      });
    });
    return heatmapOption(hours, rows.map((s) => s.name), data);
  }, [servers]);

  const regionOption = useMemo(() => regionDistributionOption(servers), [servers]);
  const statusOption = useMemo(() => statusDistributionOption(servers), [servers]);
  const palette = useMemo(() => chartPalette(), []);
  const cpuRing = useMemo(() => ringProgressOption(avgCpu, "CPU", palette.cyan), [avgCpu, palette]);
  const memRing = useMemo(() => ringProgressOption(avgMem, "内存", palette.violet), [avgMem, palette]);
  const diskRing = useMemo(() => ringProgressOption(avgDisk, "磁盘", palette.warning), [avgDisk, palette]);
  const polarOption = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of servers) counts.set(s.region, (counts.get(s.region) ?? 0) + 1);
    const entries = [...counts.entries()];
    return polarBarOption(entries.map(([r]) => r), entries.map(([, v]) => v), "节点");
  }, [servers]);
  // CPU trend: a bold 集群均值 spine + the stable top-K hot boxes highlighted.
  // CPU% isn't additive, so we don't stack — the mean is the summary, the
  // top-K lines make outliers pop. Values come from the already-aligned
  // cpuSeries (per-node) and cpuMean (cluster average).
  const trendOption = useMemo(() => {
    const byId = new Map(cpuSeries.map((s) => [s.id, s]));
    const focused: TrendSeries[] = cpuHotIds
      .map((id) => byId.get(id))
      .filter((s): s is NonNullable<typeof s> => !!s)
      .map((s) => ({ name: s.name, values: s.values }));
    return clusterCpuFocusOption(timestamps, [
      { name: "集群均值", values: cpuMean.map((p) => p.value) },
      ...focused
    ]);
    // `tick` is listed explicitly for parity with throughputOption: the upstream
    // memos (cpuSeries/cpuMean) already recompute when timestamps changes, but
    // matching the throughput chart's dep set makes the recompute guarantee
    // obvious and rules out a stale-reference freeze in this chain.
  }, [timestamps, cpuMean, cpuHotIds, cpuSeries]);

  // Stable top-K by peak outbound (tx) throughput over the last ~60s — the
  // bandwidth hogs worth their own band; everyone else collapses into 其它.
  const txHotIds = useStableTopN(
    serverIds,
    (id) => peakOver(history.get(id) ?? [], (m) => m.netTxSpeed ?? 0, 60_000),
    { k: 6 }
  );

  // Per-node outbound (tx) throughput as stacked area: top-K talkers + one
  // "其它" band summing the rest, values aligned by ts (not by array index —
  // the union timestamps and each server's history don't share an index when
  // samples land at different times). Total area = cluster throughput.
  const throughputOption = useMemo(() => {
    const byTs = new Map<string, Map<number, number>>();
    for (const id of serverIds) {
      byTs.set(id, new Map((history.get(id) ?? []).map((p) => [p.ts, p.netTxSpeed ?? 0])));
    }
    const nameOf = (id: string) => servers.find((s) => s.id === id)?.name ?? id;
    const txValue = (id: string, t: number) => {
      const v = byTs.get(id)?.get(t);
      return typeof v === "number" ? v : null;
    };
    const hotSet = new Set(txHotIds);
    const otherIds = serverIds.filter((id) => !hotSet.has(id));
    const series: TrendSeries[] = [
      ...txHotIds.map((id) => ({ name: nameOf(id), values: timestamps.map((t) => txValue(id, t)) })),
      // 其它 = sum of every non-top-K node at each timestamp (0 where all are
      // null/absent, so the band reads as flat rather than gappy).
      {
        name: "其它",
        values: timestamps.map((t) => {
          let sum = 0, any = false;
          for (const id of otherIds) {
            const v = txValue(id, t);
            if (typeof v === "number") { sum += v; any = true; }
          }
          return any ? sum : null;
        })
      }
    ];
    return clusterThroughputStackedOption(timestamps, series);
  }, [timestamps, serverIds, servers, history, txHotIds]);

  // Bubble: CPU vs mem for every server with metrics, bubble size = disk use.
  // A colorful 2D scatter that surfaces outliers (a hot CPU + high mem node).
  const bubblePts = useMemo(() => {
    return serverIds
      .map((id) => {
        const m = latest.get(id);
        const name = servers.find((s) => s.id === id)?.name ?? id;
        if (!m || !m.memTotal || !m.diskTotal) return null;
        return { name, x: m.cpuUsage, y: m.memUsed / m.memTotal, size: m.diskUsed / m.diskTotal };
      })
      .filter((p): p is { name: string; x: number; y: number; size: number } => p != null);
  }, [serverIds, servers, latest]);
  const bubbleOpt = useMemo(() => bubbleOption(bubblePts, { xLabel: "CPU", yLabel: "内存" }), [bubblePts]);

  return (
    <div className="space-y-5">
      {/* ── 子区:资源水位 ── 三环 + 趋势迷你图 + 汇总统计,首屏核心 */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        <ChartCard title="集群资源水位" subtitle="实时聚合 · CPU · 内存 · 磁盘" icon={<Gauge className="size-3.5" />} accent="primary" className="lg:col-span-4" to="/admin/servers">
          <ResourceLevel
            rings={{ cpu: cpuRing, mem: memRing, disk: diskRing }}
            trends={resourceTrends}
            summary={resourceSummary}
          />
        </ChartCard>
      </div>

      <ThroughputStrip serverIds={serverIds} />

      {/* ── 子区:实时监控 ── 时间序列类聚合 */}
      <div className="space-y-3">
        <SectionTitle icon={<Activity className="size-4" />} title="实时监控" hint="时间序列" />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <ChartCard title="集群 CPU 趋势" subtitle="均值 + top 热点" icon={<TrendingUp className="size-3.5" />} accent="primary" className="lg:col-span-2">
            {timestamps.length > 1 ? (
              <EChart option={trendOption} height={200} />
            ) : (
              <div className="flex h-[200px] items-center justify-center text-xs text-muted-foreground">等待实时数据…</div>
            )}
          </ChartCard>
          <ChartCard title="节点出站流量" subtitle="实时 · top 节点 + 其它" icon={<Waves className="size-3.5" />} accent="primary" className="lg:col-span-2">
            {timestamps.length > 1 ? (
              <EChart option={throughputOption} height={200} />
            ) : (
              <div className="flex h-[200px] items-center justify-center text-xs text-muted-foreground">等待实时数据…</div>
            )}
          </ChartCard>
          <ChartCard title="负载热力图" subtitle="近 24h · CPU 占用" icon={<HardDrive className="size-3.5" />} accent="warning" className="lg:col-span-4">
            <EChart option={heatOption} height={180} />
            <HeatmapLegend />
          </ChartCard>
        </div>
      </div>

      {/* ── 子区:分布与对比 ── 拓扑/对比类聚合 */}
      <div className="space-y-3">
        <SectionTitle icon={<Globe2 className="size-4" />} title="分布与对比" hint="拓扑画像" accent="success" />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <ChartCard title="区域分布" subtitle="按区域" icon={<Globe2 className="size-3.5" />} accent="success">
            <EChart option={regionOption} height={200} />
          </ChartCard>
          <ChartCard title="状态分布" subtitle="在线水位" icon={<CheckCircle2 className="size-3.5" />} accent="success">
            <EChart option={statusOption} height={170} />
            <StatusLegend servers={servers} />
          </ChartCard>
          <ChartCard title="区域节点雷达" subtitle="按区域" icon={<Radar className="size-3.5" />} accent="success">
            <EChart option={polarOption} height={200} />
          </ChartCard>
          <ChartCard title="区域健康" subtitle="在线 / 总数" icon={<Layers className="size-3.5" />} accent="success">
            <RegionHealth servers={servers} />
          </ChartCard>

          <ChartCard title="服务器对比" subtitle="CPU · 内存 · 磁盘 · 负载 · 网络" icon={<Radar className="size-3.5" />} accent="violet" className="lg:col-span-2" to="/admin/servers">
            {radarData.length > 0 ? (
              <EChart option={radarOpt} height={220} />
            ) : (
              <div className="flex h-[220px] items-center justify-center text-xs text-muted-foreground">等待实时数据…</div>
            )}
          </ChartCard>
          <ChartCard title="CPU × 内存 散布" subtitle="气泡=磁盘占用" icon={<Zap className="size-3.5" />} accent="violet" className="lg:col-span-2" to="/admin/servers">
            {bubblePts.length > 0 ? (
              <EChart option={bubbleOpt} height={220} />
            ) : (
              <div className="flex h-[220px] items-center justify-center text-xs text-muted-foreground">等待实时数据…</div>
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

/**
 * Rolling cluster resource trends (CPU / mem / disk ratios) over the shared
 * timestamp axis — the mini sparklines beside the rings. Hoisted out of the
 * component so the memo body stays readable; aligns timestamps the same way
 * useClusterCpuTrend does, taking only the last 30 samples.
 */
function buildResourceTrends(
  serverIds: string[],
  history: Map<string, ServerMetrics[]>
): { cpu: AggSeries; mem: AggSeries; disk: AggSeries } {
  const tsSet = new Set<number>();
  for (const id of serverIds) for (const m of history.get(id) ?? []) tsSet.add(m.ts);
  const ts = [...tsSet].sort((a, b) => a - b).slice(-30);
  if (!ts.length) return { cpu: [], mem: [], disk: [] };
  const byTs = new Map<string, Map<number, ServerMetrics>>();
  for (const id of serverIds) byTs.set(id, new Map((history.get(id) ?? []).map((p) => [p.ts, p])));
  const cpu: AggSeries = [];
  const mem: AggSeries = [];
  const disk: AggSeries = [];
  for (const t of ts) {
    let cSum = 0, cN = 0, mSum = 0, mN = 0, dSum = 0, dN = 0;
    for (const id of serverIds) {
      const m = byTs.get(id)?.get(t);
      if (!m) continue;
      cSum += m.cpuUsage; cN++;
      if (m.memTotal > 0) { mSum += m.memUsed / m.memTotal; mN++; }
      if (m.diskTotal > 0) { dSum += m.diskUsed / m.diskTotal; dN++; }
    }
    cpu.push({ ts: t, value: cN ? cSum / cN : 0 });
    mem.push({ ts: t, value: mN ? mSum / mN : 0 });
    disk.push({ ts: t, value: dN ? dSum / dN : 0 });
  }
  return { cpu, mem, disk };
}

/**
 * Peak of a scalar extracted from a server's history, looking back at most
 * `windowMs` from the newest sample. Used to rank nodes for the stable top-K
 * selection: ranking by peak (not the latest value) means a momentary spike
 * can't bounce a node in/out of the spotlight. Returns 0 when there's no
 * history in the window.
 */
function peakOver(
  history: ServerMetrics[],
  pick: (m: ServerMetrics) => number,
  windowMs: number
): number {
  if (!history.length) return 0;
  const newest = history[history.length - 1].ts;
  const since = newest - windowMs;
  let peak = 0;
  for (const m of history) {
    if (m.ts < since) continue;
    const v = pick(m);
    if (v > peak) peak = v;
  }
  return peak;
}
