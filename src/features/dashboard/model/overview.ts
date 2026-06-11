import type { MonitorNode } from "@/shared/domain/node";

export function createOverview(nodes: MonitorNode[]) {
  const online = nodes.filter((node) => node.status === "online").length;
  const warning = nodes.filter((node) => node.status === "warning").length;
  const offline = nodes.filter((node) => node.status === "offline").length;
  const averageCpu = average(nodes.map((node) => node.cpu));
  const averageMemory = average(nodes.map((node) => node.memory));
  const traffic =
    nodes.reduce((total, node) => total + node.networkInMbps + node.networkOutMbps, 0) / 1000;

  return {
    total: nodes.length,
    online,
    warning,
    offline,
    averageCpu,
    averageMemory,
    traffic
  };
}

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}
