import type { EChartsOption } from "./echart";
import { barGradient, chartPalette, chartRamp, donutCenter, withTheme } from "./echart";
import type { Server } from "@/shared/api/methods";

import { S } from "./chart-base";

/**
 * Nightingale rose: server count grouped by region. Each region is a glowing
 * wedge whose radius grows with its node count — far more legible in a small
 * card than a flat donut, and the rose shape reads instantly as a ranking.
 */
export function regionDistributionOption(servers: Server[]): EChartsOption {
  const palette = chartPalette();
  const counts = new Map<string, number>();
  let total = 0;
  for (const s of servers) {
    counts.set(s.region, (counts.get(s.region) ?? 0) + 1);
    total++;
  }
  const ramp = chartRamp(palette);
  const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return withTheme({
    ...S,
    tooltip: { trigger: "item", formatter: "{b}: {c} 台 ({d}%)" },
    graphic: donutCenter(total, "节点", palette),
    series: [
      {
        type: "pie",
        roseType: "area",
        radius: ["20%", "72%"],
        center: ["50%", "50%"],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: palette.card, borderWidth: 2, borderRadius: 4 },
        label: {
          show: true,
          position: "outside",
          color: palette.muted,
          fontSize: 10,
          formatter: "{b}: {c}"
        },
        labelLine: { length: 6, length2: 8, lineStyle: { color: palette.border } },
        emphasis: {
          scale: true,
          scaleSize: 6,
          label: { color: palette.foreground, fontWeight: "bold" },
          itemStyle: { shadowBlur: 18, shadowColor: palette.cyan }
        },
        data: entries.map(([name, value], i) => ({
          name,
          value,
          itemStyle: { color: barGradient(ramp[i % ramp.length]) }
        }))
      }
    ]
  });
}

/**
 * Polar bar: each value is a glowing radial bar around a ring — a striking
 * way to show a small set of KPIs (e.g. per-region server counts).
 */
export function polarBarOption(
  categories: string[],
  values: number[],
  label: string
): EChartsOption {
  const palette = chartPalette();
  const ramp = chartRamp(palette);
  const max = Math.max(...values, 1);
  return withTheme({
    ...S,
    tooltip: { trigger: "item" },
    polar: { radius: ["28%", "72%"], center: ["50%", "52%"] },
    angleAxis: { axisLine: { lineStyle: { color: palette.border } }, axisLabel: { color: palette.muted, fontSize: 10 }, splitLine: { lineStyle: { color: palette.border, type: "dashed" } } },
    radiusAxis: { data: categories, axisLabel: { color: palette.muted, fontSize: 9, width: 60, overflow: "truncate" }, axisLine: { show: false }, splitLine: { show: false } },
    graphic: donutCenter(max, label, palette),
    series: [
      {
        type: "bar",
        coordinateSystem: "polar",
        data: values.map((v, i) => ({ value: v, itemStyle: { color: barGradient(ramp[i % ramp.length]), shadowColor: ramp[i % ramp.length], shadowBlur: 8 } })),
        barWidth: "60%",
        roundCap: true
      }
    ]
  });
}
