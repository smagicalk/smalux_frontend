import { useMemo, type ReactNode } from "react";

import { EChart, chartPalette, barGradient, donutCenter, withTheme, type EChartsOption } from "@/shared/charts/echart";
import { horizontalBarOption, ringProgressOption } from "@/shared/charts/chart-options";
import { cn, formatPercent } from "@/shared/lib/utils";
import type { PingProtocol, PingTarget } from "@/shared/api/methods";

import { PROTOCOL_LABEL } from "../lib/ping-meta";

/** Glass panel with a primary-tinted top hairline — wraps each ping chart. */
export function ChartPanel({
  title,
  subtitle,
  className,
  children
}: {
  title: string;
  subtitle?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("glass cornered relative overflow-hidden rounded-md border border-border", className)}>
      <span className="absolute inset-x-0 top-0 h-px opacity-60" style={{ background: "linear-gradient(90deg, transparent, var(--primary), transparent)" }} />
      <div className="flex items-baseline justify-between border-b border-border px-3 py-2">
        <span className="text-sm font-semibold tracking-tight">{title}</span>
        {subtitle ? <span className="text-[11px] text-muted-foreground">{subtitle}</span> : null}
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
}

/** Half-ring: average uptime across all ping targets. */
export function UptimeRing({ uptime }: { uptime: number }) {
  const palette = chartPalette();
  const color = uptime > 0.99 ? palette.success : uptime > 0.95 ? palette.warning : palette.danger;
  const option = useMemo<EChartsOption>(
    () => ringProgressOption(uptime, "可用率", color),
    [uptime, color]
  );
  return (
    <div className="flex flex-col items-center gap-1">
      <EChart option={option} height={150} />
      <span className="text-[11px] text-muted-foreground">{formatPercent(uptime, 2)}</span>
    </div>
  );
}

/** Horizontal bar: the 10 slowest targets, in ms. */
export function LatencyChart({ targets }: { targets: PingTarget[] }) {
  const sorted = useMemo(
    () => [...targets].filter((t) => t.latencyMs != null).sort((a, b) => (b.latencyMs ?? 0) - (a.latencyMs ?? 0)).slice(0, 10),
    [targets]
  );
  const option = useMemo<EChartsOption>(
    () => horizontalBarOption(sorted.map((t) => t.name), sorted.map((t) => t.latencyMs ?? 0), { unit: "ms" }),
    [sorted]
  );
  if (!sorted.length) return <div className="flex h-[180px] items-center justify-center text-xs text-muted-foreground">暂无延迟数据</div>;
  return <EChart option={option} height={Math.max(180, sorted.length * 28)} />;
}

/** Donut: target count broken down by protocol. */
export function ProtocolDonut({ targets }: { targets: PingTarget[] }) {
  const palette = chartPalette();
  const counts = useMemo(() => {
    const m = new Map<PingProtocol, number>();
    for (const t of targets) m.set(t.protocol, (m.get(t.protocol) ?? 0) + 1);
    return [...m.entries()];
  }, [targets]);
  const total = targets.length;
  const option = useMemo<EChartsOption>(
    () => {
      const colors = [palette.cyan, palette.violet, palette.success, palette.warning, palette.danger];
      return withTheme({
      tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
      legend: { bottom: 0, textStyle: { color: palette.muted, fontSize: 11 }, icon: "circle", itemWidth: 8, itemHeight: 8 },
      graphic: donutCenter(total, "目标", palette),
      series: [{
        type: "pie",
        radius: ["58%", "80%"],
        itemStyle: { borderColor: palette.card, borderWidth: 3, borderRadius: 6 },
        label: { show: false },
        emphasis: { scale: true, scaleSize: 5, itemStyle: { shadowBlur: 16, shadowColor: palette.cyan }, label: { show: false } },
        data: counts.map(([p, v], i) => ({ name: PROTOCOL_LABEL[p], value: v, itemStyle: { color: barGradient(colors[i % colors.length]) } }))
      }]
      });
    },
    [counts, palette, total]
  );
  return <EChart option={option} height={180} />;
}
