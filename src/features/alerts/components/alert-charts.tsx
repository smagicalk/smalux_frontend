import { useMemo, useState, type ReactNode } from "react";

import { EChart, chartPalette, barGradient, donutCenter, withTheme, type EChartsOption } from "@/shared/charts/echart";
import { areaTrendOption, polarBarOption, ringProgressOption } from "@/shared/charts/chart-options";
import { cn } from "@/shared/lib/utils";
import type { AlertHistory, AlertRule, AlertSeverity } from "@/shared/api/methods";

/** Glass panel with a danger-tinted top hairline — wraps each alert chart. */
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
      <span className="absolute inset-x-0 top-0 h-px opacity-60" style={{ background: "linear-gradient(90deg, transparent, var(--danger), transparent)" }} />
      <div className="flex items-baseline justify-between border-b border-border px-3 py-2">
        <span className="text-sm font-semibold tracking-tight">{title}</span>
        {subtitle ? <span className="text-[11px] text-muted-foreground">{subtitle}</span> : null}
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
}

/** Half-ring: share of alerts that are still open vs resolved. */
export function ActiveRatioRing({ active, resolved }: { active: number; resolved: number }) {
  const palette = chartPalette();
  const total = active + resolved;
  const ratio = total ? active / total : 0;
  const option = useMemo<EChartsOption>(
    () => ringProgressOption(ratio, "未恢复", ratio > 0.5 ? palette.danger : palette.warning),
    [ratio, palette.danger, palette.warning]
  );
  return (
    <div className="flex flex-col items-center gap-1">
      <EChart option={option} height={150} />
      <span className="text-[11px] text-muted-foreground">未恢复 {active} / 已恢复 {resolved}</span>
    </div>
  );
}

/** Polar bar: alert trigger count grouped by server (top 8). */
export function ServerPolar({ history }: { history: AlertHistory[] }) {
  const option = useMemo(() => {
    const m = new Map<string, number>();
    for (const h of history) {
      const key = h.serverName || "未知";
      m.set(key, (m.get(key) ?? 0) + 1);
    }
    const entries = [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    return polarBarOption(entries.map(([n]) => n), entries.map(([, v]) => v), "告警");
  }, [history]);
  return <EChart option={option} height={150} />;
}

/** Donut: rule count broken down by severity. */
export function SeverityDonut({ rules }: { rules: AlertRule[] }) {
  const palette = chartPalette();
  const counts = useMemo(() => {
    const m: Record<AlertSeverity, number> = { info: 0, warning: 0, critical: 0 };
    for (const r of rules) m[r.severity]++;
    return m;
  }, [rules]);
  const total = counts.critical + counts.warning + counts.info;
  const option = useMemo<EChartsOption>(
    () => withTheme({
      tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
      legend: { bottom: 0, textStyle: { color: palette.muted, fontSize: 11 }, icon: "circle", itemWidth: 8, itemHeight: 8 },
      graphic: donutCenter(total, "规则", palette),
      series: [{
        type: "pie",
        radius: ["58%", "80%"],
        itemStyle: { borderColor: palette.card, borderWidth: 3, borderRadius: 6 },
        label: { show: false },
        emphasis: { scale: true, scaleSize: 5, itemStyle: { shadowBlur: 16, shadowColor: palette.danger }, label: { show: false } },
        data: [
          { name: "严重", value: counts.critical, itemStyle: { color: barGradient(palette.danger) } },
          { name: "警告", value: counts.warning, itemStyle: { color: barGradient(palette.warning) } },
          { name: "信息", value: counts.info, itemStyle: { color: barGradient(palette.muted) } }
        ]
      }]
    }),
    [counts, palette, total]
  );
  return <EChart option={option} height={150} />;
}

/** Area trend: alert trigger count bucketed into the last 24 hours. */
export function HistoryTrend({ history }: { history: AlertHistory[] }) {
  // Anchor on a stable `now` captured once per mount, so the timeline bars
  // don't drift on every re-render (and we avoid calling Date.now() in render).
  const [now] = useState(() => Date.now());
  const points = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const ts = now - (23 - i) * 3_600_000;
      const count = history.filter((h) => h.triggeredAt > ts - 3_600_000 && h.triggeredAt <= ts).length;
      return { ts, value: count };
    });
  }, [history, now]);
  const option = useMemo<EChartsOption>(
    () => areaTrendOption(points, { color: undefined, max: undefined }),
    [points]
  );
  return <EChart option={option} height={200} />;
}
