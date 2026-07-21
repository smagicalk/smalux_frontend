import type { EChartsOption } from "./echart";
import { barGradient, chartPalette, chartRamp, withTheme } from "./echart";
import { formatCpuPercent, formatRate } from "@/shared/lib/utils";

import { S } from "./chart-base";

/**
 * Format one radar axis value for the tooltip, keyed by the indicator's name
 * (not its position) so axis order doesn't matter. CPU/内存/磁盘 are 0..1
 * ratios → two-decimal percent; 网络 is a raw byte/s rate → KiB/s·MiB/s·GiB/s;
 * 负载 is a raw 1m load average → two decimals. Exported so the overview and
 * server-detail radar share one definition of "what each axis means".
 */
export function radarAxisLabel(name: string, value: number): string {
  switch (name) {
    case "CPU":
    case "内存":
    case "磁盘":
      return formatCpuPercent(value);
    case "网络":
      return formatRate(value);
    case "负载":
      return value.toFixed(2);
    default:
      return String(value);
  }
}

/** Radar: multi-axis comparison (e.g. one server across CPU/mem/disk/net/load). */
export function radarOption(
  indicators: { name: string; max: number }[],
  series: { name: string; values: number[] }[]
): EChartsOption {
  const palette = chartPalette();
  const ramp = chartRamp(palette);
  return withTheme({
    ...S,
    tooltip: {
      // Render each axis with its own unit instead of the raw values — without
      // this the tooltip shows "0.43 / 0.71 / 0.55 / 3.42 / 4821034", which is
      // unreadable.
      formatter: (p: unknown) => {
        const params = p as { name: string; value: number[] };
        const lines = params.value.map((v, i) => {
          const name = indicators[i]?.name ?? `轴${i}`;
          return `${name}: ${radarAxisLabel(name, v)}`;
        });
        return `${params.name}<br/>${lines.join("<br/>")}`;
      }
    },
    legend: { top: 0, textStyle: { color: palette.muted, fontSize: 11 }, icon: "circle", itemWidth: 8, itemHeight: 8 },
    radar: {
      center: ["50%", "55%"],
      radius: "58%",
      indicator: indicators,
      shape: "polygon",
      splitNumber: 4,
      axisName: { color: palette.muted, fontSize: 10 },
      splitLine: { lineStyle: { color: palette.border } },
      splitArea: { areaStyle: { color: ["transparent", "rgba(127,127,127,0.05)"] } },
      axisLine: { lineStyle: { color: palette.border } }
    },
    color: ramp,
    series: [
      {
        type: "radar",
        symbol: "circle",
        symbolSize: 5,
        lineStyle: { width: 2 },
        data: series.map((s, i) => ({
          name: s.name,
          value: s.values,
          lineStyle: { color: ramp[i % ramp.length], width: 2, shadowColor: ramp[i % ramp.length], shadowBlur: 6 },
          itemStyle: { color: ramp[i % ramp.length] },
          areaStyle: { color: `${ramp[i % ramp.length]}22` }
        }))
      }
    ]
  });
}

/**
 * Colorful bubble/scatter: points positioned on two numeric axes, sized by a
 * third, each colored from the neon ramp. Striking for a 2D correlation view
 * (e.g. cpu vs mem, with node count sizing the bubble).
 */
export function bubbleOption(
  points: { name: string; x: number; y: number; size: number }[],
  opts: { xLabel?: string; yLabel?: string; xUnit?: string; yUnit?: string } = {}
): EChartsOption {
  const palette = chartPalette();
  const ramp = chartRamp(palette);
  const maxSize = Math.max(...points.map((p) => p.size), 1);
  return withTheme({
    ...S,
    tooltip: {
      formatter: (p: unknown) => {
        const v = (p as { data: { name: string; value: [number, number, number] } }).data;
        return `${v.name}<br/>${opts.xLabel ?? "X"}: ${formatCpuPercent(v.value[0])}<br/>${opts.yLabel ?? "Y"}: ${formatCpuPercent(v.value[1])}<br/>磁盘: ${formatCpuPercent(v.value[2])}`;
      }
    },
    grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
    xAxis: {
      type: "value",
      name: opts.xLabel,
      nameLocation: "middle",
      nameGap: 28,
      nameTextStyle: { color: palette.muted, fontSize: 10 },
      min: 0,
      max: 1,
      axisLabel: { color: palette.muted, fontSize: 10, formatter: (v: number) => `${Math.round(v * 100)}${opts.xUnit ?? "%"}` },
      axisLine: { lineStyle: { color: palette.border } },
      splitLine: { lineStyle: { color: palette.border, type: "dashed" } }
    },
    yAxis: {
      type: "value",
      name: opts.yLabel,
      nameLocation: "middle",
      nameGap: 36,
      nameTextStyle: { color: palette.muted, fontSize: 10 },
      min: 0,
      max: 1,
      axisLabel: { color: palette.muted, fontSize: 10, formatter: (v: number) => `${Math.round(v * 100)}${opts.yUnit ?? "%"}` },
      splitLine: { lineStyle: { color: palette.border, type: "dashed" } }
    },
    series: [
      {
        type: "scatter",
        symbolSize: (val: unknown) => {
          const size = (val as number[])[2] ?? 0;
          return 8 + (size / maxSize) * 28;
        },
        data: points.map((p, i) => ({
          name: p.name,
          value: [p.x, p.y, p.size] as [number, number, number],
          itemStyle: {
            color: barGradient(ramp[i % ramp.length]),
            shadowColor: ramp[i % ramp.length],
            shadowBlur: 10,
            opacity: 0.85
          }
        })),
        emphasis: { itemStyle: { shadowBlur: 20 } }
      }
    ]
  });
}
