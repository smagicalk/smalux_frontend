import { useEffect, useState } from "react";

import { cn } from "@/shared/lib/utils";

/**
 * Mission-control heartbeat bar: a live wall clock on the left, the live data
 * stream indicator on the right. The clock ticks via an effect (Date.now in an
 * interval, never in render), so it stays pure.
 */
export function HeartbeatBar({ online, total }: { online: number; total: number }) {
  const ratio = total ? online / total : 0;
  const healthy = ratio > 0.7;
  const dotColor = healthy ? "var(--success)" : "var(--danger)";
  return (
    <div className="glass scanline cornered relative flex items-center gap-4 overflow-hidden border-b border-border px-4 py-1.5 text-xs">
      <span className="scanline__beam" />
      <LiveClock />
      <span className="h-3 w-px bg-border" />
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <span className="relative flex size-2">
          <span className="pulse-ring" style={{ background: dotColor }} />
          <span className="size-2 rounded-full" style={{ background: dotColor, boxShadow: `0 0 8px ${dotColor}` }} />
        </span>
        实时数据流
      </span>
      <span className="ml-auto flex items-center gap-1.5 text-muted-foreground">
        <span>舰队健康度</span>
        <span className={cn("font-semibold tabular-nums", healthy ? "text-success" : "text-danger")}>
          {total ? `${Math.round(ratio * 100)}%` : "-"}
        </span>
      </span>
    </div>
  );
}

/** Wall clock that ticks every second. Date.now lives in the effect, not render. */
function LiveClock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const time = new Date(now).toLocaleTimeString("zh-CN", { hour12: false });
  const date = new Date(now).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit", weekday: "short" });
  return (
    <span className="flex items-center gap-2 tabular-nums">
      <span className="font-mono text-sm font-semibold text-foreground">{time}</span>
      <span className="text-muted-foreground">{date}</span>
    </span>
  );
}
