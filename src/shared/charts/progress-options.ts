import type { EChartsOption } from "./echart";
import { barGradient, chartPalette, withTheme } from "./echart";
import { formatCpuPercent } from "@/shared/lib/utils";
import type { Server, ServerStatus } from "@/shared/api/methods";

import { S } from "./chart-base";

/** Gauge: a single 0..1 ratio (e.g. cluster average CPU). */
export function gaugeOption(
  value: number,
  label: string,
  color?: string
): EChartsOption {
  const palette = chartPalette();
  const c = color ?? palette.cyan;
  return withTheme({
    ...S,
    series: [
      {
        type: "gauge",
        center: ["50%", "62%"],
        radius: "85%",
        startAngle: 210,
        endAngle: -30,
        min: 0,
        max: 100,
        progress: { show: true, width: 10, roundCap: true, itemStyle: { color: c, shadowColor: c, shadowBlur: 12 } },
        axisLine: { lineStyle: { width: 10, color: [[1, palette.border]] } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { show: false },
        anchor: { show: false },
        title: { show: true, offsetCenter: [0, "40%"], color: palette.muted, fontSize: 11 },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, "-2%"],
          formatter: "{value}%",
          color: c,
          fontSize: 26,
          fontWeight: "bold"
        },
        data: [{ value: Math.round(value * 100), name: label }]
      }
    ]
  });
}

/**
 * Liquid-fill gauge: a single 0..1 ratio rendered as a glowing wave fill —
 * the signature "energy level" widget for CPU/mem/disk.
 */
export function liquidOption(value: number, color?: string): EChartsOption {
  const palette = chartPalette();
  const c = color ?? palette.cyan;
  // A gauge-styled full ring with a solid filled arc + center percent —
  // a clean "energy level" widget for CPU/mem/disk.
  return withTheme({
    ...S,
    graphic: [
      {
        type: "text",
        left: "center",
        top: "42%",
        style: { text: `${Math.round(value * 100)}%`, align: "center", fill: c, fontSize: 26, fontWeight: "bold" }
      }
    ],
    series: [
      {
        type: "gauge",
        center: ["50%", "60%"],
        radius: "100%",
        startAngle: 90,
        endAngle: -270,
        min: 0,
        max: 1,
        progress: { show: true, overlap: false, roundCap: true, clip: false, width: 12, itemStyle: { color: c, shadowColor: c, shadowBlur: 16 } },
        axisLine: { lineStyle: { width: 12, color: [[1, palette.border]] } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { show: false },
        anchor: { show: false },
        title: { show: false },
        detail: { show: false },
        data: [{ value }]
      }
    ]
  });
}

/** Half-donut ring with a center percent — a compact progress widget. */
export function ringProgressOption(value: number, label: string, color?: string): EChartsOption {
  const palette = chartPalette();
  const c = color ?? palette.cyan;
  return withTheme({
    ...S,
    graphic: [
      { type: "text", left: "center", top: "44%", style: { text: formatCpuPercent(value), align: "center", fill: c, fontSize: 22, fontWeight: "bold" } },
      { type: "text", left: "center", top: "64%", style: { text: label, align: "center", fill: palette.muted, fontSize: 11 } }
    ],
    series: [
      {
        type: "pie",
        radius: ["66%", "86%"],
        center: ["50%", "52%"],
        startAngle: 180,
        silent: true,
        itemStyle: { borderRadius: 6 },
        label: { show: false },
        data: [
          { value: value, itemStyle: { color: barGradient(c), shadowColor: c, shadowBlur: 8 } },
          { value: Math.max(0.0001, 1 - value), itemStyle: { color: palette.border } }
        ]
      }
    ]
  });
}

/**
 * Status water-level: a full glowing ring whose filled arc is the online
 * share, with the online% as a big center number and a three-color count strip
 * below. Reads as "fleet health at a glance" rather than three flat slices.
 */
export function statusDistributionOption(servers: Server[]): EChartsOption {
  const palette = chartPalette();
  const tally: Record<ServerStatus, number> = { online: 0, warning: 0, offline: 0 };
  for (const s of servers) tally[s.status]++;
  const total = tally.online + tally.warning + tally.offline;
  const onlineRatio = total ? tally.online / total : 0;
  const pct = Math.round(onlineRatio * 100);
  const color = onlineRatio > 0.9 ? palette.success : onlineRatio > 0.7 ? palette.warning : palette.danger;
  return withTheme({
    ...S,
    tooltip: {
      trigger: "item",
      formatter: (p: unknown) => {
        const v = (p as { name: string; value: number; percent: number });
        return `${v.name}: ${v.value} 台 (${v.percent}%)`;
      }
    },
    graphic: [
      { type: "text", left: "center", top: "40%", style: { text: `${pct}%`, align: "center", fill: color, fontSize: 28, fontWeight: "bold" } },
      { type: "text", left: "center", top: "60%", style: { text: "在线率", align: "center", fill: palette.muted, fontSize: 11 } }
    ],
    series: [
      {
        type: "gauge",
        center: ["50%", "52%"],
        radius: "88%",
        startAngle: 90,
        endAngle: -270,
        min: 0,
        max: 100,
        progress: { show: true, overlap: false, roundCap: true, clip: false, width: 11, itemStyle: { color, shadowColor: color, shadowBlur: 16 } },
        axisLine: { lineStyle: { width: 11, color: [[1, palette.border]] } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        pointer: { show: false },
        anchor: { show: false },
        title: { show: false },
        detail: { show: false },
        data: [{ value: pct }]
      }
    ]
  });
}
