import { useMemo } from "react";

import { useThrottledMonitoring } from "@/features/servers/hooks/use-throttled-monitoring";
import type { ServerMetrics } from "@/shared/api/methods";

import { EMPTY_AGGREGATE, type ClusterAggregate } from "../lib/overview-types";

/**
 * Align every server's history onto one shared timestamp axis (the union of
 * all sample ts) and roll it up into cluster-level series: average CPU, the
 * live-reporting node count, and split 上行/下行/总 throughput. Each series
 * shares the same timestamps so a sparkline reads as one shape. Indexing each
 * server by ts gives O(1) lookup per timestamp, mirroring useClusterCpuTrend.
 *
 * Reads whole-table history on a ~1s throttle so a multi-node burst doesn't
 * rebuild the alignment per sample. `version` is a memo dep because the throttle
 * returns a stable Map reference — without it the rollup would freeze.
 */
export function useClusterAggregate(serverIds: string[]): ClusterAggregate {
  const history = useThrottledMonitoring((_latest, h) => h);
  return useMemo(() => {
    const tsSet = new Set<number>();
    for (const id of serverIds) for (const m of history.get(id) ?? []) tsSet.add(m.ts);
    const timestamps = [...tsSet].sort((a, b) => a - b);
    if (!timestamps.length) return { ...EMPTY_AGGREGATE, timestamps };

    const byTs = new Map<string, Map<number, ServerMetrics>>();
    for (const id of serverIds) byTs.set(id, new Map((history.get(id) ?? []).map((p) => [p.ts, p])));

    const cpu: ClusterAggregate["cpu"] = [];
    const flow: ClusterAggregate["flow"] = [];
    const flowRx: ClusterAggregate["flowRx"] = [];
    const flowTx: ClusterAggregate["flowTx"] = [];
    const live: ClusterAggregate["live"] = [];
    for (const ts of timestamps) {
      let cpuSum = 0, cpuN = 0, rxSum = 0, txSum = 0, liveN = 0;
      for (const id of serverIds) {
        const m = byTs.get(id)?.get(ts);
        if (!m) continue;
        liveN++;
        cpuSum += m.cpuUsage; cpuN++;
        rxSum += m.netRxSpeed ?? 0;
        txSum += m.netTxSpeed ?? 0;
      }
      cpu.push({ ts, value: cpuN ? cpuSum / cpuN : 0 });
      flowRx.push({ ts, value: rxSum });
      flowTx.push({ ts, value: txSum });
      flow.push({ ts, value: rxSum + txSum });
      live.push({ ts, value: liveN });
    }
    return { timestamps, cpu, flow, flowRx, flowTx, live };
  }, [history, serverIds]);
}
