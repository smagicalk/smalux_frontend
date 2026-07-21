import { useEffect, useRef, useState } from "react";

import type { ServerMetrics } from "@/shared/api/methods";
import { useMonitoringStore } from "./monitoring-store";

type LatestMap = Map<string, ServerMetrics>;
type HistoryMap = Map<string, ServerMetrics[]>;

/**
 * Read a derived slice of the monitoring store, throttled to ~`intervalMs`.
 *
 * Why this exists: the store mutates its per-server maps in place and bumps a
 * monotonic `tick` per batch. A plain `useMonitoringStore((s) => s.history)`
 * selector would *freeze* — the Map identity never changes, so
 * `useSyncExternalStore`'s `Object.is` sees no change and the chart never
 * updates (the "等待实时数据…" stays forever). Whole-table consumers — the
 * overview cluster charts aggregating every server's history — don't need
 * per-batch freshness; ~1s is plenty for a human-readable trend, and re-running
 * on every batch would re-set a dozen charts dozens of times per second.
 *
 * Mechanism: subscribe to `tick` (which *does* change every batch, so we never
 * freeze), but coalesce bursts with a leading+trailing throttle:
 *   - leading edge: the first `tick` after a quiet period fires immediately, so
 *     the charts populate the moment data lands (no cold-start blank window);
 *   - trailing edge: any further ticks within `intervalMs` collapse into one
 *     refresh at the end of the window, so a sustained stream ≈ 1 refresh/s.
 *
 * Each refresh reads immutable Map/array snapshots. Consumers can therefore
 * use normal React dependencies without knowing that the store mutates its
 * internal Maps in place.
 */
export function useThrottledMonitoring<T>(
  select: (latest: LatestMap, history: HistoryMap) => T,
  intervalMs = 1000
): T {
  const tick = useMonitoringStore((s) => s.tick);
  const selectRef = useRef(select);

  useEffect(() => {
    selectRef.current = select;
  }, [select]);

  const [snapshot, setSnapshot] = useState<T>(() => readSnapshot(select));

  const lastRefreshAt = useRef(0);
  const lastRefreshTick = useRef(0);
  const lastSeenTick = useRef(0);
  const trailingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = (atTick: number) => {
    lastRefreshTick.current = atTick;
    lastSeenTick.current = atTick;
    lastRefreshAt.current = Date.now();
    setSnapshot(readSnapshot(selectRef.current));
  };

  useEffect(() => {
    if (tick === lastRefreshTick.current) return;
    lastSeenTick.current = tick;

    const since = Date.now() - lastRefreshAt.current;
    if (since >= intervalMs) {
      // Leading edge: refresh now.
      refresh(tick);
    } else if (trailingTimer.current === null) {
      // Trailing edge: one refresh at the end of the window, reading the
      // newest tick seen by then (lastSeenTick.current).
      trailingTimer.current = setTimeout(() => {
        trailingTimer.current = null;
        refresh(lastSeenTick.current);
      }, intervalMs - since);
    }
    // If a trailing timer is already armed, do nothing — it'll read the
    // newest tick when it fires (lastSeenTick is updated above).
  }, [tick, intervalMs]);

  useEffect(() => () => {
    if (trailingTimer.current) clearTimeout(trailingTimer.current);
  }, []);

  return snapshot;
}

function readSnapshot<T>(select: (latest: LatestMap, history: HistoryMap) => T): T {
  const { latest, history } = useMonitoringStore.getState();
  const latestSnapshot = new Map(latest);
  const historySnapshot = new Map(
    [...history].map(([serverId, samples]) => [serverId, [...samples]])
  );
  return select(latestSnapshot, historySnapshot);
}
