import { useMemo } from "react";
import { Activity } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { useAlerts } from "@/features/alerts/hooks/use-alerts";
import { useThrottledMonitoring } from "@/features/servers/hooks/use-throttled-monitoring";
import { Badge } from "@/shared/ui/badge";
import { formatCpuPercent } from "@/shared/lib/utils";
import type { AlertSeverity, Server } from "@/shared/api/methods";

import { SEVERITY_META } from "../lib/overview-types";
import { useRelativeTime } from "../lib/use-relative-time";

interface StreamEvent {
  id: string;
  ts: number;
  severity: AlertSeverity;
  title: string;
  message: string;
  serverName?: string;
  resolved?: boolean;
}

/**
 * Live event stream: recent alert history (real, from the backend) merged with
 * synthesized live metric events (high-CPU spikes drawn from the monitoring
 * store), newest first. The list auto-scrolls to top on new data and shows a
 * relative timestamp + severity dot per row.
 */
export function EventStream({ servers }: { servers: Server[] }) {
  const { data: alertsData, isLoading } = useAlerts();

  // Synthesize live metric events: any server whose latest CPU crossed 0.85
  // becomes a "high load" event. Whole-table read is throttled (~1×/s);
  // deriving events in a memo avoids returning a fresh array from the
  // selector, which would trip useSyncExternalStore into an infinite loop.
  const latest = useThrottledMonitoring((l) => l);
  const liveEvents = useMemo(() => {
    const out: { serverId: string; ts: number; severity: AlertSeverity; cpu: number }[] = [];
    for (const sv of servers) {
      const m = latest.get(sv.id);
      if (m && m.cpuUsage > 0.85) {
        out.push({
          serverId: sv.id,
          ts: m.ts,
          severity: m.cpuUsage > 0.95 ? "critical" : "warning",
          cpu: m.cpuUsage
        });
      }
    }
    return out;
  }, [latest, servers]);

  const merged = useMemo<StreamEvent[]>(() => {
    const nameOf = (id: string) => servers.find((s) => s.id === id)?.name ?? id;
    const live = liveEvents.map((e, i) => ({
      id: `live-${e.serverId}-${i}`,
      ts: e.ts,
      severity: e.severity,
      title: "高负载告警",
      message: `${nameOf(e.serverId)} CPU ${formatCpuPercent(e.cpu)}`
    }));
    const real = (alertsData?.history ?? []).map((h) => ({
      id: h.id,
      ts: h.triggeredAt,
      severity: h.severity,
      title: h.ruleName,
      message: h.message,
      serverName: h.serverName,
      resolved: !!h.resolvedAt
    }));
    return [...live, ...real]
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 12);
  }, [liveEvents, alertsData?.history, servers]);

  return (
    <div className="glass cornered scanline group relative overflow-hidden rounded-md border border-border transition-all hover:border-primary/40 hover:shadow-[0_4px_16px_-8px_rgba(0,0,0,0.4)]">
      <span className="scanline__beam" />
      <span className="absolute inset-x-0 top-0 h-px opacity-60 transition-opacity group-hover:opacity-100" style={{ background: "linear-gradient(90deg, transparent, var(--primary), transparent)" }} />
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Activity className="size-3.5 text-primary" />
          实时事件流
          {merged.length > 0 ? <Badge variant="primary">{merged.length}</Badge> : null}
        </span>
        <Link to="/admin/logs" className="text-xs text-primary hover:underline">操作日志</Link>
      </div>
      {isLoading ? (
        <div className="space-y-1 p-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 shimmer rounded bg-muted/30" />
          ))}
        </div>
      ) : merged.length === 0 ? (
        <div className="flex h-[220px] items-center justify-center text-xs text-muted-foreground">暂无事件</div>
      ) : (
        <ul className="max-h-[260px] divide-y divide-border overflow-y-auto">
          {merged.map((ev) => <EventRow key={ev.id} ev={ev} />)}
        </ul>
      )}
    </div>
  );
}

function EventRow({ ev }: { ev: StreamEvent }) {
  const meta = SEVERITY_META[ev.severity];
  const rel = useRelativeTime(ev.ts);
  return (
    <li className="flex items-start gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-muted/30">
      <span className="mt-1 size-2 shrink-0 rounded-full" style={{ background: meta.color, boxShadow: `0 0 6px ${meta.color}` }} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-medium">{ev.title}</span>
          {ev.serverName ? <span className="truncate text-muted-foreground">· {ev.serverName}</span> : null}
          {ev.resolved ? <Badge variant="success">已恢复</Badge> : null}
        </div>
        <div className="truncate text-muted-foreground">{ev.message}</div>
      </div>
      <span className="shrink-0 tabular-nums text-muted-foreground">{rel}</span>
    </li>
  );
}
