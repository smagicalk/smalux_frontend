export type NodeStatus = "online" | "warning" | "offline";

export type MonitorNode = {
  id: string;
  name: string;
  group: string;
  region: string;
  status: NodeStatus;
  cpu: number;
  memory: number;
  disk: number;
  networkInMbps: number;
  networkOutMbps: number;
  latencyMs: number;
  updatedAt: string;
};
