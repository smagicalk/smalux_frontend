import type { EChartsOption } from "./echart";
import { areaGradient, chartPalette, chartRamp, strokeGradient, withTheme } from "./echart";
import { formatCpuPercent, formatRate } from "@/shared/lib/utils";

import { S } from "./chart-base";

/**
 * Multi-line cluster CPU trend. Each online server is one line over the
 * shared timestamp axis, with a glow + gradient stroke.
 */
export function clusterCpuTrendOption(
  timestamps: number[],
  series: { id: string; name: string; values: (number | null)[] }[]
): EChartsOption {
  const palette = chartPalette();
  const ramp = chartRamp(palette);
  return withTheme({
    ...S,
    tooltip: { trigger: "axis", valueFormatter: (v) => formatCpuPercent(Number(v)) },
    legend: { top: 0, textStyle: { color: palette.muted, fontSize: 11 }, type: "scroll", icon: "circle", itemWidth: 8, itemHeight: 8 },
    grid: { left: 8, right: 16, top: 32, bottom: 8, containLabel: true },
    xAxis: {
      type: "time",
      axisLine: { lineStyle: { color: palette.border } },
      axisLabel: { color: palette.muted, fontSize: 10, hideOverlap: true }
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 1,
      axisLabel: { color: palette.muted, fontSize: 10, formatter: (v: number) => `${Math.round(v * 100)}%` },
      splitLine: { lineStyle: { color: palette.border, type: "dashed" } }
    },
    series: series.map((s, i) => {
      const c = ramp[i % ramp.length];
      return {
        name: s.name,
        type: "line",
        showSymbol: false,
        smooth: 0.3,
        lineStyle: { width: 2, color: c, shadowColor: c, shadowBlur: 8 },
        itemStyle: { color: c },
        areaStyle: { color: areaGradient(c), opacity: 0.1 },
        emphasis: { focus: "series", lineStyle: { width: 3, shadowBlur: 14 } },
        data: timestamps.map((t, j) => [t, s.values[j] ?? null])
      };
    })
  });
}

/**
 * Multi-line cluster throughput trend — same shape as clusterCpuTrendOption
 * but the y axis is a byte-per-second rate instead of a 0..1 ratio. Used for
 * the 集群流量 chart so 上行/下行/总 (or per-node) each get their own line
 * over the shared timestamp axis, with values aligned by ts (not by array
 * index, which would misalign when servers sample at different times).
 */
export function clusterThroughputTrendOption(
  timestamps: number[],
  series: { name: string; values: (number | null)[] }[]
): EChartsOption {
  const palette = chartPalette();
  const ramp = chartRamp(palette);
  return withTheme({
    ...S,
    tooltip: {
      trigger: "axis",
      valueFormatter: (v) => formatRate(Number(v))
    },
    legend: { top: 0, textStyle: { color: palette.muted, fontSize: 11 }, type: "scroll", icon: "circle", itemWidth: 8, itemHeight: 8 },
    grid: { left: 8, right: 16, top: 32, bottom: 8, containLabel: true },
    xAxis: {
      type: "time",
      axisLine: { lineStyle: { color: palette.border } },
      axisLabel: { color: palette.muted, fontSize: 10, hideOverlap: true }
    },
    yAxis: {
      type: "value",
      min: 0,
      axisLabel: { color: palette.muted, fontSize: 10, formatter: (v: number) => formatRate(v) },
      splitLine: { lineStyle: { color: palette.border, type: "dashed" } }
    },
    series: series.map((s, i) => {
      const c = ramp[i % ramp.length];
      return {
        name: s.name,
        type: "line",
        showSymbol: false,
        smooth: 0.3,
        lineStyle: { width: 2, color: c, shadowColor: c, shadowBlur: 8 },
        itemStyle: { color: c },
        areaStyle: { color: areaGradient(c), opacity: 0.1 },
        emphasis: { focus: "series", lineStyle: { width: 3, shadowBlur: 14 } },
        data: timestamps.map((t, j) => [t, s.values[j] ?? null])
      };
    })
  });
}

/** Smooth area trend: a single value series over time with a gradient fill. */
export function areaTrendOption(
  points: { ts: number; value: number }[],
  opts: { unit?: string; max?: number; color?: string } = {}
): EChartsOption {
  const palette = chartPalette();
  const color = opts.color ?? palette.cyan;
  return withTheme({
    ...S,
    tooltip: { trigger: "axis", valueFormatter: (v) => (opts.unit ? `${v}${opts.unit}` : `${v}`) },
    grid: { left: 8, right: 16, top: 14, bottom: 8, containLabel: true },
    xAxis: {
      type: "time",
      axisLine: { lineStyle: { color: palette.border } },
      axisLabel: { color: palette.muted, fontSize: 10, hideOverlap: true }
    },
    yAxis: {
      type: "value",
      max: opts.max,
      axisLabel: { color: palette.muted, fontSize: 10 },
      splitLine: { lineStyle: { color: palette.border, type: "dashed" } }
    },
    series: [
      {
        type: "line",
        smooth: 0.3,
        showSymbol: false,
        lineStyle: { width: 2.5, color: strokeGradient(palette), shadowColor: color, shadowBlur: 12 },
        itemStyle: { color },
        areaStyle: { color: areaGradient(color, "55", "02") },
        emphasis: { lineStyle: { width: 3, shadowBlur: 18 } },
        data: points.map((p) => [p.ts, p.value])
      }
    ]
  });
}

/**
 * Multi-line ping latency trend for one server's detail page. Each probe
 * target (gateway / DNS / public ingress / neighbor) is its own line over the
 * shared timestamp axis, so a congested hop to one neighbor reads as one
 * climbing line rather than shifting the whole cluster. Null values draw as
 * gaps (probe timeouts) — an unreachable target breaks its line instead of
 * dropping to 0. Y axis is raw ms.
 */
export function pingLatencyOption(
  timestamps: number[],
  series: { name: string; values: (number | null)[] }[],
  opts: { smooth?: number | boolean; showSymbol?: boolean } = {}
): EChartsOption {
  const palette = chartPalette();
  const ramp = chartRamp(palette);
  // Default to false (raw polyline) so jitter and probe spikes read exactly;
  // callers opt into smoothing via the toggle.
  const smooth = opts.smooth ?? false;
  return withTheme({
    ...S,
    tooltip: { trigger: "axis", valueFormatter: (v) => (v == null ? "超时" : `${Math.round(Number(v))} ms`) },
    legend: { top: 0, textStyle: { color: palette.muted, fontSize: 11 }, type: "scroll", icon: "circle", itemWidth: 8, itemHeight: 8 },
    grid: { left: 8, right: 16, top: 32, bottom: 8, containLabel: true },
    xAxis: {
      type: "time",
      axisLine: { lineStyle: { color: palette.border } },
      axisLabel: { color: palette.muted, fontSize: 10, hideOverlap: true }
    },
    yAxis: {
      type: "value",
      min: 0,
      axisLabel: { color: palette.muted, fontSize: 10, formatter: (v: number) => `${Math.round(v)} ms` },
      splitLine: { lineStyle: { color: palette.border, type: "dashed" } }
    },
    series: series.map((s, i) => {
      const c = ramp[i % ramp.length];
      return {
        name: s.name,
        type: "line",
        showSymbol: opts.showSymbol ?? false,
        // `smooth` is caller-controlled: a low value keeps jitter/spikes legible
        // (default), a high value flattens a noisy live stream into a trend.
        smooth,
        connectNulls: false,
        lineStyle: { width: 2, color: c, shadowColor: c, shadowBlur: 6 },
        itemStyle: { color: c },
        emphasis: { focus: "series", lineStyle: { width: 3, shadowBlur: 12 } },
        data: timestamps.map((t, j) => [t, s.values[j] ?? null])
      };
    })
  });
}

/**
 * Disk IO speed — two lines (read / write) over the shared timestamp axis, y
 * axis in bytes/s. Null values (collection switch off, or a sample with no IO
 * data) draw as gaps so a disabled period reads as a break, not a 0. Used by
 * the server detail page so disk throughput has its own chart instead of just
 * a number in the metric grid.
 */
export function diskIoOption(
  timestamps: number[],
  series: { name: string; values: (number | null)[]; color: string }[],
  opts: { smooth?: number | boolean } = {}
): EChartsOption {
  const palette = chartPalette();
  return withTheme({
    ...S,
    tooltip: { trigger: "axis", valueFormatter: (v) => (v == null ? "-" : formatRate(Number(v))) },
    legend: { top: 0, textStyle: { color: palette.muted, fontSize: 11 }, type: "scroll", icon: "circle", itemWidth: 8, itemHeight: 8 },
    grid: { left: 8, right: 16, top: 32, bottom: 8, containLabel: true },
    xAxis: {
      type: "time",
      axisLine: { lineStyle: { color: palette.border } },
      axisLabel: { color: palette.muted, fontSize: 10, hideOverlap: true }
    },
    yAxis: {
      type: "value",
      min: 0,
      axisLabel: { color: palette.muted, fontSize: 10, formatter: (v: number) => formatRate(v) },
      splitLine: { lineStyle: { color: palette.border, type: "dashed" } }
    },
    series: series.map((s) => ({
      name: s.name,
      type: "line",
      showSymbol: false,
      smooth: opts.smooth ?? false,
      connectNulls: false,
      lineStyle: { width: 2, color: s.color, shadowColor: s.color, shadowBlur: 6 },
      itemStyle: { color: s.color },
      areaStyle: { color: areaGradient(s.color, "33", "02") },
      emphasis: { focus: "series", lineStyle: { width: 3, shadowBlur: 12 } },
      data: timestamps.map((t, j) => [t, s.values[j] ?? null])
    }))
  });
}
