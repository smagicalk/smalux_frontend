import { z } from "zod";

import { serverMetricsSchema, serverSchema, serverStatusSchema } from "./common";

// agent.* — server list, live metric stream subscription, registration.

export const agentListParamsSchema = z
  .object({
    region: z.string().optional(),
    status: serverStatusSchema.optional(),
    search: z.string().optional()
  })
  .default({});

export const agentListResultSchema = z.object({
  servers: z.array(serverSchema),
  total: z.number()
});

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
  name: z.string(),
  region: z.string(),
  note: z.string().optional(),
  publicVisible: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  ipv4: z.string().optional(),
  os: z.string().optional(),
  arch: z.string().optional()
});
export type AgentRegisterParams = z.infer<typeof agentRegisterParamsSchema>;
