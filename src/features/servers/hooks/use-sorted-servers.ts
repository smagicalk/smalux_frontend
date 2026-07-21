import { useMemo } from "react";

import type { Server } from "@/shared/api/methods";

import type { SortKey } from "../lib/server-meta";
import { useMonitoringStore } from "./monitoring-store";

/**
 * Sorts a server list by static metadata or live metrics. Metric sorts subscribe
 * to the store tick; name and region sorts avoid that high-frequency update.
 */
export function useSortedServers(servers: Server[], sort: SortKey): Server[] {
  const metricSort = sort === "cpu" || sort === "mem" || sort === "disk";
  const tick = useMonitoringStore((state) => (metricSort ? state.tick : 0));

  return useMemo(() => {
    const list = [...servers];
    if (sort === "name") return list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "region") {
      return list.sort(
        (a, b) => a.region.localeCompare(b.region) || a.name.localeCompare(b.name)
      );
    }

    const latest = useMonitoringStore.getState().latest;
    const metric = (server: Server) => {
      const value = latest.get(server.id);
      if (!value) return -1;
      if (sort === "cpu") return value.cpuUsage;
      if (sort === "mem") return value.memTotal ? value.memUsed / value.memTotal : -1;
      return value.diskTotal ? value.diskUsed / value.diskTotal : -1;
    };
    return list.sort(
      (a, b) => metric(b) - metric(a) || a.name.localeCompare(b.name)
    );
    // `tick` intentionally invalidates live metric sorts while the underlying
    // Map keeps a stable identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servers, sort, tick]);
}
