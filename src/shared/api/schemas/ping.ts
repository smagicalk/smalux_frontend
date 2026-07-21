import { z } from "zod";

// monitor.service.* — service liveness probes (http/tcp/icmp/wss).

export const pingProtocolSchema = z.enum(["http", "tcp", "icmp", "wss"]);
export type PingProtocol = z.infer<typeof pingProtocolSchema>;

export const pingTargetSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  protocol: pingProtocolSchema,
  group: z.enum(["public", "control", "notify", "private"]),
  enabled: z.boolean(),
  latencyMs: z.number().optional(),
  uptime: z.number().optional(), // 0..1
  lastCheckAt: z.number().optional(),
  lastOk: z.boolean().optional()
});
export type PingTarget = z.infer<typeof pingTargetSchema>;

export const pingListResultSchema = z.object({
  targets: z.array(pingTargetSchema),
  total: z.number()
});

// mutations
export const pingCreateParamsSchema = z.object({
  name: z.string(),
  address: z.string(),
  protocol: pingProtocolSchema,
  group: z.enum(["public", "control", "notify", "private"]).default("private")
});
export const pingDeleteParamsSchema = z.object({ id: z.string() });
