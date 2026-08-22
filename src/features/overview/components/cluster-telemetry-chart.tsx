import { useState, useEffect, useMemo, useRef } from "react";
import { TrendingUp, Clock, Cpu, Network, HardDrive, Folder } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { EChart } from "@/shared/charts/echart";
import type { EChartsType } from "echarts/core";
import { useThemeStore, resolveThemeMode } from "@/shared/stores/theme-store";
import type { MetricType, TimeRange, NodePulse, TelemetryPoint } from "../types";
import { getMockTelemetryByRange, computeTelemetrySummary } from "../mock/telemetry-mock";

interface ClusterTelemetryChartProps {
  fleetNodes: NodePulse[];
  availableGroups?: Array<{ group: string; count: number; hasWarn: boolean }>;
  onSelectNode: (node: NodePulse) => void;
}

export function ClusterTelemetryChart({
  fleetNodes,
  availableGroups,
  onSelectNode: _onSelectNode
}: ClusterTelemetryChartProps) {
  const [metricType, setMetricType] = useState<MetricType>("compute");
  const [timeRange, setTimeRange] = useState<TimeRange>("live");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const themeMode = useThemeStore((state) => state.mode);
  const isDark = resolveThemeMode(themeMode) === "dark";

  const chartRef = useRef<EChartsType | null>(null);

  // Available groups for dropdown
  const groupsList = useMemo(() => {
    if (availableGroups && availableGroups.length > 0) return availableGroups;
    const map = new Map<string, number>();
    fleetNodes.forEach((n) => map.set(n.group, (map.get(n.group) || 0) + 1));
    return Array.from(map.entries()).map(([group, count]) => ({ group, count, hasWarn: false }));
  }, [availableGroups, fleetNodes]);

  // Target nodes filtered by selected group
  const targetedNodes = useMemo(() => {
    if (selectedGroup === "all") return fleetNodes;
    return fleetNodes.filter((n) => n.group === selectedGroup);
  }, [fleetNodes, selectedGroup]);

  // Base aggregate calculation from targetedNodes
  const liveBase = useMemo(() => {
    if (!targetedNodes.length) {
      return { cpu: 34, memory: 58, ingress: 840, egress: 610, diskWrite: 240, diskRead: 185 };
    }
    const cpu = Math.round(targetedNodes.reduce((acc, n) => acc + n.cpu, 0) / targetedNodes.length);
    const memory = Math.round(targetedNodes.reduce((acc, n) => acc + n.memory, 0) / targetedNodes.length);
    const ingress = Math.round(cpu * 22 + 100);
    const egress = Math.round(cpu * 16 + 80);
    const diskWrite = Math.round(cpu * 6 + 40);
    const diskRead = Math.round(cpu * 4.5 + 30);

    return { cpu, memory, ingress, egress, diskWrite, diskRead };
  }, [targetedNodes]);

  // Rolling real-time telemetry buffer (for live mode)
  const [liveBuffer, setLiveBuffer] = useState<TelemetryPoint[]>(() => {
    return getMockTelemetryByRange("live");
  });

  // Append new live sample every 2 seconds when in live mode
  useEffect(() => {
    if (timeRange !== "live") return;

    const timer = setInterval(() => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

      setLiveBuffer((prev) => [
        ...prev.slice(1),
        {
          time: timeStr,
          timestamp: now.getTime(),
          cpu: Math.max(10, liveBase.cpu + Math.floor(Math.random() * 7 - 3)),
          memory: Math.max(20, liveBase.memory + Math.floor(Math.random() * 5 - 2)),
          ingress: Math.max(200, liveBase.ingress + Math.floor(Math.random() * 80 - 40)),
          egress: Math.max(150, liveBase.egress + Math.floor(Math.random() * 60 - 30)),
          diskWrite: Math.max(50, liveBase.diskWrite + Math.floor(Math.random() * 30 - 15)),
          diskRead: Math.max(30, liveBase.diskRead + Math.floor(Math.random() * 20 - 10))
        }
      ]);
    }, 2000);

    return () => clearInterval(timer);
  }, [timeRange, liveBase]);

  // Active dataset for current timeRange
  const activeSeries = useMemo(() => {
    if (timeRange === "live") {
      return liveBuffer;
    }
    return getMockTelemetryByRange(timeRange, liveBase.cpu, liveBase.memory);
  }, [timeRange, liveBuffer, liveBase]);

  // Dynamic statistics calculated for the currently active series
  const stats = useMemo(() => {
    return computeTelemetrySummary(activeSeries, metricType);
  }, [activeSeries, metricType]);

  const [hiddenSeries, setHiddenSeries] = useState<Record<string, boolean>>({});

  const toggleSeries = (name: string) => {
    setHiddenSeries((prev) => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const getChartOption = () => {
    const timeLabels = activeSeries.map((s) => s.time);
    const textColor = isDark ? "rgba(255, 255, 255, 0.45)" : "rgba(0, 0, 0, 0.55)";
    const lineSplitColor = isDark ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)";
    const tooltipBg = isDark ? "rgba(10, 10, 15, 0.94)" : "rgba(255, 255, 255, 0.96)";
    const tooltipBorder = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)";
    const tooltipText = isDark ? "#ffffff" : "#111827";

    const baseConfig = {
      animationDuration: timeRange === "live" ? 300 : 700,
      grid: { left: "2%", right: "2%", top: "8%", bottom: "6%", containLabel: true },
      tooltip: {
        trigger: "axis" as const,
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        textStyle: { color: tooltipText, fontSize: 12, fontFamily: "monospace" }
      },
      legend: {
        show: false
      },
      xAxis: {
        type: "category" as const,
        data: timeLabels,
        axisLine: { lineStyle: { color: lineSplitColor } },
        axisLabel: { color: textColor, fontSize: 11, fontFamily: "monospace" },
        boundaryGap: false
      },
      yAxis: {
        type: "value" as const,
        splitLine: { lineStyle: { color: lineSplitColor, type: "dashed" as const } },
        axisLabel: {
          color: textColor,
          fontSize: 11,
          fontFamily: "monospace",
          formatter: (val: number) => {
            if (metricType === "compute") return `${val}%`;
            if (metricType === "traffic") return `${val} M`;
            return `${val} M/s`;
          }
        }
      }
    };

    const hasData = (pts?: (number | null | undefined)[]) =>
      Array.isArray(pts) && pts.length > 0 && pts.some((p) => typeof p === "number" && !Number.isNaN(p));

    if (metricType === "compute") {
      const cpuName = "集群 CPU 总体使用率";
      const memName = "集群内存加权占用率";
      const cpuData = activeSeries.map((d) => d.cpu);
      const memData = activeSeries.map((d) => d.memory);

      const seriesList = [
        hasData(cpuData)
          ? {
              name: cpuName,
              type: "line" as const,
              smooth: 0.35,
              showSymbol: false,
              data: hiddenSeries[cpuName] ? [] : cpuData,
              lineStyle: { width: 2.5, color: "#6366f1" },
              areaStyle: hiddenSeries[cpuName]
                ? undefined
                : {
                    color: {
                      type: "linear" as const,
                      x: 0,
                      y: 0,
                      x2: 0,
                      y2: 1,
                      colorStops: [
                        { offset: 0, color: "rgba(99, 102, 241, 0.35)" },
                        { offset: 1, color: "rgba(99, 102, 241, 0.00)" }
                      ]
                    }
                  }
            }
          : null,
        hasData(memData)
          ? {
              name: memName,
              type: "line" as const,
              smooth: 0.35,
              showSymbol: false,
              data: hiddenSeries[memName] ? [] : memData,
              lineStyle: { width: 2, color: "#10b981" },
              areaStyle: hiddenSeries[memName]
                ? undefined
                : {
                    color: {
                      type: "linear" as const,
                      x: 0,
                      y: 0,
                      x2: 0,
                      y2: 1,
                      colorStops: [
                        { offset: 0, color: "rgba(16, 185, 129, 0.25)" },
                        { offset: 1, color: "rgba(16, 185, 129, 0.00)" }
                      ]
                    }
                  }
            }
          : null
      ].filter((s): s is NonNullable<typeof s> => s !== null);

      return {
        ...baseConfig,
        series: seriesList
      };
    }

    if (metricType === "traffic") {
      const inName = "入站网络吞吐 (Ingress)";
      const outName = "出站网络吞吐 (Egress)";
      const ingressData = activeSeries.map((d) => d.ingress);
      const egressData = activeSeries.map((d) => d.egress);

      const seriesList = [
        hasData(ingressData)
          ? {
              name: inName,
              type: "line" as const,
              smooth: 0.35,
              showSymbol: false,
              data: hiddenSeries[inName] ? [] : ingressData,
              lineStyle: { width: 2.5, color: "#06b6d4" },
              areaStyle: hiddenSeries[inName]
                ? undefined
                : {
                    color: {
                      type: "linear" as const,
                      x: 0,
                      y: 0,
                      x2: 0,
                      y2: 1,
                      colorStops: [
                        { offset: 0, color: "rgba(6, 182, 212, 0.35)" },
                        { offset: 1, color: "rgba(6, 182, 212, 0.00)" }
                      ]
                    }
                  }
            }
          : null,
        hasData(egressData)
          ? {
              name: outName,
              type: "line" as const,
              smooth: 0.35,
              showSymbol: false,
              data: hiddenSeries[outName] ? [] : egressData,
              lineStyle: { width: 2, color: "#8b5cf6" },
              areaStyle: hiddenSeries[outName]
                ? undefined
                : {
                    color: {
                      type: "linear" as const,
                      x: 0,
                      y: 0,
                      x2: 0,
                      y2: 1,
                      colorStops: [
                        { offset: 0, color: "rgba(139, 92, 246, 0.20)" },
                        { offset: 1, color: "rgba(139, 92, 246, 0.00)" }
                      ]
                    }
                  }
            }
          : null
      ].filter((s): s is NonNullable<typeof s> => s !== null);

      return {
        ...baseConfig,
        series: seriesList
      };
    }

    // Disk I/O
    const writeName = "磁盘写入速率 (Write)";
    const readName = "磁盘读取速率 (Read)";
    const writeData = activeSeries.map((d) => d.diskWrite);
    const readData = activeSeries.map((d) => d.diskRead);

    const seriesList = [
      hasData(writeData)
        ? {
            name: writeName,
            type: "line" as const,
            smooth: 0.35,
            showSymbol: false,
            data: hiddenSeries[writeName] ? [] : writeData,
            lineStyle: { width: 2.5, color: "#f59e0b" },
            areaStyle: hiddenSeries[writeName]
              ? undefined
              : {
                  color: {
                    type: "linear" as const,
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                      { offset: 0, color: "rgba(245, 158, 11, 0.30)" },
                      { offset: 1, color: "rgba(245, 158, 11, 0.00)" }
                    ]
                  }
                }
          }
        : null,
      hasData(readData)
        ? {
            name: readName,
            type: "line" as const,
            smooth: 0.35,
            showSymbol: false,
            data: hiddenSeries[readName] ? [] : readData,
            lineStyle: { width: 2, color: "#60a5fa" },
            areaStyle: hiddenSeries[readName]
              ? undefined
              : {
                  color: {
                    type: "linear" as const,
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [
                      { offset: 0, color: "rgba(96, 165, 250, 0.20)" },
                      { offset: 1, color: "rgba(96, 165, 250, 0.00)" }
                    ]
                  }
                }
          }
        : null
    ].filter((s): s is NonNullable<typeof s> => s !== null);

    return {
      ...baseConfig,
      series: seriesList
    };
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              <CardTitle className="text-base">全网核心性能时序遥测 (Cluster Telemetry Streams)</CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground font-mono">
              <span>
                当前目标: <strong className="text-foreground">{selectedGroup === "all" ? "全网全量集群" : selectedGroup}</strong> ({targetedNodes.length} 节点)
              </span>
              <span>·</span>
              <span>采样: {timeRange === "live" ? "2s/Tick 实时推流" : "历史聚合加权"}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Metric Switcher Tabs */}
            <div className="flex items-center rounded-lg border border-border/80 bg-muted/30 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setMetricType("compute")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                  metricType === "compute"
                    ? "bg-card text-foreground font-bold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Cpu className="size-3.5 text-indigo-400" />
                算力与内存
              </button>
              <button
                type="button"
                onClick={() => setMetricType("traffic")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                  metricType === "traffic"
                    ? "bg-card text-foreground font-bold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Network className="size-3.5 text-cyan-400" />
                网络带宽
              </button>
              <button
                type="button"
                onClick={() => setMetricType("disk")}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                  metricType === "disk"
                    ? "bg-card text-foreground font-bold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <HardDrive className="size-3.5 text-amber-400" />
                磁盘 I/O
              </button>
            </div>

            {/* Business Group Selector */}
            <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-2.5 py-1 text-xs">
              <Folder className="size-3.5 text-primary shrink-0" />
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="bg-transparent text-xs text-foreground font-semibold outline-none cursor-pointer pr-1"
              >
                <option value="all" className="bg-popover text-foreground">
                  全网全量集群 ({fleetNodes.length})
                </option>
                {groupsList.map((g) => (
                  <option key={g.group} value={g.group} className="bg-popover text-foreground">
                    {g.group} ({g.count})
                  </option>
                ))}
              </select>
            </div>

            {/* Expanded Time Range Dropdown */}
            <div className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-2.5 py-1 text-xs">
              <Clock className="size-3.5 text-muted-foreground shrink-0" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className="bg-transparent text-xs text-foreground font-semibold outline-none cursor-pointer pr-1"
              >
                <option value="live" className="bg-popover text-foreground">实时推流 (Live 2s)</option>
                <option value="15m" className="bg-popover text-foreground">最近 15 分钟 (15m)</option>
                <option value="1h" className="bg-popover text-foreground">最近 1 小时 (1h)</option>
                <option value="6h" className="bg-popover text-foreground">最近 6 小时 (6h)</option>
                <option value="24h" className="bg-popover text-foreground">最近 24 小时 (24h)</option>
                <option value="7d" className="bg-popover text-foreground">最近 7 天 (7d)</option>
                <option value="30d" className="bg-popover text-foreground">最近 30 天 (30d)</option>
                <option value="90d" className="bg-popover text-foreground">最近 90 天 (90d)</option>
                <option value="1y" className="bg-popover text-foreground">最近 1 年 (1y)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Telemetry Stats HUD Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-3">
          <div className="rounded-lg border border-border/70 bg-muted/20 p-2 text-xs">
            <span className="text-[10px] text-muted-foreground font-mono">
              {metricType === "compute" ? "CPU 平均负载" : metricType === "traffic" ? "入站平均带宽" : "写入平均速率"}
            </span>
            <div className="text-sm font-bold font-mono text-primary mt-0.5">
              {stats.avg} {metricType === "compute" ? "%" : metricType === "traffic" ? "MB/s" : "MB/s"}
            </div>
          </div>

          <div className="rounded-lg border border-border/70 bg-muted/20 p-2 text-xs">
            <span className="text-[10px] text-muted-foreground font-mono">
              {metricType === "compute" ? "CPU 峰值" : metricType === "traffic" ? "入站峰值" : "写入峰值"}
            </span>
            <div className="text-sm font-bold font-mono text-indigo-400 mt-0.5">
              {stats.peak} {metricType === "compute" ? "%" : metricType === "traffic" ? "MB/s" : "MB/s"}
            </div>
          </div>

          <div className="rounded-lg border border-border/70 bg-muted/20 p-2 text-xs">
            <span className="text-[10px] text-muted-foreground font-mono">P95 压力分位数</span>
            <div className="text-sm font-bold font-mono text-cyan-400 mt-0.5">
              {stats.p95} {metricType === "compute" ? "%" : metricType === "traffic" ? "MB/s" : "MB/s"}
            </div>
          </div>

          <div className="rounded-lg border border-border/70 bg-muted/20 p-2 text-xs">
            <span className="text-[10px] text-muted-foreground font-mono">
              {metricType === "compute" ? "内存平均占用" : metricType === "traffic" ? "出站平均带宽" : "读取平均速率"}
            </span>
            <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
              {stats.val2Avg} {metricType === "compute" ? "%" : metricType === "traffic" ? "MB/s" : "MB/s"}
            </div>
          </div>

          <div className="rounded-lg border border-border/70 bg-muted/20 p-2 text-xs col-span-2 sm:col-span-1">
            <span className="text-[10px] text-muted-foreground font-mono">
              {metricType === "compute" ? "内存峰值占用" : metricType === "traffic" ? "出站峰值" : "读取峰值"}
            </span>
            <div className="text-sm font-bold font-mono text-violet-400 mt-0.5">
              {stats.val2Peak} {metricType === "compute" ? "%" : metricType === "traffic" ? "MB/s" : "MB/s"}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-1 space-y-2">
        {/* Native Chart Style Interactive Legend Bar */}
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1.5 px-2 font-mono text-xs">
          {(metricType === "compute"
            ? [
                { name: "集群 CPU 总体使用率", label: "CPU 使用率", barBg: "bg-indigo-500", hasData: activeSeries.some((d) => typeof d.cpu === "number") },
                { name: "集群内存加权占用率", label: "内存占用率", barBg: "bg-emerald-500", hasData: activeSeries.some((d) => typeof d.memory === "number") }
              ]
            : metricType === "traffic"
            ? [
                { name: "入站网络吞吐 (Ingress)", label: "入站吞吐 (Ingress)", barBg: "bg-cyan-500", hasData: activeSeries.some((d) => typeof d.ingress === "number") },
                { name: "出站网络吞吐 (Egress)", label: "出站吞吐 (Egress)", barBg: "bg-violet-500", hasData: activeSeries.some((d) => typeof d.egress === "number") }
              ]
            : [
                { name: "磁盘写入速率 (Write)", label: "磁盘写入 (Write)", barBg: "bg-amber-500", hasData: activeSeries.some((d) => typeof d.diskWrite === "number") },
                { name: "磁盘读取速率 (Read)", label: "磁盘读取 (Read)", barBg: "bg-blue-500", hasData: activeSeries.some((d) => typeof d.diskRead === "number") }
              ]
          )
            .filter((item) => item.hasData)
            .map((item) => {
            const isVisible = !hiddenSeries[item.name];
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => toggleSeries(item.name)}
                className={`inline-flex items-center gap-1.5 py-0.5 px-1 rounded transition-all cursor-pointer select-none ${
                  isVisible
                    ? "text-muted-foreground/90 hover:text-foreground"
                    : "text-muted-foreground/35 line-through opacity-50"
                }`}
                title={`点击${isVisible ? "隐藏" : "显示"} ${item.label}`}
              >
                <span
                  className={`h-2.5 w-4 rounded-xs transition-colors shrink-0 ${
                    isVisible ? item.barBg : "bg-muted-foreground/25"
                  }`}
                />
                <span className="text-[11px]">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="h-[260px] w-full">
          <EChart option={getChartOption()} className="h-full w-full" notMerge={false} />
        </div>
      </CardContent>
    </Card>
  );
}
