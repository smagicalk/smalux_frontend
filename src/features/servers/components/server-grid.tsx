import { Link } from "@tanstack/react-router";

import { useServerMetrics, useServerHistory } from "@/features/servers/hooks/use-monitoring";
import { useMonitoringStore } from "@/features/servers/hooks/monitoring-store";
import { Sparkline } from "@/shared/charts/sparkline";
import { Badge } from "@/shared/ui/badge";
import { cn, formatBytes, formatCpuPercent, formatRate, formatRelativeFrom, formatUptime } from "@/shared/lib/utils";
import type { Server } from "@/shared/api/methods";

import { STATUS_META, statusColor } from "../lib/server-meta";

/** The live server list. Each row subscribes to its own metrics so only that
 *  row re-renders on a tick, not the whole list. One row per server — a wider
 *  card reads the resource trio + sparkline + secondary strip at a glance. */
export function ServerGrid({ servers }: { servers: Server[] }) {
  return (
    <div className="grid grid-cols-1 gap-1.5">
      {servers.map((s) => (
        <ServerRow key={s.id} server={s} />
      ))}
    </div>
  );
}

function ServerRow({ server }: { server: Server }) {
  useServerMetrics(server.id);
  const metrics = useMonitoringStore((s) => s.latest.get(server.id));
  const history = useServerHistory(server.id);
  const meta = STATUS_META[server.status];
  const status = statusColor(server.status);

  const cpuPoints = history.slice(-30).map((m) => ({ ts: m.ts, value: m.cpuUsage }));
  // Memory ratio history for a second sparkline — keeps CPU/mem visually paired
  // so a memory leak reads as a climbing line next to the CPU trace.
  const memPoints = history.slice(-30).map((m) => ({ ts: m.ts, value: m.memTotal ? m.memUsed / m.memTotal : 0 }));
  const memRatio = metrics && metrics.memTotal ? metrics.memUsed / metrics.memTotal : undefined;

  return (
    <Link
      to={`/admin/servers/${server.id}`}
      className="glass cornered group relative flex flex-col gap-2 overflow-hidden rounded-md border border-border p-3 pl-4 transition-all hover:border-primary/50 hover:shadow-[0_0_20px_-8px_var(--primary)]"
    >
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: status, boxShadow: `0 0 10px ${status}` }}
      />
      <span className="absolute inset-x-0 top-0 h-px opacity-0 transition-opacity group-hover:opacity-100" style={{ background: `linear-gradient(90deg, transparent, ${status}, transparent)` }} />
      <div className="flex items-center gap-2">
        <span
          className="size-2 rounded-full"
          style={{ background: status, boxShadow: `0 0 8px ${status}` }}
        />
        <span className="text-sm font-medium group-hover:text-primary group-hover:underline">{server.name}</span>
        <Badge variant={meta.variant}>{meta.label}</Badge>
        {server.tags.length > 0 && (
          <span className="hidden items-center gap-1 sm:flex">
            {server.tags.slice(0, 3).map((t) => (
              <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{t}</span>
            ))}
          </span>
        )}
        <span className="ml-auto text-xs text-muted-foreground">{server.region}</span>
        {server.os && (
          <code className="hidden text-[10px] text-muted-foreground md:inline">{server.os}/{server.arch ?? "?"}</code>
        )}
        <span className="ml-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100">→</span>
      </div>

      {metrics ? (
        <>
          <div className="flex items-stretch gap-3">
            <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-3">
              <Metric label="CPU" value={formatCpuPercent(metrics.cpuUsage)} ratio={metrics.cpuUsage} />
              <Metric
                label="内存"
                value={formatBytes(metrics.memUsed)}
                sub={`/ ${formatBytes(metrics.memTotal)}`}
                ratio={memRatio}
              />
              <Metric
                label="磁盘"
                value={formatBytes(metrics.diskUsed)}
                sub={`/ ${formatBytes(metrics.diskTotal)}`}
                ratio={metrics.diskTotal ? metrics.diskUsed / metrics.diskTotal : undefined}
              />
            </div>
            <div className="hidden w-28 shrink-0 flex-col justify-center sm:flex">
              <span className="mb-1 text-[10px] text-muted-foreground">CPU / 内存 30s</span>
              <div className="flex items-center gap-1.5">
                <Sparkline points={cpuPoints} height={28} domain={[0, 1]} />
                <Sparkline points={memPoints} height={28} domain={[0, 1]} color="var(--violet)" />
              </div>
            </div>
          </div>

          {/* Secondary stats — network + system, no progress bars (they aren't 0..1
              ratios) so the row keeps a calm baseline under the resource trio. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <Stat label="↑上行" value={formatRate(metrics.netTxSpeed)} />
            <Stat label="↓下行" value={formatRate(metrics.netRxSpeed)} />
            <Stat label="负载" value={metrics.loadOne?.toFixed(2) ?? "-"} />
            <Stat label="运行" value={formatUptime(metrics.uptime)} />
            {metrics.tcpEnabled && metrics.tcpConnections != null ? (
              <Stat label="TCP" value={String(metrics.tcpConnections)} />
            ) : (
              <Stat label="TCP" value="关" muted />
            )}
            {metrics.swapTotal > 0 ? <Stat label="Swap" value={`${((metrics.swapUsed / metrics.swapTotal) * 100).toFixed(0)}%`} /> : null}
            {metrics.processCount ? <Stat label="进程" value={String(metrics.processCount)} /> : null}
          </div>
        </>
      ) : (
        // No live metrics yet (offline / just registered): a calm status hint
        // instead of a row of "-" placeholders, so the card still reads as
        // intentional rather than broken.
        <div className="flex items-center gap-2 py-1.5 text-xs text-muted-foreground">
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{meta.label}</span>
          <span>
            {server.status === "offline" ? "无上报数据" : "等待首次上报"}
            {server.lastSeenAt ? ` · 最后上报 ${formatRelativeFrom(server.lastSeenAt)}` : null}
          </span>
        </div>
      )}
    </Link>
  );
}

/** Compact label/value pair for the secondary (non-ratio) stat strip. */
function Stat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="text-muted-foreground/70">{label}</span>
      <span className={cn("tabular-nums", muted ? "text-muted-foreground/50" : "text-foreground/80")}>{value}</span>
    </span>
  );
}

function Metric({
  label,
  value,
  sub,
  ratio
}: {
  label: string;
  value: string;
  sub?: string;
  ratio?: number;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">
        {value}
        {sub ? <span className="text-muted-foreground"> {sub}</span> : null}
      </span>
      {ratio !== undefined && (
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, ratio * 100)}%`,
              background: ratio > 0.85 ? "var(--danger)" : ratio > 0.65 ? "var(--warning)" : "var(--success)",
              boxShadow: `0 0 6px ${ratio > 0.85 ? "var(--danger)" : ratio > 0.65 ? "var(--warning)" : "var(--success)"}`
            }}
          />
        </div>
      )}
    </div>
  );
}
