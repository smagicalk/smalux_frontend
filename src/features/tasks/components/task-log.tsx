import { Fragment, useState } from "react";

import { useTasks } from "@/features/tasks/hooks/use-tasks";
import { Badge } from "@/shared/ui/badge";
import { EmptyState } from "@/shared/ui/layout";
import { cn, formatRelativeFrom } from "@/shared/lib/utils";
import type { Task, TaskStatus } from "@/shared/api/methods";

import { RISK_VARIANT, STATUS_META } from "../lib/task-meta";

/**
 * The task log: a filterable table of every task, rows expand to reveal the
 * terminal-style output panel. Status dot + risk badge + slow-duration tinting
 * let the operator scan for failures at a glance.
 */
export function TaskLog() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TaskStatus | "all">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data, isLoading } = useTasks({ search, status: status === "all" ? undefined : status });

  if (isLoading) return <EmptyState text="加载任务日志…" />;

  const tasks = data?.tasks ?? [];
  if (!tasks.length) return <EmptyState text="没有匹配的任务。" />;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索命令 / 服务器"
          className="h-8 w-56 rounded-md border border-border bg-card px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as TaskStatus | "all")}
          className="h-8 rounded-md border border-border bg-card px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">全部状态</option>
          {(Object.keys(STATUS_META) as TaskStatus[]).map((s) => (
            <option key={s} value={s}>{STATUS_META[s].label}</option>
          ))}
        </select>
        <span className="ml-auto text-[11px] text-muted-foreground">点击行展开输出</span>
      </div>

      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="w-6 px-2 py-2" />
              <th className="px-3 py-2 text-left font-medium">服务器</th>
              <th className="px-3 py-2 text-left font-medium">命令</th>
              <th className="px-3 py-2 text-left font-medium">风险</th>
              <th className="px-3 py-2 text-left font-medium">状态</th>
              <th className="px-3 py-2 text-right font-medium">耗时</th>
              <th className="px-3 py-2 text-right font-medium">退出码</th>
              <th className="px-3 py-2 text-right font-medium">开始</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tasks.map((t) => {
              const meta = STATUS_META[t.status];
              const statusDot = meta.variant === "success" ? "var(--success)"
                : meta.variant === "danger" ? "var(--danger)"
                  : meta.variant === "warning" ? "var(--warning)"
                    : meta.variant === "primary" ? "var(--primary)" : "var(--muted-foreground)";
              const exitOk = t.exitCode === 0;
              const slow = t.durationMs != null && t.durationMs > 10_000;
              const isOpen = expanded === t.id;
              return (
                <Fragment key={t.id}>
                  <tr
                    className={cn("group cursor-pointer transition-colors hover:bg-muted/30", isOpen && "bg-muted/30")}
                    onClick={() => setExpanded(isOpen ? null : t.id)}
                  >
                    <td className="px-2 py-2 text-center text-muted-foreground">
                      <span className={cn("inline-block transition-transform", isOpen && "rotate-90")}>›</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-2">
                        <span className="size-1.5 rounded-full" style={{ background: statusDot, boxShadow: `0 0 6px ${statusDot}` }} />
                        {t.serverName}
                      </span>
                    </td>
                    <td className="max-w-[320px] truncate px-3 py-2 font-mono text-xs" title={t.command}>{t.command}</td>
                    <td className="px-3 py-2"><Badge variant={RISK_VARIANT[t.risk]}>{t.risk}</Badge></td>
                    <td className="px-3 py-2"><Badge variant={meta.variant}>{meta.label}</Badge></td>
                    <td className={cn("px-3 py-2 text-right tabular-nums", slow ? "text-warning" : "")}>{t.durationMs ? `${(t.durationMs / 1000).toFixed(1)}s` : "-"}</td>
                    <td className={cn("px-3 py-2 text-right tabular-nums font-medium", t.exitCode == null ? "text-muted-foreground" : exitOk ? "text-success" : "text-danger")}>
                      {t.exitCode ?? "-"}
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{formatRelativeFrom(t.startedAt)}</td>
                  </tr>
                  {isOpen ? (
                    <tr>
                      <td colSpan={8} className="bg-background/60 p-0">
                        <TaskOutput task={t} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Terminal-style output panel for an expanded task row. Renders the command as
 * a prompt line and the captured stdout/stderr in a mono block tinted by exit
 * status, so a glance tells you whether it exited clean — mission-control readout
 * rather than a plain <pre>.
 */
function TaskOutput({ task }: { task: Task }) {
  const ok = task.status === "success";
  const accent = ok ? "var(--success)" : task.status === "running" || task.status === "approved" ? "var(--primary)" : "var(--danger)";
  return (
    <div className="scanline relative m-2 overflow-hidden rounded-md border border-border bg-[oklch(0.12_0.01_258)]">
      <span className="scanline__beam" />
      <div className="flex items-center gap-2 border-b border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground">
        <span className="flex gap-1">
          <span className="size-2 rounded-full bg-danger/70" />
          <span className="size-2 rounded-full bg-warning/70" />
          <span className="size-2 rounded-full bg-success/70" />
        </span>
        <span className="font-mono">{task.serverName ?? "node"}:~$</span>
        <span className="ml-auto" style={{ color: accent }}>{ok ? "exit 0" : task.exitCode != null ? `exit ${task.exitCode}` : task.status}</span>
      </div>
      <div className="relative p-3 font-mono text-xs leading-relaxed">
        <div className="text-muted-foreground"><span style={{ color: "var(--primary)" }}>$</span> {task.command}</div>
        <pre className="mt-1.5 whitespace-pre-wrap break-all text-foreground/90">
          {task.output ? task.output : <span className="text-muted-foreground">（无输出）</span>}
        </pre>
      </div>
    </div>
  );
}
