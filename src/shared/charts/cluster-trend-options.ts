import type { EChartsOption } from "./echart";
import { areaGradient, chartPalette, chartRamp, strokeGradient, withTheme } from "./echart";
import { formatCpuPercent, formatRate } from "@/shared/lib/utils";

import { S } from "./chart-base";

export type TrendSeries = { name: string; values: (number | null)[] };

/**
 * Stacked-area cluster throughput: top-K talkers stacked, plus one "其它"
 * band aggregating the rest, so the total area = cluster throughput and the
 * bands show who's burning the bandwidth. Replaces the old one-line-per-node
 * chart, which turned into an unreadable soup past ~30 nodes.
 *
 * Callers hand us the per-talker series followed by an "其它" aggregate series
 * (already summed). We just render them stacked — the selection/stabilization
 * lives in the overview feature, not here.
 */
export function clusterThroughputStackedOption(
  timestamps: number[],
  series: TrendSeries[]
): EChartsOption {
  const palette = chartPalette();
  const ramp = chartRamp(palette);
  return withTheme({
    ...S,
    tooltip: { trigger: "axis", valueFormatter: (v) => formatRate(Number(v)) },
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
      const isOther = s.name === "其它";
      const c = isOther ? palette.muted : ramp[i % ramp.length];
      return {
        name: s.name,
        type: "line",
        stack: "throughput",
        showSymbol: false,
        smooth: 0.3,
        // A subtle stroke so bands stay separable; "其它" is dimmer still.
        lineStyle: { width: isOther ? 1 : 1.5, color: c, opacity: isOther ? 0.5 : 0.9 },
        itemStyle: { color: c },
        areaStyle: { color: areaGradient(c, isOther ? "33" : "44", "03") },
        emphasis: { focus: "series" },
        data: timestamps.map((t, j) => [t, s.values[j] ?? null])
      };
    })
  });
}

/**
 * Cluster CPU trend with a stabilized top-K focus: one bold **集群均值** line
 * as the spine (CPU% isn't additive, so stacking is meaningless — the mean is
 * the honest summary), plus up to K highlighted per-node lines for the
 * hottest boxes so an outlier jumps out. The mean line is expected as the
 * first series (named "集群均值"); the rest are top-K talkers.
 */
export function clusterCpuFocusOption(
  timestamps: number[],
  series: TrendSeries[]
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
      const isMean = s.name === "集群均值";
      if (isMean) {
        // The spine: rich gradient stroke, a soft fill, drawn on top so it
        // reads as the headline series regardless of series order.
        return {
          name: s.name,
          type: "line",
          showSymbol: false,
          smooth: 0.3,
          z: 5,
          lineStyle: { width: 3, color: strokeGradient(palette), shadowColor: palette.cyan, shadowBlur: 12 },
          itemStyle: { color: palette.cyan },
          areaStyle: { color: areaGradient(palette.cyan, "33", "02") },
          emphasis: { focus: "series", lineStyle: { width: 4, shadowBlur: 18 } },
          data: timestamps.map((t, j) => [t, s.values[j] ?? null])
        };
      }
      const c = ramp[(i - 1) % ramp.length];
      return {
        name: s.name,
        type: "line",
        showSymbol: false,
        smooth: 0.3,
        lineStyle: { width: 1.5, color: c, shadowColor: c, shadowBlur: 6, opacity: 0.9 },
        itemStyle: { color: c },
        areaStyle: { color: areaGradient(c, "22", "01") },
        emphasis: { focus: "series", lineStyle: { width: 2.5, shadowBlur: 12 } },
        data: timestamps.map((t, j) => [t, s.values[j] ?? null])
      };
    })
  });
}
