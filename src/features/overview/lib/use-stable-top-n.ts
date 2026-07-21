import { useEffect, useRef, useState } from "react";

/**
 * Pick a stable top-K subset of servers by some rolling metric, with
 * hysteresis so the set doesn't flicker every tick.
 *
 * The cluster trend charts used to draw one line per node; with many nodes
 * that's an unreadable soup of lines, and a naive "current top-K" re-ranks on
 * every sample so lines flicker in/out (legend reorders, ECharts animates
 * enter/exit). This hook fixes both:
 *
 *   - Rank by a *windowed* aggregate (e.g. peak over the last 60s), not the
 *     instantaneous value, so a momentary spike can't bounce a node in/out.
 *   - Hysteresis: a node already in the set only drops out once it falls past
 *     `exitRank` (K + slack); a node outside only enters once it rises into
 *     `enterRank` (K - slack). Nodes hovering at the boundary don't churn.
 *   - Recompute on a coarse cadence (`recomputeMs`), not per sample.
 *
 * `scoreOf` receives a server's rolling history and returns the scalar to rank
 * by (higher = more prominent). Callers pick the metric: peak tx for the
 * throughput chart, peak CPU for the CPU chart.
 *
 * Returns the selected server ids, padded/truncated to `k` when possible.
 * Stability is best-effort: if the fleet shrinks below k we return what's
 * available; if every node scores 0 we still return the first k by id so the
 * chart isn't empty on a cold start.
 */
export function useStableTopN(
  serverIds: string[],
  scoreOf: (id: string) => number,
  opts: { k?: number; slack?: number; recomputeMs?: number } = {}
): string[] {
  const k = opts.k ?? 6;
  const slack = opts.slack ?? 2;
  const recomputeMs = opts.recomputeMs ?? 4000;

  // Hold the live selected set in a ref so recompute mutates it in place with
  // hysteresis; mirror into state only when it actually changes so consumers
  // re-render. Seeded empty — populated on the first recompute tick.
  const selectedRef = useRef<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const scoreRef = useRef(scoreOf);
  const idsKey = serverIds.join(",");

  useEffect(() => {
    scoreRef.current = scoreOf;
  }, [scoreOf]);

  useEffect(() => {
    const recompute = () => {
      const prev = selectedRef.current;
      const ids = serverIds;
      // Score everything, descending. Tie-break by id for determinism.
      const ranked = ids
        .map((id) => ({ id, score: scoreRef.current(id) }))
        .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

      if (ranked.length <= k) {
        const next = ranked.map((r) => r.id);
        if (next.join(",") !== prev.join(",")) {
          selectedRef.current = next;
          setSelected(next);
        }
        return;
      }

      // Rank lookup: position 0 = highest score.
      const rankById = new Map<string, number>();
      ranked.forEach((r, i) => rankById.set(r.id, i));

      const enterRank = k - slack; // outside nodes must rise into the top (k-slack)
      const exitRank = k + slack;  // inside nodes only drop out past (k+slack)

      const next = new Set<string>();
      // Keep existing members still inside the exit band.
      for (const id of prev) {
        const rank = rankById.get(id);
        if (rank === undefined) continue; // server vanished from the fleet
        if (rank < exitRank) next.add(id);
      }
      // Admit outside nodes risen into the enter band, highest score first,
      // until the set is full.
      for (const r of ranked) {
        if (next.size >= k) break;
        if (next.has(r.id)) continue;
        const rank = rankById.get(r.id)!;
        if (rank < enterRank) next.add(r.id);
      }
      // Hysteresis can leave us under-filled (several dropped at once): top up
      // from the highest-ranked remaining nodes.
      for (const r of ranked) {
        if (next.size >= k) break;
        next.add(r.id);
      }

      // Preserve previous display order where possible so the legend/lines
      // don't reshuffle every recompute — only new entries append.
      const ordered = [
        ...prev.filter((id) => next.has(id)),
        ...ranked.map((r) => r.id).filter((id) => next.has(id) && !prev.includes(id))
      ];
      const key = ordered.join(",");
      if (key !== prev.join(",")) {
        selectedRef.current = ordered;
        setSelected(ordered);
      }
    };

    // Reset the selection when the fleet identity changes (servers added/
    // removed), then recompute fresh.
    selectedRef.current = [];
    recompute();
    const id = window.setInterval(recompute, recomputeMs);
    return () => window.clearInterval(id);
    // idsKey covers serverIds identity; scoreOf is read via ref so a new
    // closure each render doesn't restart the interval.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, k, slack, recomputeMs]);

  return selected;
}
