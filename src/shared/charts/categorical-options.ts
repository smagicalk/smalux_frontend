import type { EChartsOption } from "./echart";
import { barGradient, chartPalette, chartRamp, withTheme } from "./echart";

import { S } from "./chart-base";

/** Stacked bar: e.g. task outcomes (success/failed/running) per day. */
export function stackedBarOption(
  categories: string[],
  series: { name: string; values: number[] }[]
): EChartsOption {
  const palette = chartPalette();
  const colors = [palette.success, palette.warning, palette.danger, palette.cyan];
  return withTheme({
    ...S,
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: { top: 0, textStyle: { color: palette.muted, fontSize: 11 }, icon: "roundRect", itemWidth: 10, itemHeight: 8 },
    grid: { left: 8, right: 16, top: 32, bottom: 8, containLabel: true },
    xAxis: {
      type: "category",
      data: categories,
      axisLine: { lineStyle: { color: palette.border } },
      axisLabel: { color: palette.muted, fontSize: 10, hideOverlap: true }
    },
    yAxis: {
      type: "value",
      axisLabel: { color: palette.muted, fontSize: 10 },
      splitLine: { lineStyle: { color: palette.border, type: "dashed" } }
    },
    series: series.map((s, i) => ({
      name: s.name,
      type: "bar",
      stack: "total",
      barWidth: "46%",
      itemStyle: { color: barGradient(colors[i % colors.length]), borderRadius: i === series.length - 1 ? [5, 5, 0, 0] : [0, 0, 0, 0] },
      emphasis: { focus: "series", itemStyle: { shadowBlur: 10, shadowColor: colors[i % colors.length] } },
      data: s.values
    }))
  });
}

/** Multi-bar comparison (side-by-side, not stacked) with neon gradients. */
export function groupedBarOption(
  categories: string[],
  series: { name: string; values: number[] }[]
): EChartsOption {
  const palette = chartPalette();
  const ramp = chartRamp(palette);
  return withTheme({
    ...S,
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: { top: 0, textStyle: { color: palette.muted, fontSize: 11 }, icon: "roundRect", itemWidth: 10, itemHeight: 8 },
    grid: { left: 8, right: 16, top: 32, bottom: 8, containLabel: true },
    xAxis: { type: "category", data: categories, axisLine: { lineStyle: { color: palette.border } }, axisLabel: { color: palette.muted, fontSize: 10, hideOverlap: true } },
    yAxis: { type: "value", axisLabel: { color: palette.muted, fontSize: 10 }, splitLine: { lineStyle: { color: palette.border, type: "dashed" } } },
    series: series.map((s, i) => ({
      name: s.name,
      type: "bar",
      barWidth: "32%",
      itemStyle: { color: barGradient(ramp[i % ramp.length]), borderRadius: [5, 5, 0, 0], shadowColor: ramp[i % ramp.length], shadowBlur: 6 },
      emphasis: { focus: "series", itemStyle: { shadowBlur: 12 } },
      data: s.values
    }))
  });
}

/**
 * Rainbow bar: every bar gets its own neon color from the full ramp, each with
 * a vertical gradient + glow — the most colorful categorical view, good for a
 * small set of distinct categories (e.g. module distribution, top-N).
 */
export function rainbowBarOption(
  categories: string[],
  values: number[],
  opts: { unit?: string } = {}
): EChartsOption {
  const palette = chartPalette();
  const ramp = chartRamp(palette);
  return withTheme({
    ...S,
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, valueFormatter: (v) => (opts.unit ? `${v}${opts.unit}` : `${v}`) },
    grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
    xAxis: {
      type: "category",
      data: categories,
      axisLine: { lineStyle: { color: palette.border } },
      axisLabel: { color: palette.muted, fontSize: 10, rotate: categories.length > 6 ? 30 : 0, interval: 0, hideOverlap: false }
    },
    yAxis: { type: "value", axisLabel: { color: palette.muted, fontSize: 10 }, splitLine: { lineStyle: { color: palette.border, type: "dashed" } } },
    series: [
      {
        type: "bar",
        barWidth: "60%",
        itemStyle: { borderRadius: [6, 6, 0, 0] },
        data: values.map((v, i) => {
          const c = ramp[i % ramp.length];
          return { value: v, itemStyle: { color: barGradient(c), shadowColor: c, shadowBlur: 8 } };
        }),
        emphasis: { itemStyle: { shadowBlur: 16 } },
        markLine: {
          silent: true,
          symbol: "none",
          lineStyle: { color: palette.muted, type: "dashed", opacity: 0.5 },
          label: { color: palette.muted, fontSize: 10 },
          data: [{ type: "average", name: "均值" }]
        }
      }
    ]
  });
}

/** Horizontal bar: categorical values sorted descending (e.g. latency). */
export function horizontalBarOption(
  categories: string[],
  values: number[],
  opts: { unit?: string } = {}
): EChartsOption {
  const palette = chartPalette();
  const max = Math.max(...values, 1);
  return withTheme({
    ...S,
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: 8, right: 24, top: 8, bottom: 8, containLabel: true },
    xAxis: {
      type: "value",
      axisLabel: { color: palette.muted, fontSize: 10, formatter: (v: number) => (opts.unit ? `${v}${opts.unit}` : `${v}`) },
      splitLine: { lineStyle: { color: palette.border, type: "dashed" } }
    },
    yAxis: {
      type: "category",
      data: categories,
      axisLine: { lineStyle: { color: palette.border } },
      axisLabel: { color: palette.muted, fontSize: 11, width: 100, overflow: "truncate" }
    },
    series: [
      {
        type: "bar",
        barWidth: "58%",
        itemStyle: { borderRadius: [0, 5, 5, 0] },
        emphasis: { itemStyle: { shadowBlur: 10 } },
        data: values.map((v) => {
          const c = v / max > 0.75 ? palette.danger : v / max > 0.45 ? palette.warning : palette.cyan;
          return { value: v, itemStyle: { color: barGradient(c), shadowColor: c, shadowBlur: 6 } };
        })
      }
    ]
  });
}

/** Funnel: a funnel of stages (e.g. alert → notified → resolved). */
export function funnelOption(data: { name: string; value: number }[]): EChartsOption {
  const palette = chartPalette();
  const ramp = chartRamp(palette);
  return withTheme({
    ...S,
    tooltip: { trigger: "item", formatter: "{b}: {c}" },
    series: [
      {
        type: "funnel",
        left: "10%",
        right: "10%",
        top: 8,
        bottom: 8,
        minSize: "24%",
        gap: 3,
        itemStyle: { borderColor: palette.card, borderWidth: 2 },
        label: { color: palette.foreground, fontSize: 11, position: "inside" },
        labelLine: { show: false },
        data: data.map((d, i) => ({ ...d, itemStyle: { color: barGradient(ramp[i % ramp.length]) } }))
      }
    ]
  });
}

/** Heatmap: a 2D matrix (e.g. server × hour CPU). */
export function heatmapOption(
  xLabels: string[],
  yLabels: string[],
  data: [number, number, number][]
): EChartsOption {
  const palette = chartPalette();
  return withTheme({
    ...S,
    tooltip: {
      position: "top",
      formatter: (p: unknown) => {
        const v = (p as { value: [number, number, number] }).value;
        return `${yLabels[v[1]]} ${xLabels[v[0]]}<br/>${(v[2] * 100).toFixed(2)}%`;
      }
    },
    // containLabel reserves room for the (possibly long) server-name y labels,
    // and a right margin keeps the last column off the card edge.
    grid: { left: 12, right: 16, top: 8, bottom: 8, containLabel: true },
    xAxis: {
      type: "category",
      data: xLabels,
      splitArea: { show: true, areaStyle: { color: ["transparent", "rgba(127,127,127,0.04)"] } },
      axisLabel: { color: palette.muted, fontSize: 10, hideOverlap: true },
      axisLine: { lineStyle: { color: palette.border } },
      axisTick: { show: false }
    },
    yAxis: {
      type: "category",
      data: yLabels,
      splitArea: { show: true, areaStyle: { color: ["transparent", "rgba(127,127,127,0.04)"] } },
      axisLabel: { color: palette.muted, fontSize: 10, width: 90, overflow: "truncate" },
      axisLine: { lineStyle: { color: palette.border } },
      axisTick: { show: false }
    },
    visualMap: {
      min: 0,
      max: 1,
      show: false,
      inRange: { color: [palette.cyan, palette.violet, palette.danger] }
    },
    series: [
      {
        type: "heatmap",
        data,
        itemStyle: { borderRadius: 3 },
        emphasis: { itemStyle: { shadowBlur: 12, shadowColor: palette.cyan } }
      }
    ]
  });
}
