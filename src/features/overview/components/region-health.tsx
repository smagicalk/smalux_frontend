import { useMemo } from "react";

import type { Server } from "@/shared/api/methods";

/** Per-region online ratio list — a compact textual complement to the charts. */
export function RegionHealth({ servers }: { servers: Server[] }) {
  const rows = useMemo(() => {
    const m = new Map<string, { online: number; total: number }>();
    for (const s of servers) {
      const r = m.get(s.region) ?? { online: 0, total: 0 };
      r.total++;
      if (s.status === "online") r.online++;
      m.set(s.region, r);
    }
    return [...m.entries()].sort((a, b) => b[1].total - a[1].total);
  }, [servers]);
  if (!rows.length) {
    return <div className="flex h-[180px] items-center justify-center text-xs text-muted-foreground">暂无数据</div>;
  }
  return (
    <div className="flex h-[180px] flex-col justify-center gap-2.5 p-1">
      {rows.map(([region, { online, total }]) => {
        const ratio = total ? online / total : 0;
        const color = ratio > 0.9 ? "var(--success)" : ratio > 0.5 ? "var(--warning)" : "var(--danger)";
        return (
          <div key={region} className="text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{region}</span>
              <span className="tabular-nums">{online}/{total}</span>
            </div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded bg-muted">
              <div className="h-full rounded" style={{ width: `${ratio * 100}%`, background: color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Three-color count strip for the status card — online / warning / offline. */
export function StatusLegend({ servers }: { servers: Server[] }) {
  const tally = useMemo(() => {
    const t = { online: 0, warning: 0, offline: 0 };
    for (const s of servers) t[s.status]++;
    return t;
  }, [servers]);
  const items: { label: string; value: number; color: string }[] = [
    { label: "在线", value: tally.online, color: "var(--success)" },
    { label: "预警", value: tally.warning, color: "var(--warning)" },
    { label: "离线", value: tally.offline, color: "var(--danger)" }
  ];
  return (
    <div className="flex items-center justify-around px-1 pb-1 pt-0.5 text-xs">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-1.5">
          <span className="size-2 rounded-full" style={{ background: it.color, boxShadow: `0 0 6px ${it.color}` }} />
          <span className="text-muted-foreground">{it.label}</span>
          <span className="font-semibold tabular-nums">{it.value}</span>
        </div>
      ))}
    </div>
  );
}
