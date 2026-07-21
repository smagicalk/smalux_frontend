import { useMemo, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Cpu, Globe2 } from "lucide-react";

import { useThrottledMonitoring } from "@/features/servers/hooks/use-throttled-monitoring";
import { Sparkline } from "@/shared/charts/sparkline";
import { EChart } from "@/shared/charts/echart";
import { regionDistributionOption, statusDistributionOption } from "@/shared/charts/chart-options";
import type { Server } from "@/shared/api/methods";

/**
 * Top distribution band: region rose + status water-level + an OS/arch breakdown
 * with a live cluster-CPU sparkline. Gives the server page a one-glance fleet
 * picture before the operator drills into the list — the list shows *which*
 * nodes, this band shows *what shape* the fleet is.
 */
export function DistributionRow({ servers, serverIds }: { servers: Server[]; serverIds: string[] }) {
  const regionOption = useMemo(() => regionDistributionOption(servers), [servers]);
  const statusOption = useMemo(() => statusDistributionOption(servers), [servers]);

  const osBreakdown = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of servers) m.set(s.os ?? "unknown", (m.get(s.os ?? "unknown") ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [servers]);

  const archBreakdown = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of servers) m.set(s.arch ?? "unknown", (m.get(s.arch ?? "unknown") ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [servers]);

  // Live cluster CPU sparkline — last 30 ticks of the union history. Read on
  // a ~1s throttle (whole-table history); deriving points in a memo avoids
  // returning a fresh array from the selector, which would trip
  // useSyncExternalStore into an infinite re-render loop.
  const history = useThrottledMonitoring((_latest, h) => h);
  const cpuSpark = useMemo(() => {
    const tsSet = new Set<number>();
    for (const id of serverIds) for (const m of history.get(id) ?? []) tsSet.add(m.ts);
    const ts = [...tsSet].sort((a, b) => a - b).slice(-30);
    return ts.map((t) => {
      let sum = 0, n = 0;
      for (const id of serverIds) {
        const m = (history.get(id) ?? []).find((p) => p.ts === t);
        if (m) { sum += m.cpuUsage; n++; }
      }
      return { ts: t, value: n ? sum / n : 0 };
    });
  }, [history, serverIds]);

  if (!servers.length) return null;

  return (
    <div className="grid grid-cols-1 gap-3 px-4 py-3 lg:grid-cols-4">
      <DistCard title="区域分布" icon={<Globe2 className="size-3.5" />} accent="var(--primary)">
        <EChart option={regionOption} height={150} />
      </DistCard>
      <DistCard title="状态水位" icon={<CheckCircle2 className="size-3.5" />} accent="var(--success)">
        <EChart option={statusOption} height={150} />
      </DistCard>
      <DistCard title="系统 / 架构" icon={<Cpu className="size-3.5" />} accent="var(--violet)">
        <div className="flex h-[150px] flex-col justify-center gap-3 p-2 text-xs">
          <BreakdownList label="OS" entries={osBreakdown} />
          <BreakdownList label="架构" entries={archBreakdown} />
        </div>
      </DistCard>
      <DistCard title="集群 CPU" icon={<AlertTriangle className="size-3.5" />} accent="var(--cyan)">
        <div className="flex h-[150px] flex-col justify-center gap-1 p-2">
          {cpuSpark.length > 1 ? (
            <Sparkline points={cpuSpark} color="var(--cyan)" height={48} domain={[0, 1]} />
          ) : (
            <div className="flex h-12 items-center justify-center text-[11px] text-muted-foreground">等待数据…</div>
          )}
          <div className="text-center text-[11px] text-muted-foreground">近 {cpuSpark.length} 个采样均值</div>
        </div>
      </DistCard>
    </div>
  );
}

/** A small glass panel with a colored top-hairline, used by the distribution band. */
function DistCard({
  title,
  icon,
  accent,
  children
}: {
  title: string;
  icon: ReactNode;
  accent: string;
  children: ReactNode;
}) {
  return (
    <div className="glass cornered relative overflow-hidden rounded-md border border-border">
      <span className="absolute inset-x-0 top-0 h-px opacity-60" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }} />
      <div className="flex items-center gap-1.5 border-b border-border px-3 py-1.5 text-xs font-semibold">
        <span style={{ color: accent }}>{icon}</span>
        {title}
      </div>
      <div className="p-1">{children}</div>
    </div>
  );
}

/** Labeled key→count list with a ratio bar per row, for OS/arch breakdowns. */
function BreakdownList({ label, entries }: { label: string; entries: [string, number][] }) {
  const total = entries.reduce((s, [, n]) => s + n, 0) || 1;
  const colors = ["var(--violet)", "var(--cyan)", "var(--magenta)", "var(--success)", "var(--warning)"];
  return (
    <div>
      <div className="mb-1 text-[11px] text-muted-foreground">{label}</div>
      <div className="space-y-1">
        {entries.map(([key, n], i) => (
          <div key={key} className="flex items-center gap-2">
            <span className="w-14 truncate">{key}</span>
            <span className="h-1 flex-1 overflow-hidden rounded bg-muted">
              <span className="block h-full rounded" style={{ width: `${(n / total) * 100}%`, background: colors[i % colors.length] }} />
            </span>
            <span className="w-6 text-right tabular-nums text-muted-foreground">{n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
