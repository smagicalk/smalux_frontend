import { useEffect, useMemo, useRef, useState } from "react";
import UplotReact from "uplot-react";
import "uplot/dist/uPlot.min.css";

import { resolveTokenColor } from "./color-token";

export interface SparklineProps {
  points: { ts: number; value: number }[];
  color?: string;
  /** Fixed height; width tracks the container. */
  height?: number;
  domain?: [number, number];
}

/**
 * Tiny inline trend line for list rows — the signature element of a probe
 * panel (Komari/Nezha both show a mini chart per server row). No axes, no
 * legend, just the shape of the last N samples.
 *
 * uPlot needs a concrete pixel width; the wrapper only resizes when the
 * `width` option changes. We measure the container with a ResizeObserver and
 * feed its width back into the options so the sparkline fills its tile
 * instead of sitting at the hardcoded 80px fallback.
 */
export function Sparkline({ points, color, height = 28, domain }: SparklineProps) {
  // uPlot strokes the canvas, which can't consume `var(--cyan)` / oklch —
  // resolve any token to a concrete #rrggbb first.
  const stroke = useMemo(
    () => resolveTokenColor(color ?? "--primary", "#22d3ee"),
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
      width: width > 0 ? width : 80,
      height,
      series: [
        {},
        {
          stroke,
          width: 1.25,
          points: { show: false },
          spanGaps: true
        }
      ],
      axes: [{ show: false }, { show: false }],
      scales: {
        x: { time: true },
        y: domain ? { range: () => [yMin, yMax] as [number, number] } : { auto: true }
      },
      grid: { show: false },
      legend: { show: false },
      cursor: { show: false },
      padding: [0, 0, 0, 0] as [number, number, number, number]
    }),
    [width, height, stroke, domain, yMin, yMax]
  );

  // uPlot's AlignedData is typed as TypedArray[] but accepts plain number
  // arrays at runtime; cast to satisfy the strict prop type.
  const data = [
    points.map((p) => p.ts / 1000),
    points.map((p) => p.value)
  ] as never;

  return (
    <div ref={wrapRef} className="w-full overflow-hidden" style={{ height }}>
      {width > 0 ? <UplotReact options={options} data={data} /> : null}
    </div>
  );
}

export interface DualSparklineProps {
  /** Primary series (drawn first, e.g. 下行 rx). */
  a: { ts: number; value: number }[];
  /** Secondary series (drawn on top, e.g. 上行 tx). */
  b: { ts: number; value: number }[];
  aColor?: string;
  bColor?: string;
  height?: number;
}

/**
 * Two overlaid trend lines sharing a time axis — used by the 集群流量 KPI tile
 * to show 下行 vs 上行 in one compact chart. Both colors are resolved to
 * concrete hex (canvas can't take `var(...)`), and width tracks the container
 * via a ResizeObserver, same as Sparkline.
 */
export function DualSparkline({
  a,
  b,
  aColor = "--primary",
  bColor = "--warning",
  height = 24
}: DualSparklineProps) {
  const strokeA = useMemo(() => resolveTokenColor(aColor, "#22d3ee"), [aColor]);
  const strokeB = useMemo(() => resolveTokenColor(bColor, "#fbbf24"), [bColor]);
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

  // Union of timestamps so the two series share one x axis even if their
  // sample times differ slightly.
  const { ts, av, bv } = useMemo(() => {
    const tsSet = new Set<number>();
    for (const p of a) tsSet.add(p.ts);
    for (const p of b) tsSet.add(p.ts);
    const ts = [...tsSet].sort((x, y) => x - y);
    const am = new Map(a.map((p) => [p.ts, p.value]));
    const bm = new Map(b.map((p) => [p.ts, p.value]));
    const av: (number | null)[] = ts.map((t) => (am.has(t) ? am.get(t)! : null));
    const bv: (number | null)[] = ts.map((t) => (bm.has(t) ? bm.get(t)! : null));
    return { ts, av, bv };
  }, [a, b]);

  const options = useMemo(
    () => ({
      width: width > 0 ? width : 80,
      height,
      series: [
        {},
        { stroke: strokeA, width: 1.25, points: { show: false }, spanGaps: true },
        { stroke: strokeB, width: 1.25, points: { show: false }, spanGaps: true }
      ],
      axes: [{ show: false }, { show: false }],
      scales: { x: { time: true }, y: { auto: true } },
      grid: { show: false },
      legend: { show: false },
      cursor: { show: false },
      padding: [0, 0, 0, 0] as [number, number, number, number]
    }),
    [width, height, strokeA, strokeB]
  );

  const data = [
    ts.map((t) => t / 1000),
    av,
    bv
  ] as never;

  return (
    <div ref={wrapRef} className="w-full overflow-hidden" style={{ height }}>
      {width > 0 ? <UplotReact options={options} data={data} /> : null}
    </div>
  );
}
