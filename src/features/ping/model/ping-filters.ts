import type { PingCheck, PingProtocol, PingStatus } from "@/features/ping/model/mock-ping";

export type PingFilters = {
  query: string;
  statusFilter: PingStatus | "all";
  protocolFilter: PingProtocol | "all";
};

export function filterPingChecks(checks: readonly PingCheck[], filters: PingFilters) {
  const normalizedQuery = filters.query.trim().toLowerCase();

  return checks.filter((check) => {
    const matchesQuery =
      !normalizedQuery ||
      [check.name, check.target, check.region, check.alertPolicy].join(" ").toLowerCase().includes(normalizedQuery);
    const matchesStatus = filters.statusFilter === "all" || check.status === filters.statusFilter;
    const matchesProtocol = filters.protocolFilter === "all" || check.protocol === filters.protocolFilter;

    return matchesQuery && matchesStatus && matchesProtocol;
  });
}
