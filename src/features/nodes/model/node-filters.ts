import type { MonitorNode, NodeStatus } from "@/shared/domain/node";

export type NodeFilters = {
  query: string;
  statusFilter: NodeStatus | "all";
  groupFilter: string;
};

export function createNodeFilterOptions(nodes: readonly MonitorNode[]) {
  return Array.from(new Set(nodes.map((node) => node.group)));
}

export function filterNodes(nodes: readonly MonitorNode[], filters: NodeFilters) {
  const normalizedQuery = filters.query.trim().toLowerCase();

  return nodes.filter((node) => {
    const matchesQuery =
      !normalizedQuery || [node.name, node.group, node.region].join(" ").toLowerCase().includes(normalizedQuery);
    const matchesStatus = filters.statusFilter === "all" || node.status === filters.statusFilter;
    const matchesGroup = filters.groupFilter === "all" || node.group === filters.groupFilter;

    return matchesQuery && matchesStatus && matchesGroup;
  });
}
