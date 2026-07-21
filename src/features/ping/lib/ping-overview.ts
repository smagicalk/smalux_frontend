import type { PingTarget } from "@/shared/api/methods";

import type { GroupFilter, SortKey } from "./ping-meta";

export interface PingOverviewStats {
  total: number;
  ok: number;
  down: number;
  avgLatency: number;
  worstLatency: number;
  avgUptime: number;
}

/** Builds the visible target list and fleet-level probe statistics. */
export function buildPingOverview(
  targets: PingTarget[],
  group: GroupFilter,
  sort: SortKey
): { visibleTargets: PingTarget[]; stats: PingOverviewStats } {
  const visibleTargets = targets.filter((target) => (
    group === "all" ? true : target.group === group
  ));

  if (sort === "name") {
    visibleTargets.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === "latency") {
    visibleTargets.sort(
      (a, b) => (b.latencyMs ?? -1) - (a.latencyMs ?? -1) || a.name.localeCompare(b.name)
    );
  } else {
    // Unhealthy targets come first, followed by the worst observed latency.
    visibleTargets.sort((a, b) => {
      const rankA = a.lastOk === false ? 0 : a.lastOk ? 1 : 2;
      const rankB = b.lastOk === false ? 0 : b.lastOk ? 1 : 2;
      if (rankA !== rankB) return rankA - rankB;
      return (b.latencyMs ?? 0) - (a.latencyMs ?? 0);
    });
  }

  const ok = targets.filter((target) => target.lastOk).length;
  const down = targets.filter((target) => target.lastOk === false).length;
  const latencies = targets
    .map((target) => target.latencyMs ?? 0)
    .filter((value) => value > 0);
  const avgLatency = latencies.length
    ? Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length)
    : 0;
  const worstLatency = latencies.length ? Math.max(...latencies) : 0;
  const avgUptime = targets.length
    ? targets.reduce((sum, target) => sum + (target.uptime ?? 0), 0) / targets.length
    : 0;

  return {
    visibleTargets,
    stats: { total: targets.length, ok, down, avgLatency, worstLatency, avgUptime }
  };
}
