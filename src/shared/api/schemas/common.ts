import { z } from "zod";

// Shared primitives reused across domain schemas: server identity, live
// metrics, and the universal ok/pong results. Other schema modules import
// from here so a change to ServerStatus / ServerMetrics propagates once.

export const serverStatusSchema = z.enum(["online", "warning", "offline"]);
export type ServerStatus = z.infer<typeof serverStatusSchema>;

export const billingCycleSchema = z.enum([
  "monthly",
  "quarterly",
  "semiannual",
  "yearly",
  "biennial",
  "triennial",
  "one_time"
]);
export type BillingCycle = z.infer<typeof billingCycleSchema>;

export const serverSchema = z.object({
  id: z.string(),
  name: z.string(),
  region: z.string(),
  note: z.string().optional().default(""),
  status: serverStatusSchema,
  publicVisible: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  os: z.string().optional(),
  arch: z.string().optional(),
  agentVersion: z.string().optional(),
  ipv4: z.string().optional(),
  ipv6: z.string().optional(),
  // Public IP is reported behind its own switch — when `publicIpEnabled` is
  // false the agent doesn't disclose it and `publicIp` is null. The UI then
  // shows "关闭统计" rather than a redacted/blank address.
  publicIpEnabled: z.boolean().default(true),
  publicIp: z.string().nullable().default(null),
  lastSeenAt: z.number().optional(),
  // Commercial metadata is operator-owned and independent of Agent
  // telemetry. Optional fields keep older backend responses compatible.
  price: z.number().nonnegative().nullable().optional(),
  currency: z.string().min(1).optional(),
  expiresAt: z.number().nullable().optional(),
  billingCycle: billingCycleSchema.nullable().optional(),
  allowRemoteExec: z.boolean().optional(),
  enableProcessCollection: z.boolean().optional(),
  processCollectionMode: z.enum(["enabled", "disable_auto", "forbidden"]).optional()
});
export type Server = z.infer<typeof serverSchema>;

/**
 * Optional resource breakdowns reported by newer agents. Aggregate fields on
 * ServerMetrics remain authoritative and backward compatible; these arrays
 * explain which logical CPU, network interface or block device contributes to
 * the total shown by the overview cards.
 */
const cpuCoreMetricSchema = z.object({
  name: z.string(),
  usage: z.number()
});

const networkInterfaceMetricSchema = z.object({
  name: z.string(),
  rxSpeed: z.number(),
  txSpeed: z.number(),
  rxTotal: z.number().optional().default(0),
  txTotal: z.number().optional().default(0)
});

const diskMetricSchema = z.object({
  name: z.string(),
  mountPoint: z.string().optional(),
  used: z.number(),
  total: z.number(),
  readSpeed: z.number().nullable().optional().default(null),
  writeSpeed: z.number().nullable().optional().default(null)
});

const processMetricSchema = z.object({
  pid: z.number(),
  name: z.string(),
  cpuUsage: z.number(),
  memUsed: z.number(),
  netRxSpeed: z.number().optional().default(0),
  netTxSpeed: z.number().optional().default(0)
});

export const serverMetricsSchema = z.object({
  serverId: z.string(),
  cpuUsage: z.number(),
  // cpuUsage is the all-core average, not the sum of percentages. Agents that
  // support per-core reporting populate cpuCores; older agents parse to [].
  cpuCores: z.array(cpuCoreMetricSchema).optional().default([]),
  memUsed: z.number(),
  memTotal: z.number(),
  swapUsed: z.number().optional().default(0),
  swapTotal: z.number().optional().default(0),
  diskUsed: z.number().optional().default(0),
  diskTotal: z.number().optional().default(0),
  loadOne: z.number().optional(),
  loadFive: z.number().optional(),
  loadFifteen: z.number().optional(),
  netRxSpeed: z.number().optional().default(0),
  netTxSpeed: z.number().optional().default(0),
  netRxTotal: z.number().optional().default(0),
  netTxTotal: z.number().optional().default(0),
  // Aggregate network counters above equal the sum of these interfaces when
  // the agent exposes interface-level telemetry.
  networkInterfaces: z.array(networkInterfaceMetricSchema).optional().default([]),
  uptime: z.number().optional().default(0),
  processCount: z.number().optional().default(0),
  // Process details are opt-in because collecting per-process CPU/memory/network
  // can be expensive. Older agents default to disabled rather than presenting
  // an empty list as a legitimate zero-process host.
  processesEnabled: z.boolean().optional().default(false),
  processes: z.array(processMetricSchema).optional().default([]),
  // TCP / UDP connection counts and disk IO are each behind a collection
  // switch. `*Enabled` is the switch; the value is null when collection is
  // off so the UI can show "关闭统计" instead of a misleading 0. TCP used to
  // be a plain number (always collected); it's now a switch like the others.
  tcpEnabled: z.boolean().default(true),
  tcpConnections: z.number().nullable().default(null),
  udpEnabled: z.boolean().default(true),
  udpConnections: z.number().nullable().default(null),
  diskIoEnabled: z.boolean().default(true),
  diskIo: z
    .object({ readSpeed: z.number(), writeSpeed: z.number() })
    .nullable()
    .default(null),
  // Disk occupancy and IO contribution per block device/mount. IO values may
  // be null even when occupancy exists because collection can be disabled.
  disks: z.array(diskMetricSchema).optional().default([]),
  ts: z.number()
});
export type ServerMetrics = z.infer<typeof serverMetricsSchema>;

export const pingResultSchema = z.object({ ok: z.boolean() });

/** Universal success envelope for mutations. */
export const okResultSchema = z.object({ ok: z.boolean() });
