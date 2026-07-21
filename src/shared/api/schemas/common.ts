import { z } from "zod";

// Shared primitives reused across domain schemas: server identity, live
// metrics, and the universal ok/pong results. Other schema modules import
// from here so a change to ServerStatus / ServerMetrics propagates once.

export const serverStatusSchema = z.enum(["online", "warning", "offline"]);
export type ServerStatus = z.infer<typeof serverStatusSchema>;

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
  lastSeenAt: z.number().optional()
});
export type Server = z.infer<typeof serverSchema>;

export const serverMetricsSchema = z.object({
  serverId: z.string(),
  cpuUsage: z.number(),
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
  uptime: z.number().optional().default(0),
  processCount: z.number().optional().default(0),
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
  ts: z.number()
});
export type ServerMetrics = z.infer<typeof serverMetricsSchema>;

export const pingResultSchema = z.object({ ok: z.boolean() });

/** Universal success envelope for mutations. */
export const okResultSchema = z.object({ ok: z.boolean() });
