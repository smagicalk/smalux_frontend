import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { useAlerts, useSilenceAlert } from "@/features/alerts/hooks/use-alerts";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { toast } from "@/shared/ui/toaster";
import type { AlertHistory } from "@/shared/api/methods";

import { SEVERITY_META } from "@/features/alerts/lib/alert-meta";
import { useRelativeTime } from "@/features/overview/lib/use-relative-time";

/**
 * Top-bar notification bell. The dot turns into a live count of unresolved
 * alerts (warning + critical only — info is too noisy to nag the operator
 * with). Click opens a popover listing the most recent open alerts with a
 * severity dot + relative time; "查看全部" jumps to the alerts page.
 *
 * Read state isn't tracked here: a triggered alert stays surfaced until the
 * backend marks it resolved (resolvedAt set) — that's the honest "you still
 * need to look at this" signal, not a click-to-dismiss UX that hides active
 * problems.
 */
export function NotificationCenter() {
  const { data, isLoading } = useAlerts();
  const history = data?.history ?? [];
  const open = history.filter((h) => h.resolvedAt == null);
  const notable = open.filter((h) => h.severity !== "info"); // warning + critical
  const critical = open.filter((h) => h.severity === "critical");

  const [panelOpen, setPanelOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Esc. A lightweight click-outside instead of a
  // full popover primitive keeps the shell dependency-free.
  useEffect(() => {
    if (!panelOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setPanelOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPanelOpen(false); };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [panelOpen]);

  // The popover shows the most recent open alerts first.
  const recent = [...open].sort((a, b) => b.triggeredAt - a.triggeredAt).slice(0, 6);
  const dot = critical.length
    ? "var(--danger)"
    : notable.length
      ? "var(--warning)"
      : "var(--primary)";

  return (
    <div ref={rootRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label="通知"
        aria-expanded={panelOpen}
        onClick={() => setPanelOpen((v) => !v)}
        className="relative"
      >
        <Bell className="size-4" />
        {notable.length > 0 ? (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold leading-none text-white shadow-[0_0_6px_var(--ring)]"
            style={{ background: dot }}
          >
            {notable.length}
          </span>
        ) : null}
      </Button>

      {panelOpen ? (
        <div className="glass cornered absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-md border border-border shadow-[0_8px_32px_-8px_rgba(0,0,0,0.5)]">
          <PanelHeader count={open.length} recent={recent} />
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-1 p-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 shimmer rounded bg-muted/30" />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                <Bell className="size-6 opacity-40" />
                暂无未恢复告警
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((h) => <NotificationRow key={h.id} alert={h} />)}
              </ul>
            )}
          </div>
          <Link
            to="/admin/alerts"
            onClick={() => setPanelOpen(false)}
            className="block border-t border-border py-2 text-center text-xs text-primary hover:underline"
          >
            查看全部告警
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function PanelHeader({ count, recent }: { count: number; recent: AlertHistory[] }) {
  const silence = useSilenceAlert();
  // "全部已读" = silence every open alert's rule. We only ever enable it when
  // there's something to acknowledge, and we silence by *rule* (the silence
  // API is rule-scoped), deduping so one rule with 5 firings is one call.
  const ruleIds = [...new Set(recent.map((h) => h.ruleId))];
  const markAllRead = () => {
    if (!ruleIds.length) return;
    Promise.all(ruleIds.map((id) => silence.mutateAsync({ id, silenced: true })))
      .then(() => toast.success(`已静默 ${ruleIds.length} 条规则`))
      .catch(() => toast.error("静默失败"));
  };
  return (
    <div className="flex items-center justify-between border-b border-border px-3 py-2">
      <span className="flex items-center gap-2 text-sm font-semibold">
        通知
        {count > 0 ? <Badge variant="danger">{count}</Badge> : null}
      </span>
      <Button
        size="sm"
        variant="ghost"
        onClick={markAllRead}
        disabled={!ruleIds.length || silence.isPending}
        className="h-7 gap-1 px-2 text-xs"
      >
        <CheckCheck className="size-3.5" />
        全部静默
      </Button>
    </div>
  );
}

function NotificationRow({ alert }: { alert: AlertHistory }) {
  const sev = SEVERITY_META[alert.severity];
  const rel = useRelativeTime(alert.triggeredAt);
  const dotColor = alert.severity === "critical" ? "var(--danger)" : alert.severity === "warning" ? "var(--warning)" : "var(--primary)";
  const pulse = alert.severity === "critical";
  return (
    <li className="group flex items-start gap-2.5 px-3 py-2.5 transition-colors hover:bg-muted/30">
      <span className="relative mt-1 flex size-2 shrink-0">
        {pulse ? <span className="pulse-ring" style={{ background: dotColor }} /> : null}
        <span className="size-2 rounded-full" style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}` }} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">{alert.ruleName}</span>
          <Badge variant={sev.variant}>{sev.label}</Badge>
        </div>
        <div className="truncate text-xs text-muted-foreground">{alert.message}</div>
        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
          {alert.serverName ? <span className="truncate">{alert.serverName} ·</span> : null}
          <span className="tabular-nums">{rel}</span>
        </div>
      </div>
    </li>
  );
}
