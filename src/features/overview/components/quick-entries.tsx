import type { ReactNode } from "react";
import { Activity, Clock, Globe2, Layers, Siren, Zap } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import { useAlerts } from "@/features/alerts/hooks/use-alerts";

/**
 * Most-used module shortcuts, sized as fat tap targets. Each links to its
 * module with a live count where we have one (servers / alerts / exceptions).
 */
export function QuickEntries({ counts }: { counts: { total: number; online: number; warning: number; offline: number } }) {
  const { data: alertsData } = useAlerts();
  const openAlerts = (alertsData?.history ?? []).filter((h) => !h.resolvedAt).length;
  const entries: { to: string; label: string; desc: string; icon: ReactNode; color: string }[] = [
    { to: "/admin/servers", label: "服务器", desc: `${counts.total} 台 · ${counts.online} 在线`, icon: <Layers className="size-4" />, color: "var(--primary)" },
    { to: "/admin/alerts", label: "告警", desc: `${openAlerts} 未恢复`, icon: <Siren className="size-4" />, color: "var(--danger)" },
    { to: "/admin/tasks", label: "远程执行", desc: "下发命令", icon: <Zap className="size-4" />, color: "var(--cyan)" },
    { to: "/admin/cron", label: "计划任务", desc: "定时调度", icon: <Clock className="size-4" />, color: "var(--violet)" },
    { to: "/admin/ping", label: "服务监控", desc: "存活探测", icon: <Activity className="size-4" />, color: "var(--success)" },
    { to: "/admin/logs", label: "操作日志", desc: "操作回溯", icon: <Globe2 className="size-4" />, color: "var(--warning)" }
  ];
  const navigate = useNavigate();
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-2">
      {entries.map((e) => (
        <button
          key={e.to}
          onClick={() => navigate({ to: e.to as never })}
          className="glass cornered group relative flex items-center gap-2.5 overflow-hidden rounded-md border border-border px-3 py-2.5 text-left transition-all hover:border-primary/40 hover:shadow-[0_4px_16px_-8px_rgba(0,0,0,0.4),0_0_18px_-8px_var(--primary)]"
        >
          <span className="absolute inset-x-0 top-0 h-px opacity-60 transition-opacity group-hover:opacity-100" style={{ background: `linear-gradient(90deg, transparent, ${e.color}, transparent)` }} />
          <span className="flex size-8 items-center justify-center rounded-md" style={{ background: `color-mix(in oklch, ${e.color} 18%, transparent)`, color: e.color }}>
            {e.icon}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              {e.label}
            </span>
            <span className="block truncate text-[11px] text-muted-foreground">{e.desc}</span>
          </span>
          <span className="text-muted-foreground transition-transform group-hover:translate-x-0.5">→</span>
        </button>
      ))}
    </div>
  );
}
