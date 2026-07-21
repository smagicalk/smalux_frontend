import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { methods } from "@/shared/api/methods";
import type { PingHistoryRange, PingSample } from "@/shared/api/methods";
import { queryKeys } from "@/shared/api/query-keys";
import { useRpc } from "@/app/providers/rpc-context";
import { usePingStore, useServerPingHistory } from "./ping-store";

/**
 * Subscribe to the ping-latency stream for the given server ids and route
 * samples into the ping store. Owns only the subscription lifecycle — the
 * detail page reads the rolling history via `useServerPingHistory`.
 *
 * Batches a synchronous burst (the back-dated initial history, then each tick's
 * per-server probes) into one store write via a microtask drain, mirroring
 * useMonitoring.
 */
export function useServerPing(serverIds?: string[]) {
  const { client } = useRpc();
  const upsertBatch = usePingStore((s) => s.upsertBatch);

  useEffect(() => {
    let pending: PingSample[] = [];
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
      flushScheduled = true;
      queueMicrotask(flush);
    };

    const unsubscribe = client.subscribe(
      "agent.ping.subscribe",
      { serverIds },
      methods["agent.ping.subscribe"].result,
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
    // serverIds identity: callers should pass a stable reference; we join for
    // the dep so a new array with the same contents doesn't resubscribe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, upsertBatch, serverIds?.join(",")]);
}

/**
 * Ping samples for a server over a chosen time range.
 *
 * - `"live"`: the rolling subscribe-stream tail (a few minutes, 2s cadence) —
 *   read straight from the ping store, no fetch. This is the default and the
 *   only range that updates in real time.
 * - `"1h" | "6h" | "24h" | "7d"`: a one-shot `agent.ping.history` query
 *   returning a pre-downsampled series (~150 points). Re-fetched when the range
 *   changes; stale while revalidating so switching ranges feels instant.
 *
 * Returns `{ samples, intervalMs, isLoading }`. `intervalMs` is the bucket size
 * for historical ranges (undefined for live) so the chart can label density.
 */
export function usePingSamples(
  serverId: string,
  range: "live" | PingHistoryRange
): { samples: PingSample[]; intervalMs: number | undefined; isLoading: boolean } {
  const { client } = useRpc();
  const live = useServerPingHistory(serverId);

  const query = useQuery({
    queryKey: queryKeys.pingHistory(serverId, range),
    queryFn: () => client.call("agent.ping.history", { serverId, range: range as PingHistoryRange }, methods["agent.ping.history"].result),
    // Only historical ranges fetch; "live" reads the store and skips the query.
    enabled: range !== "live",
    staleTime: 60_000
  });

  if (range === "live") {
    return { samples: live, intervalMs: undefined, isLoading: false };
  }
  return {
    samples: query.data?.samples ?? [],
    intervalMs: query.data?.intervalMs,
    isLoading: query.isLoading
  };
}
