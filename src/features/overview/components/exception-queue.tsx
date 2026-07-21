import type { ReactNode } from "react";
import { useMemo } from "react";
import { CheckCircle2, Clock, Cpu, HardDrive, MemoryStick, Siren } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { useMonitoringStore } from "@/features/servers/hooks/monitoring-store";
import { useServerHistory } from "@/features/servers/hooks/use-monitoring";
import { Badge } from "@/shared/ui/badge";
import { Sparkline } from "@/shared/charts/sparkline";
import { formatBytes, formatCpuPercent } from "@/shared/lib/utils";
import type { Server } from "@/shared/api/methods";

import { useRelativeTime } from "../lib/use-relative-time";

/**
 * The exception queue: every non-online node, worst-first (offline above
 * warning, and within a tier the hottest CPU on top). Each row links to the
 * server detail page and shows a live CPU sparkline + compact resource pills.
 */
export function ExceptionQueue({ servers, isLoading }: { servers: Server[]; isLoading: boolean }) {
  // Severity order: offline first (highest urgency), then warning. Within a
  // tier, the node with the worst CPU wins so the hottest problem sits at top.
  const ordered = useMemo(() => {
    const store = useMonitoringStore.getState();
    return [...servers].sort((a, b) => {
      const ra = a.status === "offline" ? 0 : 1;
      const rb = b.status === "offline" ? 0 : 1;
      if (ra !== rb) return ra - rb;
      const ca = store.latest.get(a.id)?.cpuUsage ?? 0;
      const cb = store.latest.get(b.id)?.cpuUsage ?? 0;
      return cb - ca;
    });
  }, [servers]);
  return (
    <div className="glass cornered group relative overflow-hidden rounded-md border border-border transition-all hover:border-primary/40 hover:shadow-[0_4px_16px_-8px_rgba(0,0,0,0.4)]">
      <span className="absolute inset-x-0 top-0 h-px opacity-60 transition-opacity group-hover:opacity-100" style={{ background: "linear-gradient(90deg, transparent, var(--danger), transparent)" }} />
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <Siren className="size-3.5 text-danger" />
          异常队列
          {ordered.length > 0 ? <Badge variant="danger">{ordered.length}</Badge> : null}
        </span>
        <Link to="/admin/servers" className="text-xs text-primary hover:underline">查看全部服务器</Link>
      </div>
      {isLoading ? (
        <div className="space-y-1 p-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-md bg-muted/40" />
          ))}
        </div>
      ) : ordered.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 p-8 text-center">
          <CheckCircle2 className="size-6 text-success" />
          <div className="text-sm font-medium text-foreground">当前无异常</div>
          <div className="text-xs text-muted-foreground">舰队运行正常，所有节点在线。</div>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {ordered.map((s) => <ExceptionRow key={s.id} server={s} />)}
        </ul>
      )}
    </div>
  );
}

/**
 * One exception row: identity + severity badge on the left, a live CPU sparkline
 * and a compact resource stack (CPU / mem / disk) on the right, plus a relative
 * last-seen timestamp so the operator knows how stale an offline node is.
 */
function ExceptionRow({ server }: { server: Server }) {
  const metrics = useMonitoringStore((s) => s.latest.get(server.id));
  const history = useServerHistory(server.id);
  const variant = server.status === "warning" ? "warning" : "danger";
  const color = variant === "warning" ? "var(--warning)" : "var(--danger)";
  const cpuPoints = history.slice(-30).map((m) => ({ ts: m.ts, value: m.cpuUsage }));
  const lastSeen = useRelativeTime(server.lastSeenAt);
  return (
    <li className="group relative">
      <span className="absolute inset-y-0 left-0 w-0.5 opacity-60 transition-opacity group-hover:opacity-100" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      <Link
        to="/admin/servers/$id"
        params={{ id: server.id }}
        className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2 pl-4 text-sm transition-colors hover:bg-muted/30"
      >
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
          <span className="font-medium group-hover:text-primary">{server.name}</span>
          <Badge variant={variant}>{server.status === "warning" ? "预警" : "离线"}</Badge>
        </span>
        <span className="text-xs text-muted-foreground">{server.region}</span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3" />
          {lastSeen}
        </span>
        <span className="ml-auto flex items-center gap-3">
          {metrics && <ResourcePill icon={<Cpu className="size-3" />} label="CPU" value={formatCpuPercent(metrics.cpuUsage)} ratio={metrics.cpuUsage} color="var(--cyan)" />}
          {metrics && metrics.memTotal > 0 && <ResourcePill icon={<MemoryStick className="size-3" />} label="内存" value={formatBytes(metrics.memUsed)} ratio={metrics.memUsed / metrics.memTotal} color="var(--violet)" />}
          {metrics && metrics.diskTotal > 0 && <ResourcePill icon={<HardDrive className="size-3" />} label="磁盘" value={formatBytes(metrics.diskUsed)} ratio={metrics.diskUsed / metrics.diskTotal} color="var(--warning)" />}
          {cpuPoints.length > 1 && (
            <span className="hidden w-20 sm:block">
              <Sparkline points={cpuPoints} color={color} height={24} domain={[0, 1]} />
            </span>
          )}
        </span>
      </Link>
    </li>
  );
}

/** Compact metric chip: icon + label + value, with a tiny ratio bar. */
function ResourcePill({
  icon,
  label,
  value,
  ratio,
  color
}: {
  icon: ReactNode;
  label: string;
  value: string;
  ratio: number;
  color: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
        <span style={{ color }}>{icon}</span>
        {label}
      </span>
      <span className="tabular-nums text-xs">{value}</span>
      <span className="hidden h-1 w-10 overflow-hidden rounded bg-muted lg:inline-block">
        <span className="block h-full rounded" style={{ width: `${Math.min(100, ratio * 100)}%`, background: ratio > 0.85 ? "var(--danger)" : color }} />
      </span>
    </span>
  );
}
