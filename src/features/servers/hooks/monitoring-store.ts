import { create } from "zustand";

import type { ServerMetrics } from "@/shared/api/methods";

/**
 * Live metrics indexed by serverId. The monitoring subscription pushes
 * updates here; selectors let components subscribe to a single server's
 * metrics without re-rendering the whole grid on every tick.
 *
 * We keep a short rolling history per server so detail-page charts can plot
 * a tail without a separate fetch.
 *
 * Storage shape (v2): the per-server maps are mutated in place. A single
 * incoming sample no longer rebuilds the entire `latest`/`history` tables —
 * it touches only its own server's entry and bumps `tick`. That keeps a
 * per-server update O(1) instead of O(N) spread, so a tick carrying N node
 * samples is O(N) total rather than O(N²).
 *
 * Versioning for whole-table subscribers (the overview cluster charts read
 * `history`/`latest` across all servers): a stable Map reference would make
 * `useSyncExternalStore`'s `Object.is` see "no change" and freeze the charts.
 * So `tick` increments on every batch; whole-table selectors opt into a
 * throttled read of `tick` (see use-throttled-store) so they recompute ~1×/s
 * instead of once per sample. Per-server selectors (`latest.get(id)`,
 * `history.get(id)`) keep their existing reference-stable behavior — they only
 * change when *that* server updates.
 */
const HISTORY_LIMIT = 120;

interface MonitoringState {
  /** Latest sample per server. Mutated in place; do not read for reactivity without `tick`. */
  latest: Map<string, ServerMetrics>;
  /** Rolling history per server. Mutated in place; do not read for reactivity without `tick`. */
  history: Map<string, ServerMetrics[]>;
  /** Monotonic counter, bumped once per applied batch. Drives whole-table selectors. */
  tick: number;
  upsert: (metrics: ServerMetrics) => void;
  upsertBatch: (samples: ServerMetrics[]) => void;
  reset: () => void;
}

export const useMonitoringStore = create<MonitoringState>((set) => ({
  latest: new Map(),
  history: new Map(),
  tick: 0,
  upsert: (metrics) =>
    set((state) => {
      applySample(state, metrics);
      return { tick: state.tick + 1 };
    }),
  upsertBatch: (samples) =>
    set((state) => {
      for (const m of samples) applySample(state, m);
      // One tick per batch, not one per sample — a 100-node tick lands as a
      // single set rather than 100 cascading ones.
      return { tick: state.tick + 1 };
    }),
  reset: () =>
    set({
      latest: new Map(),
      history: new Map(),
      tick: 0
    })
}));

/** Mutate one server's latest + history entry on the live state maps.
 *
 * `history` is given a fresh array per update for that server (not the whole
 * table), so `useServerHistory(id)` — which memoizes on the array reference —
 * re-renders when *that* server ticks but is untouched by every other server's
 * updates. `latest` swaps in the new sample object the same way. Only the
 * outer `Map` identities are stable; their contents change. Whole-table
 * consumers react to `tick` instead (via the throttled selector). */
function applySample(state: MonitoringState, metrics: ServerMetrics): void {
  state.latest.set(metrics.serverId, metrics);
  const prev = state.history.get(metrics.serverId);
  // Monotonic guard: skip any sample whose ts isn't strictly greater than the
  // last stored one. React StrictMode double-invokes the subscription effect
  // in dev (mount → unmount → mount), so the back-dated seed history gets
  // pushed twice; the second copy's timestamps are older than the first copy's
  // tail, which left the array non-monotonic and made uPlot/ECharts time axes
  // fold back on themselves ("同一个 x 点来回折线"). Dropping non-advancing
  // samples keeps the series strictly ascending without losing live ticks.
  if (prev && prev.length > 0 && metrics.ts <= prev[prev.length - 1].ts) {
    return;
  }
  if (prev) {
    const next = prev.length >= HISTORY_LIMIT ? prev.slice(prev.length - HISTORY_LIMIT + 1) : prev.slice();
    next.push(metrics);
    state.history.set(metrics.serverId, next);
  } else {
    state.history.set(metrics.serverId, [metrics]);
  }
}
