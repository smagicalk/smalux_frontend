export type ServerStatus = "online" | "warning" | "offline";
export type ProbeProtocol = "HTTP" | "HTTPS" | "TCP" | "ICMP" | "WSS";
export type ProbeStatus = "up" | "degraded" | "down";

export interface HostServer {
  id: string;
  name: string;
  ip: string;
  ipv4?: string;
  ipv6?: string;
  region: string;
  group: string;
  os: string;
  arch: string;
  agentVersion: string;
  status: ServerStatus;
  cpu: number;
  cpuCores?: number;
  memory: number;
  memTotalGb?: number;
  memUsedGb?: number;
  disk: number;
  diskTotalGb?: number;
  diskUsedGb?: number;
  uptime: string;
  load: string;
  networkIn: string;
  networkOut: string;
  trafficUsedGb?: number;
  trafficTotalGb?: number;
  tcpConns?: number;
  note?: string;
  price?: number | null;
  currency?: string;
  expiresAt?: number | null;
  billingCycle?: string | null;
  allowRemoteExec?: boolean;
  enableProcessCollection?: boolean;
  lastSeenAt: number;
}

export type SlaTimeRange = "24h" | "7d" | "30d" | "90d" | "1y";

export interface PingTarget {
  id: string;
  name: string;
  protocol: ProbeProtocol;
  target: string;
  group: "public" | "control" | "private" | "notify";
  status: ProbeStatus;
  latencyMs: number;
  uptime24h: number;
  uptimeSla?: Record<SlaTimeRange, number>;
  sslDaysLeft?: number;
  lastCheckAt: number;
  enabled: boolean;
}

export interface ProbeSample {
  target: string;
  latencyMs: number | null;
  packetLoss: number;
  time: string;
}

export interface AgentInstallCommand {
  token: string;
  endpoint: string;
  curlCommand: string;
  wgetCommand: string;
  dockerCommand: string;
  powershellCommand?: string;
  ttlSeconds: number;
}

export interface CreatePingTargetParams {
  name: string;
  protocol: ProbeProtocol;
  address: string;
  group: "public" | "control" | "private" | "notify";
}

export interface MetricSeries<T = number> {
  enabled: boolean;
  data: (T | null)[];
  unit?: string;
}

export interface ServerProcessItem {
  pid: number;
  ppid?: number;
  name: string;
  command?: string;
  user: string;
  cpu: number;
  mem: number;
  resKb?: number | string;
  resMb?: number | string;
  threads?: number;
  status?: "R" | "S" | "D" | "Z" | "T";
  ioReadMb?: number;
  ioWriteMb?: number;
  children?: ServerProcessItem[];
}

export interface ServerTelemetryResponse {
  times: string[];
  cpu: MetricSeries<number>;
  memory: MetricSeries<number>;
  netIn: MetricSeries<number>;
  netOut: MetricSeries<number>;
  ioRead: MetricSeries<number>;
  ioWrite: MetricSeries<number>;
}
