import { useMemo, useState } from "react";
import { Bell } from "lucide-react";

import { Badge } from "@/shared/ui/badge";
import { EmptyState, FilterPills } from "@/shared/ui/layout";
import type { NotificationEvent } from "@/shared/api/methods";

import { LOG_OPTS, SEVERITY_VARIANT, type LogFilter } from "../lib/notification-meta";

/** The "log" tab: a filterable, reverse-chronological list of delivery events. */
export function DeliveryLog({ events }: { events: NotificationEvent[] }) {
  const [logFilter, setLogFilter] = useState<LogFilter>("all");
  const filtered = useMemo(() => {
    const list = [...events].sort((a, b) => b.deliveredAt - a.deliveredAt);
    if (logFilter === "failed") return list.filter((e) => !e.ok);
    if (logFilter === "critical") return list.filter((e) => e.severity === "critical");
    return list;
  }, [events, logFilter]);

  return (
    <div className="space-y-2">
      <FilterPills options={LOG_OPTS} value={logFilter} onChange={setLogFilter} />
      {!filtered.length ? (
        <EmptyState text="没有匹配的投递记录。" icon={<Bell className="size-8" />} />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-md border border-border">
          {filtered.map((e) => {
            const dotColor = e.ok ? "var(--success)" : "var(--danger)";
            const edgeColor = e.severity === "critical" ? "var(--danger)" : e.severity === "warning" ? "var(--warning)" : "var(--primary)";
            const abs = new Date(e.deliveredAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
            return (
              <li key={e.id} className="group relative flex flex-wrap items-center gap-2 px-3 py-2 pl-4 text-sm transition-colors hover:bg-muted/30">
                <span className="absolute inset-y-0 left-0 w-0.5" style={{ background: edgeColor }} />
                <span className="relative flex size-2">
                  {!e.ok ? <span className="pulse-ring" style={{ background: dotColor }} /> : null}
                  <span className="size-2 rounded-full" style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}` }} />
                </span>
                <Badge variant={SEVERITY_VARIANT[e.severity]}>{e.severity}</Badge>
                <span className="font-medium group-hover:text-primary">{e.channelName}</span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{e.message}</span>
                <span className="text-xs tabular-nums text-muted-foreground">{abs}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
