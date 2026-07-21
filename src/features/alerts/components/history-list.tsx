import { useMemo, useState } from "react";
import { BellOff } from "lucide-react";

import { Badge } from "@/shared/ui/badge";
import { EmptyState, FilterPills } from "@/shared/ui/layout";
import { formatRelativeFrom } from "@/shared/lib/utils";
import type { AlertHistory } from "@/shared/api/methods";

import { HIST_OPTS, SEVERITY_META, formatThreshold, type HistFilter } from "../lib/alert-meta";

/** The "history" tab: a filterable, reverse-chronological list of alert events. */
export function HistoryList({ history }: { history: AlertHistory[] }) {
  const [histFilter, setHistFilter] = useState<HistFilter>("all");
  const filtered = useMemo(() => {
    const list = [...history].sort((a, b) => b.triggeredAt - a.triggeredAt);
    if (histFilter === "open") return list.filter((h) => h.resolvedAt == null);
    if (histFilter === "resolved") return list.filter((h) => h.resolvedAt != null);
    if (histFilter === "critical") return list.filter((h) => h.severity === "critical");
    return list;
  }, [history, histFilter]);

  return (
    <div className="space-y-2">
      <FilterPills options={HIST_OPTS} value={histFilter} onChange={setHistFilter} />
      {!filtered.length ? (
        <EmptyState text="没有匹配的告警历史。" icon={<BellOff className="size-8" />} />
      ) : (
        <ul className="space-y-2">
          {filtered.map((h) => {
        const sev = SEVERITY_META[h.severity];
        const open = h.resolvedAt == null;
        const dotColor = open
          ? (h.severity === "critical" ? "var(--danger)" : "var(--warning)")
          : "var(--success)";
        const edgeColor = open ? dotColor : "var(--success)";
        const pulse = open && h.severity === "critical";
        const triggeredAbs = new Date(h.triggeredAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
        return (
          <li key={h.id} className="glass cornered group relative overflow-hidden rounded-md border border-border p-3 pl-4 transition-colors hover:border-primary/40">
            <span className="absolute inset-y-0 left-0 w-1" style={{ background: edgeColor, boxShadow: `0 0 10px ${edgeColor}` }} />
            <div className="flex flex-wrap items-center gap-2">
              <span className="relative flex size-2">
                {pulse ? <span className="pulse-ring" style={{ background: dotColor }} /> : null}
                <span className="size-2 rounded-full" style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}` }} />
              </span>
              <span className="font-medium group-hover:text-primary">{h.ruleName}</span>
              <Badge variant={sev.variant}>{sev.label}</Badge>
              {open ? <Badge variant="danger">未恢复</Badge> : <Badge variant="success">已恢复</Badge>}
              <span className="ml-auto text-xs text-muted-foreground tabular-nums">{triggeredAbs}</span>
            </div>
            <div className="mt-1.5 text-sm">{h.message}</div>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
              {h.serverName ? <span>{h.serverName} ·</span> : null}
              <span>触发值: {formatThreshold(h.value)}</span>
              <span>· {formatRelativeFrom(h.triggeredAt)}</span>
              {open ? null : <span>· 恢复于 {formatRelativeFrom(h.resolvedAt)}</span>}
            </div>
          </li>
        );
      })}
        </ul>
      )}
    </div>
  );
}
