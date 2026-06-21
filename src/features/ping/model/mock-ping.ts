export type PingProtocol = "HTTP" | "TCP" | "ICMP";
export type PingStatus = "ok" | "degraded" | "down";

export type PingCheck = {
  id: string;
  name: string;
  target: string;
  protocol: PingProtocol;
  status: PingStatus;
  region: string;
  intervalSec: number;
  timeoutMs: number;
  retries: number;
  latencyMs: number;
  lossPercent: number;
  availability: number;
  enabled: boolean;
  alertPolicy: string;
  lastRunAt: string;
};

export const mockPingChecks: PingCheck[] = [
  {
    id: "ping-homepage",
    name: "公开状态页",
    target: "https://status.smalux.local",
    protocol: "HTTP",
    status: "ok",
    region: "Global",
    intervalSec: 30,
    timeoutMs: 2500,
    retries: 2,
    latencyMs: 42,
    lossPercent: 0,
    availability: 99.98,
    enabled: true,
    alertPolicy: "公共页面不可用",
    lastRunAt: "2026-06-09T09:58:00.000Z"
  },
  {
    id: "ping-api",
    name: "后台 API",
    target: "https://api.smalux.local/health",
    protocol: "HTTP",
    status: "degraded",
    region: "Tokyo",
    intervalSec: 15,
    timeoutMs: 1800,
    retries: 3,
    latencyMs: 186,
    lossPercent: 1.6,
    availability: 98.72,
    enabled: true,
    alertPolicy: "核心 API 延迟",
    lastRunAt: "2026-06-09T09:58:10.000Z"
  },
  {
    id: "ping-smtp",
    name: "SMTP 端口",
    target: "mail.smalux.local:587",
    protocol: "TCP",
    status: "ok",
    region: "Frankfurt",
    intervalSec: 60,
    timeoutMs: 2200,
    retries: 2,
    latencyMs: 64,
    lossPercent: 0,
    availability: 99.91,
    enabled: true,
    alertPolicy: "通知通道不可达",
    lastRunAt: "2026-06-09T09:57:30.000Z"
  },
  {
    id: "ping-edge",
    name: "边缘入口",
    target: "edge-sin-01.smalux.local",
    protocol: "ICMP",
    status: "down",
    region: "Singapore",
    intervalSec: 20,
    timeoutMs: 1200,
    retries: 4,
    latencyMs: 0,
    lossPercent: 100,
    availability: 93.4,
    enabled: true,
    alertPolicy: "边缘入口丢包",
    lastRunAt: "2026-06-09T09:58:08.000Z"
  },
  {
    id: "ping-wss",
    name: "Agent WSS 通道",
    target: "wss://api.smalux.local/ws",
    protocol: "HTTP",
    status: "ok",
    region: "Tokyo",
    intervalSec: 15,
    timeoutMs: 1500,
    retries: 2,
    latencyMs: 58,
    lossPercent: 0,
    availability: 99.95,
    enabled: true,
    alertPolicy: "Agent 通道握手失败",
    lastRunAt: "2026-06-09T09:58:12.000Z"
  },
  {
    id: "ping-rpc",
    name: "JSON-RPC 入口",
    target: "https://api.smalux.local/rpc",
    protocol: "HTTP",
    status: "ok",
    region: "Global",
    intervalSec: 20,
    timeoutMs: 1600,
    retries: 2,
    latencyMs: 73,
    lossPercent: 0,
    availability: 99.87,
    enabled: true,
    alertPolicy: "控制面 RPC 不可用",
    lastRunAt: "2026-06-09T09:58:15.000Z"
  },
  {
    id: "ping-db",
    name: "数据库端口",
    target: "fra-db-01.internal:5432",
    protocol: "TCP",
    status: "degraded",
    region: "Frankfurt",
    intervalSec: 30,
    timeoutMs: 1200,
    retries: 2,
    latencyMs: 212,
    lossPercent: 0.8,
    availability: 97.62,
    enabled: true,
    alertPolicy: "数据库连接退化",
    lastRunAt: "2026-06-09T09:58:02.000Z"
  },
  {
    id: "ping-hkg-proxy",
    name: "香港代理入口",
    target: "hkg-proxy-01.smalux.local",
    protocol: "ICMP",
    status: "down",
    region: "Hong Kong",
    intervalSec: 20,
    timeoutMs: 1000,
    retries: 3,
    latencyMs: 0,
    lossPercent: 100,
    availability: 88.2,
    enabled: true,
    alertPolicy: "代理入口不可达",
    lastRunAt: "2026-06-09T09:58:09.000Z"
  },
  {
    id: "ping-private-blocked",
    name: "私网目标校验样例",
    target: "http://127.0.0.1:8080/health",
    protocol: "HTTP",
    status: "down",
    region: "Local",
    intervalSec: 60,
    timeoutMs: 1000,
    retries: 1,
    latencyMs: 0,
    lossPercent: 100,
    availability: 0,
    enabled: false,
    alertPolicy: "私网目标默认拒绝",
    lastRunAt: "2026-06-09T09:30:00.000Z"
  }
];

export function createPingSummary(checks: readonly PingCheck[]) {
  const enabled = checks.filter((check) => check.enabled);
  const degraded = enabled.filter((check) => check.status === "degraded").length;
  const down = enabled.filter((check) => check.status === "down").length;
  const availability =
    enabled.reduce((total, check) => total + check.availability, 0) / Math.max(enabled.length, 1);
  const latency =
    enabled.reduce((total, check) => total + check.latencyMs, 0) / Math.max(enabled.length, 1);

  return {
    total: checks.length,
    enabled: enabled.length,
    degraded,
    down,
    availability,
    latency
  };
}
