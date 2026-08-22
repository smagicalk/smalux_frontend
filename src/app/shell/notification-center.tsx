import { useEffect, useRef, useState, useMemo } from "react";
import { Bell, CheckCheck, ArrowUpRight, ShieldAlert, Server, CheckCircle2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { useAlertsData } from "@/features/alerts/api/use-alerts-api";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { toast } from "@/shared/ui/toaster";
import type { AlertHistoryEvent } from "@/features/alerts/types";
import { useRelativeTime } from "@/features/overview/lib/use-relative-time";

/**
 * Top-bar notification center popover.
 * Shows numeric badge of unread urgent incidents.
 * Clicking "全部已读" immediately clears the unread count.
 */
export function NotificationCenter() {
  const { history: initialHistory, isLoading } = useAlertsData();

  // Track acknowledged / read state locally
  const [ackedIds, setAckedIds] = useState<Set<string>>(new Set());
  const [panelOpen, setPanelOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Esc
  useEffect(() => {
    if (!panelOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanelOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [panelOpen]);

  // Filter unread / active alerts
  const unreadAlerts = useMemo(() => {
    return initialHistory.filter((h) => !ackedIds.has(h.id) && h.resolvedAt == null);
  }, [initialHistory, ackedIds]);

  const unreadCount = unreadAlerts.length;
  const hasCritical = unreadAlerts.some((h) => h.severity === "critical");

  // Show top 4 items with a "view more" footer if there are more
  const displayAlerts = unreadAlerts.slice(0, 4);

  const handleMarkAllRead = () => {
    const allIds = new Set(initialHistory.map((h) => h.id));
    setAckedIds(allIds);
    toast.success(`已将全部 ${unreadCount} 条异常告警标为已读`);
  };

  const handleAckSingle = (id: string, ruleName: string) => {
    setAckedIds((prev) => new Set([...prev, id]));
    toast.success(`已处理: ${ruleName}`);
  };

  return (
    <div ref={rootRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        aria-label="系统未决通知"
        aria-expanded={panelOpen}
        onClick={() => setPanelOpen((v) => !v)}
        className="relative cursor-pointer text-muted-foreground hover:text-foreground"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span
            className={`absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold font-mono text-white shadow-xs ${
              hasCritical ? "bg-rose-500 animate-pulse" : "bg-amber-500"
            }`}
          >
            {unreadCount}
          </span>
        )}
      </Button>

      {panelOpen && (
        <div className="absolute right-0 top-11 z-50 w-84 overflow-hidden rounded-xl border border-border/80 bg-popover/95 backdrop-blur-xl shadow-xl animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/70 bg-muted/20 px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-amber-500" />
              <span className="text-xs font-bold text-foreground">未决告警与通知</span>
              {unreadCount > 0 && (
                <Badge variant="warning" className="text-[10px] px-1.5 py-0 h-4 font-mono">
                  {unreadCount} 条未读
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleMarkAllRead}
                className="h-6 gap-1 px-2 text-[11px] cursor-pointer text-muted-foreground hover:text-foreground"
              >
                <CheckCheck className="size-3 text-emerald-500" />
                全部已读
              </Button>
            )}
          </div>

          {/* Alert Rows */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/40" />
                ))}
              </div>
            ) : unreadAlerts.length === 0 ? (
              <div className="flex h-36 flex-col items-center justify-center gap-2 text-xs text-muted-foreground font-mono">
                <CheckCircle2 className="size-6 text-emerald-500/80 mb-1" />
                <span>全网暂无未读告警通知</span>
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {displayAlerts.map((h) => (
                  <NotificationRow
                    key={h.id}
                    alert={h}
                    onAck={() => handleAckSingle(h.id, h.ruleName)}
                    onClose={() => setPanelOpen(false)}
                  />
                ))}
              </ul>
            )}
          </div>

          {/* Footer: View More */}
          <div className="border-t border-border/70 bg-muted/20 px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground font-mono">
              {unreadCount > 4 ? `显示前 4 条 · 共 ${unreadCount} 条` : `共 ${unreadCount} 条待办`}
            </span>
            <Link
              to="/admin/alerts"
              onClick={() => setPanelOpen(false)}
              className="text-xs text-primary hover:underline flex items-center gap-0.5 cursor-pointer font-medium"
            >
              查看全部告警 ({initialHistory.length}) <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationRow({
  alert,
  onAck,
  onClose
}: {
  alert: AlertHistoryEvent;
  onAck: () => void;
  onClose: () => void;
}) {
  const rel = useRelativeTime(alert.triggeredAt);
  const isCrit = alert.severity === "critical";

  return (
    <li className="flex items-start gap-2.5 p-3 transition-colors hover:bg-muted/30">
      <span
        className={`size-2 rounded-full mt-1.5 shrink-0 ${
          isCrit ? "bg-rose-500 animate-pulse" : "bg-amber-400"
        }`}
      />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between gap-1">
          <span className="truncate text-xs font-semibold text-foreground">
            {alert.ruleName}
          </span>
          <Badge
            variant={isCrit ? "danger" : "warning"}
            className="text-[9px] px-1 py-0 h-3.5 font-normal shrink-0"
          >
            {isCrit ? "P0 严重" : "P1 警告"}
          </Badge>
        </div>

        <div className="text-[11px] text-muted-foreground line-clamp-1">
          {alert.message}
        </div>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono pt-0.5">
          <Link
            to="/admin/infrastructure"
            search={{ server: alert.serverId || alert.serverName }}
            onClick={onClose}
            className="text-foreground/90 hover:text-primary hover:underline flex items-center gap-1 cursor-pointer truncate max-w-[140px]"
          >
            <Server className="size-2.5" />
            {alert.serverName}
          </Link>

          <div className="flex items-center gap-2">
            <span className="tabular-nums">{rel}</span>
            <button
              type="button"
              onClick={onAck}
              className="text-primary hover:underline cursor-pointer text-[10px]"
            >
              标为已读
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
