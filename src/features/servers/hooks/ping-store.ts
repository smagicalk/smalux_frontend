import { create } from "zustand";

import type { PingSample } from "@/shared/api/methods";

/**
 * Rolling ping-latency history per server, fed by the `agent.ping.subscribe`
 * stream. Mirrors the monitoring store's shape (a mutated-in-place outer Map +
 * fresh per-server arrays) so `useServerPing(id)` re-renders only when *that*
 * server's latency updates — not on every other server's probe.
 *
 * Like the metrics store, the outer Map keeps a stable identity; per-server
 * consumers react because each update swaps in a fresh array for that id. The
 * detail page is the sole consumer today, so there's no whole-table `tick`
 * counter (unlike the cluster-wide monitoring aggregates).
 */
const HISTORY_LIMIT = 120;

interface PingState {
  history: Map<string, PingSample[]>;
  upsertBatch: (samples: PingSample[]) => void;
  reset: () => void;
}

export const usePingStore = create<PingState>((set) => ({
  history: new Map(),
  upsertBatch: (samples) =>
    set((state) => {
      for (const s of samples) {
        const prev = state.history.get(s.serverId);
        // Monotonic guard: skip non-advancing samples. React StrictMode
        // double-invokes the subscription effect in dev, pushing the back-dated
        // seed history twice; the second copy's older timestamps left the array
        // non-monotonic and folded the chart's time axis back on itself.
        if (prev && prev.length > 0 && s.ts <= prev[prev.length - 1].ts) {
          continue;
        }
        // Keep a rolling tail; drop the oldest once we exceed the limit so the
        // ping chart shows a sliding window, not an ever-growing line.
        const next = prev && prev.length >= HISTORY_LIMIT ? prev.slice(prev.length - HISTORY_LIMIT + 1) : prev ? prev.slice() : [];
        next.push(s);
        state.history.set(s.serverId, next);
      }
      return {};
    }),
  reset: () => set({ history: new Map() })
}));

// Stable empty array so selectors return the same reference when a server has
// no ping history yet — otherwise `?? []` builds a fresh array each render.
const EMPTY: never[] = [];

/** Selector hook: rolling ping history for one server (for the detail chart). */
export function useServerPingHistory(serverId: string): PingSample[] {
  return usePingStore((s) => s.history.get(serverId) ?? EMPTY);
}
