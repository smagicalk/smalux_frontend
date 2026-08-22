import { memo, useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import type { EChartsType } from "echarts/core";
import {
  BarChart,
  FunnelChart,
  GaugeChart,
  HeatmapChart,
  LineChart,
  PieChart,
  RadarChart,
  ScatterChart
} from "echarts/charts";
import {
  GraphicComponent,
  GridComponent,
  LegendComponent,
  LegendScrollComponent,
  MarkLineComponent,
  PolarComponent,
  RadarComponent,
  TooltipComponent,
  VisualMapComponent
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { EChartsOption as EChartsOptionType } from "echarts";

echarts.use([
  BarChart,
  FunnelChart,
  GaugeChart,
  HeatmapChart,
  LineChart,
  PieChart,
  RadarChart,
  ScatterChart,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  LegendScrollComponent,
  MarkLineComponent,
  PolarComponent,
  RadarComponent,
  TooltipComponent,
  VisualMapComponent,
  CanvasRenderer
]);

export type EChartsOption = EChartsOptionType;

export interface EChartProps {
  option: EChartsOption;
  height?: number;
  className?: string;
  notMerge?: boolean;
  onLegendChange?: (selected: Record<string, boolean>) => void;
  onChartReady?: (chart: EChartsType) => void;
}

/**
 * ECharts core adapter with only project-used charts/components registered.
 * It owns init/setOption/dispose/resize directly, keeping the public component
 * small and avoiding a second React lifecycle wrapper around every canvas.
 */
export const EChart = memo(function EChart({
  option,
  height = 220,
  className,
  notMerge = false,
  onLegendChange,
  onChartReady
}: EChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsType | null>(null);
  const legendSelectionRef = useRef<Record<string, boolean>>({});
  const onLegendChangeRef = useRef(onLegendChange);
  onLegendChangeRef.current = onLegendChange;
  const onChartReadyRef = useRef(onChartReady);
  onChartReadyRef.current = onChartReady;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const chart = echarts.init(el, undefined, { renderer: "canvas" });
    chartRef.current = chart;

    const handleLegendSelectChanged = (params: unknown) => {
      const p = params as { selected?: Record<string, boolean> };
      if (p && p.selected) {
        legendSelectionRef.current = { ...p.selected };
        onLegendChangeRef.current?.(p.selected);
      }
    };
    chart.on("legendselectchanged", handleLegendSelectChanged);

    onChartReadyRef.current?.(chart);

    // ResizeObserver can emit several records during one layout pass. Collapse
    // them into one animation-frame resize to avoid repeated canvas work while
    // a responsive grid or dialog is settling.
    let resizeFrame = 0;
    const resizeNow = () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => chart.resize());
    };
    const boot = window.setTimeout(resizeNow, 80);
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(resizeNow);
      ro.observe(el);
    }
    return () => {
      window.clearTimeout(boot);
      window.cancelAnimationFrame(resizeFrame);
      ro?.disconnect();
      chart.off("legendselectchanged", handleLegendSelectChanged);
      chartRef.current = null;
      chart.dispose();
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;

    let finalOption = option;
    if (option && option.legend && Object.keys(legendSelectionRef.current).length > 0) {
      if (Array.isArray(option.legend)) {
        finalOption = {
          ...option,
          legend: option.legend.map((leg) => {
            const legSelected =
              typeof leg === "object" && leg && "selected" in leg && typeof leg.selected === "object" && leg.selected
                ? (leg.selected as Record<string, boolean>)
                : {};
            return {
              ...leg,
              selected: { ...legendSelectionRef.current, ...legSelected }
            };
          })
        };
      } else if (typeof option.legend === "object") {
        const currentLegend = option.legend as { selected?: Record<string, boolean> };
        finalOption = {
          ...option,
          legend: {
            ...option.legend,
            selected: {
              ...legendSelectionRef.current,
              ...(currentLegend.selected || {})
            }
          }
        };
      }
    }

    chartRef.current.setOption(finalOption, { notMerge, lazyUpdate: false });
  }, [option, notMerge]);

  return (
    <div ref={containerRef} style={{ width: "100%", height }} className={className} />
  );
});

/**
 * Resolve a single CSS custom property to a concrete `#rrggbb` hex color.
 *
 * The design tokens are stored as `oklch(...)` strings. ECharts draws on a
 * canvas, and two things break if we hand it oklch directly:
 *   1. gradient/shadow helpers append a 2-digit alpha hex (e.g. `${color}55`),
 *      producing `oklch(0.78 0.15 195)55` — an invalid color the canvas
 *      silently rejects, so series render black or vanish;
 *   2. older canvas engines don't parse oklch at all.
 *
 * We let the browser do the color-space conversion: set the token as the
 * `color` of a hidden probe element, read its computed `color` (the browser
 * normalizes any css color — oklch, hsl, named — to `rgb(...)`), then
 * re-serialize that as `#rrggbb` so the alpha-hex suffix the gradient helpers
 * use is valid (`#rrggbb55`).
 */
function resolveColorVar(varName: string, fallback: string): string {
  if (typeof window === "undefined" || typeof document === "undefined") return fallback;
  const probe = document.createElement("span");
  probe.style.color = `var(${varName})`;
  probe.style.display = "none";
  document.documentElement.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  probe.remove();
  return rgbToHex(computed) || fallback;
}

/** Normalize any `rgb()`/`rgba()` string the browser emits to `#rrggbb`. */
function rgbToHex(color: string): string | null {
  const m = color.match(/rgba?\(([^)]+)\)/i);
  if (!m) return null;
  const parts = m[1].split(",").map((s) => parseFloat(s.trim()));
  const [r, g, b] = parts;
  if ([r, g, b].some((n) => Number.isNaN(n))) return null;
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Cache the resolved palette by theme — the tokens are oklch and don't change
// within a theme, so re-probing on every chart (the overview page builds ~12
// options) is wasteful. Invalidated when the `.dark` class on <html> flips.
let paletteCache: { key: string; value: ReturnType<typeof buildPalette> } | null = null;

function buildPalette() {
  return {
    primary: resolveColorVar("--primary", "#22d3ee"),
    cyan: resolveColorVar("--cyan", "#22d3ee"),
    violet: resolveColorVar("--violet", "#a855f7"),
    magenta: resolveColorVar("--magenta", "#ec4899"),
    success: resolveColorVar("--success", "#34d399"),
    warning: resolveColorVar("--warning", "#fbbf24"),
    danger: resolveColorVar("--danger", "#f87171"),
    muted: resolveColorVar("--muted-foreground", "#888888"),
    border: resolveColorVar("--border", "#eeeeee"),
    card: resolveColorVar("--card", "#ffffff"),
    foreground: resolveColorVar("--foreground", "#111111")
  };
}

/**
 * Resolve CSS custom properties to concrete colors for the canvas (which
 * cannot consume `var(...)` in gradients/shadows).
 */
export function chartPalette() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return {
      primary: "#22d3ee", cyan: "#22d3ee", violet: "#a855f7", magenta: "#ec4899",
      success: "#34d399", warning: "#fbbf24", danger: "#f87171",
      muted: "#888888", border: "#eeeeee", card: "#ffffff", foreground: "#111111"
    };
  }
  const key = document.documentElement.classList.contains("dark") ? "dark" : "light";
  if (!paletteCache || paletteCache.key !== key) {
    paletteCache = { key, value: buildPalette() };
  }
  return paletteCache.value;
}

/** A modern categorical ramp — cyan → violet → magenta → green → amber → rose, plus extra neon hues. */
export function chartRamp(p = chartPalette()): string[] {
  return [
    p.cyan, p.violet, p.magenta, p.success, p.warning, p.danger,
    "#38bdf8", "#c084fc", "#2dd4bf", "#f472b6", "#facc15", "#818cf8",
    "#34d399", "#fb7185", "#22d3ee", "#a78bfa"
  ];
}

/**
 * A rich horizontal multi-stop neon gradient (cyan → blue → violet → magenta)
 * for signature strokes/fills that want maximum color richness.
 */
export function neonStrokeGradient(p = chartPalette()): object {
  return {
    type: "linear",
    x: 0, y: 0, x2: 1, y2: 0,
    colorStops: [
      { offset: 0, color: p.cyan },
      { offset: 0.33, color: "#38bdf8" },
      { offset: 0.66, color: p.violet },
      { offset: 1, color: p.magenta }
    ]
  };
}

/** Vertical gradient (top → bottom) for area fills: color → near-transparent. */
export function areaGradient(color: string, topAlpha = "59", bottomAlpha = "03"): object {
  return {
    type: "linear",
    x: 0, y: 0, x2: 0, y2: 1,
    colorStops: [
      { offset: 0, color: `${color}${topAlpha}` },
      { offset: 1, color: `${color}${bottomAlpha}` }
    ]
  };
}

/** Vertical gradient (top bright → bottom dim) for glassy bars/slices. */
export function barGradient(color: string): object {
  return {
    type: "linear",
    x: 0, y: 0, x2: 0, y2: 1,
    colorStops: [
      { offset: 0, color: color },
      { offset: 1, color: `${color}55` }
    ]
  };
}

/** Horizontal gradient cyan → violet — the signature stroke ramp. */
export function strokeGradient(p = chartPalette()): object {
  return {
    type: "linear",
    x: 0, y: 0, x2: 1, y2: 0,
    colorStops: [
      { offset: 0, color: p.cyan },
      { offset: 0.5, color: p.violet },
      { offset: 1, color: p.magenta }
    ]
  };
}

/** `graphic` elements placing a big number + small label at a donut center. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function donutCenter(total: number | string, label: string, p = chartPalette()): any[] {
  return [
    {
      type: "text",
      left: "center",
      top: "37%",
      style: { text: String(total), align: "center", fill: p.foreground, fontSize: 22, fontWeight: "bold" }
    },
    {
      type: "text",
      left: "center",
      top: "58%",
      style: { text: label, align: "center", fill: p.muted, fontSize: 11 }
    }
  ];
}

/** A soft horizontal divider line graphic (cyan → transparent → cyan). */
export function neonDivider(p = chartPalette()) {
  return {
    type: "line",
    left: "8%",
    right: "8%",
    top: 0,
    shape: { x1: 0, y1: 0, x2: 1, y2: 0 },
    style: { stroke: p.cyan, lineWidth: 1, opacity: 0.25 }
  };
}

/** Shared animation tuning — snappy tech feel. */
export const techAnimation = {
  animationDuration: 700,
  animationEasing: "cubicOut" as const,
  animationDurationUpdate: 350
};

/**
 * Merge the "mission control" theme fragments into an option object: glassy
 * tooltip, soft dashed gridlines, quiet axis text, and the cyan/violet accent
 * ramp as the default series palette. A partial that supplies its own tooltip
 * has those fields merged on top of the glass base.
 */
export function withTheme(partial: EChartsOption): EChartsOption {
  const p = chartPalette();
  const glassTooltip = {
    backgroundColor: p.card,
    borderColor: p.border,
    borderWidth: 1,
    padding: [8, 10] as [number, number],
    textStyle: { color: p.foreground, fontSize: 12 },
    extraCssText: "backdrop-filter: blur(8px); border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.25);"
  };
  const tooltip = { ...glassTooltip, ...((partial.tooltip ?? {}) as object) };
  return {
    textStyle: { fontFamily: "inherit", color: p.foreground },
    color: chartRamp(p),
    ...partial,
    tooltip
  } as EChartsOption;
}
