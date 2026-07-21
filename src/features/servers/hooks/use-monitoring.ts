import { useEffect } from "react";

import { methods } from "@/shared/api/methods";
import type { ServerMetrics } from "@/shared/api/methods";
import { useRpc } from "@/app/providers/rpc-context";
import { useMonitoringStore } from "./monitoring-store";

/**
 * Subscribe to the live metrics stream for the given server ids (or all
 * servers if omitted). Pushed samples land in the monitoring store; this
 * hook only owns the subscription lifecycle. Components read metrics via
 * `useServerMetrics` / `useMonitoringStore` selectors so a 1s tick doesn't
 * re-render the entire page.
 *
 * Batching: a single transport tick carries one sample per subscribed server
 * (N samples in one synchronous burst). We accumulate the whole burst and
 * flush it with one `upsertBatch` call — so a 100-node tick is one store
 * write, not 100. The initial back-dated history is likewise collapsed into
 * a single batch via the microtask drain.
 */
export function useMonitoring(serverIds?: string[]) {
  const { client } = useRpc();
  const upsertBatch = useMonitoringStore((s) => s.upsertBatch);

  useEffect(() => {
    let pending: ServerMetrics[] = [];
    let flushScheduled = false;

    const flush = () => {
      flushScheduled = false;
      if (pending.length) {
        upsertBatch(pending);
        pending = [];
      }
    };

    const scheduleFlush = () => {
      if (flushScheduled) return;
      // The transport delivers a synchronous burst (initialBatch then each
      // tick's sampleBatch). Microtask-defer so a whole burst collapses into
      // one store write rather than one per sample.
      flushScheduled = true;
      queueMicrotask(flush);
    };

    const unsubscribe = client.subscribe(
      "agent.summary.subscribe",
      { serverIds },
      methods["agent.summary.subscribe"].result,
      (sample) => {
        if (sample) {
          pending.push(sample);
          scheduleFlush();
        }
      }
    );

    return () => {
      unsubscribe();
      flush();
    };
    // serverIds identity: callers should pass a stable reference; we join
    // for the dep so a new array with the same contents doesn't resubscribe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, upsertBatch, serverIds?.join(",")]);
}

// Stable empty array so selectors return the same reference when a server
// has no history yet — otherwise `?? []` builds a fresh array each render
// and zustand's Object.is check triggers an infinite update loop.
const EMPTY_HISTORY: never[] = [];

/** Selector hook: latest metrics for one server, stable per id. */
export function useServerMetrics(serverId: string) {
  return useMonitoringStore((s) => s.latest.get(serverId));
}

/** Selector hook: rolling history for one server (for detail charts). */
export function useServerHistory(serverId: string) {
  return useMonitoringStore((s) => s.history.get(serverId) ?? EMPTY_HISTORY);
}
