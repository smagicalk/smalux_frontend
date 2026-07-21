import { useMemo } from "react";

import { useThrottledMonitoring } from "@/features/servers/hooks/use-throttled-monitoring";

/**
 * Align every server's CPU history onto a shared timestamp axis for the
 * cluster trend chart. We take the union of all timestamps across servers
 * and forward-fill missing values with null so echarts draws gaps.
 *
 * Returns nothing useful until at least one tick has landed per server;
 * callers render a placeholder while empty.
 *
 * Reads the whole-table history on a ~1s throttle (see useThrottledMonitoring)
 * so a 100-node burst doesn't rebuild this alignment 100×/s. The throttle
 * returns the same Map reference across refreshes (the store mutates it in
 * place), so the memo additionally depends on the throttled `version`.
 */
export function useClusterCpuTrend(serverIds: string[]) {
  const history = useThrottledMonitoring((_latest, h) => h);

  return useMemo(() => {
    if (serverIds.length === 0) {
      return { timestamps: [] as number[], series: [] as { id: string; name: string; values: (number | null)[] }[] };
    }

    // Union of timestamps, sorted.
    const tsSet = new Set<number>();
    for (const id of serverIds) {
      for (const m of history.get(id) ?? []) tsSet.add(m.ts);
    }
    const timestamps = [...tsSet].sort((a, b) => a - b);
    if (timestamps.length === 0) {
      return { timestamps, series: [] };
    }

    const series = serverIds.map((id) => {
      const points = history.get(id) ?? [];
      // index by ts for O(1) lookup
      const byTs = new Map(points.map((p) => [p.ts, p.cpuUsage]));
      return {
        id,
        name: id,
        values: timestamps.map((t) => (byTs.has(t) ? byTs.get(t)! : null))
      };
    });

    return { timestamps, series };
  }, [history, serverIds]);
}
