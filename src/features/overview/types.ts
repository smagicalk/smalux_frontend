export type NodeStatus = "online" | "warning" | "offline";

export interface NodePulse {
  id: string;
  name: string;
  group: string;
  region: string;
  ip: string;
  status: NodeStatus;
  cpu: number;
  memory: number;
  disk: number;
  latency: number;
  uptime: string;
}

export type TimeRange = "live" | "15m" | "1h" | "6h" | "24h" | "7d" | "30d" | "90d" | "1y";
export type MetricType = "compute" | "traffic" | "disk";

export interface TelemetryPoint {
  time: string;
  timestamp: number;
  cpu: number;
  memory: number;
  ingress: number;
  egress: number;
  diskWrite: number;
  diskRead: number;
}

export interface TelemetrySummary {
  avg: number;
  peak: number;
  p95: number;
  val2Avg: number;
  val2Peak: number;
}

export interface IncidentItem {
  id: string;
  severity: "critical" | "warning" | "info";
  ruleName: string;
  serverName: string;
  serverId?: string;
  currentValue: string;
  threshold: string;
  duration: string;
  acknowledged?: boolean;
  silenced?: boolean;
}

export interface LiveEventItem {
  id: string;
  tag: "AGENT" | "CRON" | "PING" | "AUTH" | "TASK";
  text: string;
  time: string;
  color: string;
}
