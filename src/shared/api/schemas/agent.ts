import { z } from "zod";

import {
  billingCycleSchema,
  serverMetricsSchema,
  serverSchema,
  serverStatusSchema
} from "./common";

// agent.* — server list, live metric stream subscription, registration.

export const agentListParamsSchema = z
  .object({
    region: z.string().optional(),
    status: serverStatusSchema.optional(),
    search: z.string().optional(),
    group: z.string().optional(),
    page: z.number().optional(),
    limit: z.number().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional()
  })
  .default({});

export const agentListResultSchema = z.object({
  servers: z.array(serverSchema),
  total: z.number(),
  page: z.number().optional(),
  limit: z.number().optional(),
  totalPages: z.number().optional(),
  availableGroups: z.array(z.object({ group: z.string(), count: z.number() })).optional()
});

export type AgentListParams = z.infer<typeof agentListParamsSchema>;
export type AgentListResult = z.infer<typeof agentListResultSchema>;

export const agentSummarySubscribeParamsSchema = z
  .object({ serverIds: z.array(z.string()).optional() })
  .default({});

export const agentSummarySampleSchema = serverMetricsSchema;

// agent.ping.subscribe — a separate stream from the resource metrics: each
// agent pings a set of probe targets (gateway / DNS / public ingress / neighbor
// nodes — whatever the operator configured for that box) and pushes one sample
// per tick carrying every target's round-trip latency. A target's `latencyMs`
// is null when that probe timed out, so the chart draws a gap in just that
// line rather than a misleading 0. The number of targets is arbitrary (0..n)
// and differs per server — a box with no probes configured simply emits a
// sample with an empty `probes` array, and the detail page shows "未配置探测点".
export const agentPingSubscribeParamsSchema = z
  .object({ serverIds: z.array(z.string()).optional() })
  .default({});

export const pingProbeSchema = z.object({
  target: z.string(),
  latencyMs: z.number().nullable()
});
export type PingProbe = z.infer<typeof pingProbeSchema>;

export const pingSampleSchema = z.object({
  serverId: z.string(),
  ts: z.number(),
  probes: z.array(pingProbeSchema)
});
export type PingSample = z.infer<typeof pingSampleSchema>;

// agent.ping.history — the historical counterpart to the live stream. The
// subscribe stream only keeps a short rolling tail (a few minutes); longer
// windows (1h..7d) are far too many raw 2s samples to ship or draw, so the
// backend returns a pre-downsampled series (~150 points) for the requested
// range. `intervalMs` tells the caller the bucket size used, so the chart can
// label density ("每点 ≈ 10 分钟"). The live ("实时") range is NOT served here —
// it reads the subscribe stream directly; only the fixed historical ranges are.
export const pingHistoryRangeSchema = z.enum(["1h", "6h", "24h", "7d"]);
export type PingHistoryRange = z.infer<typeof pingHistoryRangeSchema>;

export const pingHistoryParamsSchema = z.object({
  serverId: z.string(),
  range: pingHistoryRangeSchema
});

export const pingHistoryResultSchema = z.object({
  serverId: z.string(),
  range: pingHistoryRangeSchema,
  /** Bucket size the backend downsampled to (ms). */
  intervalMs: z.number(),
  samples: z.array(pingSampleSchema)
});
export type PingHistoryResult = z.infer<typeof pingHistoryResultSchema>;


export const agentRegisterParamsSchema = z.object({
  name: z.string().trim().min(1),
  // Discovery metadata is optional at registration time. The Agent reports
  // region/IP/platform facts after it connects, so the operator should not be
  // forced to guess values that may immediately become stale.
  region: z.string().trim().min(1).optional(),
  note: z.string().optional(),
  publicVisible: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  ipv4: z.string().optional(),
  os: z.string().optional(),
  arch: z.string().optional()
});
export type AgentRegisterParams = z.infer<typeof agentRegisterParamsSchema>;

export const agentUpdateParamsSchema = z.object({
  serverId: z.string(),
  price: z.number().nonnegative().nullable(),
  currency: z.string().trim().min(1),
  expiresAt: z.number().nullable(),
  billingCycle: billingCycleSchema.nullable()
});
export type AgentUpdateParams = z.infer<typeof agentUpdateParamsSchema>;

// agent.hardware — Dedicated RPC contract for Hardware Specifications & Kernel Runtime Environment
export const agentHardwareParamsSchema = z.object({
  serverId: z.string()
});
export type AgentHardwareParams = z.infer<typeof agentHardwareParamsSchema>;

export const agentHardwareResultSchema = z.object({
  serverId: z.string(),
  // 1. CPU Compute
  cpuModel: z.string(),
  cpuCores: z.number(),
  cpuArch: z.string(),
  cpuFeatures: z.array(z.string()).default([]),
  
  // 2. Physical Memory
  memTotalGb: z.number(),
  memType: z.string(),
  memSpeed: z.string().optional(),
  
  // 3. Disk Storage
  diskTotalGb: z.number(),
  diskType: z.string(),
  diskInterface: z.string().optional(),
  
  // 4. Linux Kernel
  os: z.string(),
  kernelVersion: z.string(),
  kernelFeatures: z.array(z.string()).default([]),
  
  // 5. System Runtime
  virtSystem: z.string(),
  uptime: z.string(),
  load: z.string(),
  agentVersion: z.string(),
  lastCheckedAt: z.number().optional()
});
export type AgentHardwareResult = z.infer<typeof agentHardwareResultSchema>;

// agent.sampleProcesses — On-demand single sampling of running processes
export const agentSampleProcessesParamsSchema = z.object({
  serverId: z.string()
});
export type AgentSampleProcessesParams = z.infer<typeof agentSampleProcessesParamsSchema>;

export const agentSampleProcessesResultSchema = z.object({
  ok: z.boolean(),
  timestamp: z.string().optional(),
  error: z.string().optional(),
  mode: z.enum(["enabled", "disable_auto", "forbidden"]).optional()
});
export type AgentSampleProcessesResult = z.infer<typeof agentSampleProcessesResultSchema>;

// ---------------------------------------------------------------------------
// agent.getStatus — Agent daemon heartbeat, connection quality & process info
// ---------------------------------------------------------------------------
export const agentStatusParamsSchema = z.object({ serverId: z.string() });
export type AgentStatusParams = z.infer<typeof agentStatusParamsSchema>;

export const agentStatusResultSchema = z.object({
  status: z.enum(["online", "warning", "offline"]),
  statusText: z.string(),
  badgeText: z.string(),
  subtitle: z.string(),
  protocol: z.string(),
  protocolDetail: z.string(),
  latencyMs: z.number(),
  jitterMs: z.number(),
  lossRate: z.string(),
  quality: z.string(),
  interval: z.string(),
  lastPing: z.string(),
  cpuUsage: z.string(),
  memRss: z.string(),
  version: z.string(),
  isLatest: z.boolean(),
  allowRemoteExec: z.boolean(),
  pid: z.number()
});
export type AgentStatusResult = z.infer<typeof agentStatusResultSchema>;

// ---------------------------------------------------------------------------
// agent.getNetworkDetails — IP addressing, NIC hardware, BGP peering
// ---------------------------------------------------------------------------
export const agentNetworkDetailsParamsSchema = z.object({ serverId: z.string() });
export type AgentNetworkDetailsParams = z.infer<typeof agentNetworkDetailsParamsSchema>;

export const agentNetworkDetailsResultSchema = z.object({
  hasIpv4: z.boolean(),
  hasIpv6: z.boolean(),
  isDualStack: z.boolean(),
  ipv4: z.string(),
  ipv4Gateway: z.string(),
  ipv4Mask: z.string(),
  ipv4Asn: z.string(),
  ipv4Isp: z.string(),
  ipv4Mtu: z.number(),
  ipv6: z.string(),
  ipv6Gateway: z.string(),
  ipv6Prefix: z.string(),
  ipv6Scope: z.string(),
  ipv6Allocation: z.string(),
  nicName: z.string(),
  nicModel: z.string(),
  nicSpeed: z.string(),
  nicMac: z.string(),
  nicDuplex: z.string(),
  nicRxBytes: z.string(),
  nicTxBytes: z.string(),
  nicRxPackets: z.number(),
  nicTxPackets: z.number(),
  dnsServers: z.array(z.string()),
  tcpEstablished: z.number(),
  tcpTimeWait: z.number(),
  tcpSynRecv: z.number(),
  bgpPeers: z.number(),
  bgpStatus: z.string()
});
export type AgentNetworkDetailsResult = z.infer<typeof agentNetworkDetailsResultSchema>;

// ---------------------------------------------------------------------------
// agent.getProbeRegions — Multi-region latency probe results
// ---------------------------------------------------------------------------
export const agentProbeRegionsParamsSchema = z.object({ serverId: z.string() });
export type AgentProbeRegionsParams = z.infer<typeof agentProbeRegionsParamsSchema>;

export const globalProbeRegionSchema = z.object({
  id: z.string(),
  name: z.string(),
  target: z.string(),
  color: z.string(),
  baseLatency: z.number(),
  currentLatency: z.number(),
  jitter: z.number(),
  loss: z.string(),
  status: z.enum(["up", "degraded", "down"]),
  isp: z.string(),
  regionCode: z.string()
});
export type GlobalProbeRegion = z.infer<typeof globalProbeRegionSchema>;

export const agentProbeRegionsResultSchema = z.object({
  regions: z.array(globalProbeRegionSchema)
});
export type AgentProbeRegionsResult = z.infer<typeof agentProbeRegionsResultSchema>;

// ---------------------------------------------------------------------------
// agent.getConfig — Full server configuration form state (billing/alerts/traffic)
// ---------------------------------------------------------------------------
export const agentGetConfigParamsSchema = z.object({ serverId: z.string() });
export type AgentGetConfigParams = z.infer<typeof agentGetConfigParamsSchema>;

const notifyChannelConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  target: z.string().optional(),
  enabled: z.boolean()
});

export const agentServerConfigResultSchema = z.object({
  name: z.string(),
  groups: z.array(z.string()),
  tags: z.array(z.string()),
  autoLocation: z.boolean(),
  location: z.string(),
  trafficLimitValue: z.number(),
  trafficLimitUnit: z.enum(["MB", "GB", "TB", "PB"]),
  trafficLimitGb: z.number(),
  trafficCalculation: z.enum(["outbound", "both", "inbound", "max"]),
  trafficResetDay: z.number(),
  publicVisible: z.boolean(),
  maintenanceMode: z.boolean(),
  price: z.number(),
  currency: z.string(),
  billingCycle: z.string(),
  expiresAt: z.string(),
  autoRenew: z.boolean(),
  note: z.string(),
  cpuThreshold: z.number(),
  cpuDurationSec: z.number(),
  memThreshold: z.number(),
  memDurationSec: z.number(),
  diskThreshold: z.number(),
  diskDurationSec: z.number(),
  netThresholdMb: z.number().optional(),
  offlineTimeoutSec: z.number(),
  enableNotify: z.boolean(),
  notifyChannels: z.array(notifyChannelConfigSchema),
  agentToken: z.string(),
  allowRemoteExec: z.boolean()
});
export type AgentServerConfigResult = z.infer<typeof agentServerConfigResultSchema>;

// ---------------------------------------------------------------------------
// agent.updateConfig — Persist full server configuration
// ---------------------------------------------------------------------------
export const agentUpdateConfigParamsSchema = agentServerConfigResultSchema.extend({
  serverId: z.string()
});
export type AgentUpdateConfigParams = z.infer<typeof agentUpdateConfigParamsSchema>;

// ---------------------------------------------------------------------------
// agent.decommission — Remove and deregister a server node
// ---------------------------------------------------------------------------
export const agentDecommissionParamsSchema = z.object({ serverId: z.string() });
export type AgentDecommissionParams = z.infer<typeof agentDecommissionParamsSchema>;
