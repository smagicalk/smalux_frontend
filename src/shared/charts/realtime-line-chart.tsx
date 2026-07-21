import { useEffect, useMemo, useRef, useState } from "react";
import UplotReact from "uplot-react";
import "uplot/dist/uPlot.min.css";

import { cn } from "@/shared/lib/utils";
import { resolveTokenColor } from "./color-token";

export interface RealtimeLineChartProps {
  /** Timestamps + values. Newest last. A `null` value draws a gap (used by the
   *  ping chart for probe timeouts) — uPlot renders it as a break in the line. */
  points: { ts: number; value: number | null }[];
  /** Height in px. */
  height?: number;
  /** Value range; if omitted, auto from data. */
  domain?: [number, number];
  /**
   * Stroke color. May be a CSS variable token (`--primary` or `var(--primary)`)
   * or any concrete css color — it is resolved to a `#rrggbb` hex internally
   * because uPlot strokes a canvas, which can't consume `var(...)`/oklch.
   */
  color?: string;
  className?: string;
  label?: string;
  /**
   * Detailed view: show axes, gridlines, a crosshair cursor + legend. Off by
   * default (the inline card sparkline is axes-free); turned on for the chart
   * popout so a reader can actually read values off the blown-up trend.
   */
  detailed?: boolean;
  /**
   * Format a raw value for the Y-axis ticks + crosshair readout. Only used in
   * `detailed` mode (the sparkline has no axis). Default rounds to 2 decimals;
   * callers pass a domain formatter (CPU/mem → %, network → rate) so the axis
   * reads "85%" not "0.85", or "1.2 MB/s" not "1234567".
   */
  formatValue?: (v: number) => string;
}

/**
 * Resolve a CSS custom property (e.g. "--primary") to a concrete `#rrggbb`
 * hex color. Kept for callers that pre-resolve a token before passing it as
 * `color`; the chart resolves tokens itself too, so direct callers can just
 * pass `"--primary"`.
 */
export function resolveVar(varName: string): string {
  return resolveTokenColor(varName, "#3b82f6");
}

/**
 * Thin uPlot wrapper for a single real-time series (CPU/mem/net over time).
 * uPlot is canvas-based and cheap — the right tool for 1s-cadence probe
 * streams where SVG charts would struggle. We feed it the rolling history
 * from the monitoring store. Lifecycle (init/setData/destroy) is handled by
 * uplot-react.
 *
 * The chart tracks its container width via a ResizeObserver and feeds it back
 * into uPlot's `width` option, so the canvas fills its card instead of
 * staying at the initial fallback width.
 */
export function RealtimeLineChart({
  points,
  height = 120,
  domain,
  color,
  className,
  label,
  detailed = false,
  formatValue
}: RealtimeLineChartProps) {
  // Stable formatter identity — a fresh arrow on every render would bust the
  // options memo. The default rounds non-integers to 2 dp.
  const fmt = useMemo(
    () => formatValue ?? ((v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(2))),
    [formatValue]
  );
  // Resolve any token/concrete color to #rrggbb — uPlot strokes a canvas,
  // which can't take `var(...)` or raw oklch.
  const stroke = useMemo(
    () => resolveTokenColor(color ?? "--primary", "#3b82f6"),
    [color]
  );
  const yMin = domain?.[0];
  const yMax = domain?.[1];
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth || 0);
    measure();
    if (typeof ResizeObserver === "undefined") {
      const t = window.setTimeout(measure, 60);
      return () => window.clearTimeout(t);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const options = useMemo(
    () => ({
      width: width > 0 ? width : 320,
      height,
      series: [
        {},
        {
          label: label ?? "",
          stroke,
          width: detailed ? 2 : 1.5,
          points: { show: false },
          // Break the line across null values rather than bridging them: the
          // ping chart uses null for probe timeouts, and a visible gap reads
          // as "unreachable here" far better than a line drawn straight across.
          // Series without nulls (CPU/mem/net) are unaffected.
          spanGaps: false,
          // Crosshair readout formats via fmt (e.g. "85%", "1.2 MB/s") instead
          // of the raw number. Only meaningful when the cursor is shown. A null
          // (probe timeout gap) renders as "—" — fmt expects a number.
          value: detailed ? (_u: unknown, v: number | null) => (v == null ? "—" : fmt(v)) : undefined
        }
      ],
      // Detailed (popout) view gets real axes, a faint grid, a crosshair and a
      // legend so values are legible; the inline card sparkline stays clean.
      // Grid stroke uses rgba (uPlot/canvas parse it reliably; a 4-digit hex
      // alpha is iffy on some engines) and a hairline width — uPlot handles
      // devicePixelRatio itself, so no manual DPR scaling here.
      axes: detailed
        ? [
            { grid: { stroke: "rgba(128,128,128,0.25)", width: 1 }, ticks: { show: false }, font: "10px sans-serif", size: 18, stroke: "rgba(128,128,128,0.5)" },
            { grid: { stroke: "rgba(128,128,128,0.25)", width: 1 }, ticks: { show: false }, font: "10px sans-serif", size: 28, stroke: "rgba(128,128,128,0.5)", values: (_u: unknown, vals: number[]) => vals.map(fmt) }
          ]
        : [{ show: false }, { show: false }],
      scales: {
        x: { time: true },
        y: domain ? { range: () => [yMin, yMax] as [number, number] } : { auto: true }
      },
      grid: { show: detailed },
      legend: { show: detailed },
      cursor: { show: detailed },
      padding: (detailed ? [8, 8, 0, 4] : [0, 0, 0, 0]) as [number, number, number, number]
    }),
    [width, height, stroke, label, domain, yMin, yMax, detailed, fmt]
  );

  // uPlot's AlignedData is typed as TypedArray[] but accepts plain number
  // arrays at runtime; cast to satisfy the strict prop type.
  const data = [
    points.map((p) => p.ts / 1000),
    points.map((p) => p.value)
  ] as never;

  return (
    <div ref={wrapRef} className={cn("relative w-full overflow-hidden", className)} style={{ height }}>
      {width > 0 && points.length > 0 ? <UplotReact options={options} data={data} /> : null}
      {points.length === 0 ? (
        // An empty series renders a blank canvas; surface that explicitly so a
        // reader isn't left staring at an empty card / popout body.
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground/70">
          暂无数据
        </div>
      ) : null}
    </div>
  );
}
