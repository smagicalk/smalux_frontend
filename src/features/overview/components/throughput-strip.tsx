import { Waves } from "lucide-react";

import { useThrottledMonitoring } from "@/features/servers/hooks/use-throttled-monitoring";
import { formatRate } from "@/shared/lib/utils";

/**
 * One-line cluster throughput readout: aggregate 上行/下行 across all nodes,
 * pulled from the monitoring store on a ~1s throttle (whole-table read). A
 * glanceable companion to the per-node throughput chart.
 */
export function ThroughputStrip({ serverIds }: { serverIds: string[] }) {
  const { rx, tx } = useThrottledMonitoring((latest) => {
    let rx = 0, tx = 0;
    for (const id of serverIds) {
      const m = latest.get(id);
      if (m) { rx += m.netRxSpeed ?? 0; tx += m.netTxSpeed ?? 0; }
    }
    return { rx, tx };
  });
  return (
    <div className="glass group relative flex flex-wrap items-center gap-4 overflow-hidden rounded-md border border-border px-3 py-2 text-sm transition-all hover:border-primary/40 hover:shadow-[0_4px_16px_-8px_rgba(0,0,0,0.4)]">
      <span className="absolute inset-x-0 top-0 h-px opacity-60 transition-opacity group-hover:opacity-100" style={{ background: "linear-gradient(90deg, transparent, var(--primary), transparent)" }} />
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <Waves className="size-3.5" />
        集群实时流量
      </span>
      <span className="flex items-center gap-1 tabular-nums">
        <span className="text-success">↑</span> {formatRate(tx)}
      </span>
      <span className="flex items-center gap-1 tabular-nums">
        <span className="text-primary">↓</span> {formatRate(rx)}
      </span>
      <span className="ml-auto text-[11px] text-muted-foreground">聚合所有节点</span>
    </div>
  );
}
