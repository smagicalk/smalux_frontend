import { z } from "zod";

/**
 * overview.stats — Dedicated API contract for the Overview Cockpit HUD metrics.
 */
export const overviewStatsParamsSchema = z.object({}).default({});

export const overviewStatsResultSchema = z.object({
  healthScore: z.number(),
  sla: z.number(),
  onlineCount: z.number(),
  totalCount: z.number(),
  onlineRate: z.number(),
  throughput: z.string(),
  activeConnections: z.string(),
  avgCpu: z.number(),
  avgMemory: z.number(),
  avgDisk: z.number(),
  activeAlertsCount: z.number()
});

export type OverviewStatsParams = z.infer<typeof overviewStatsParamsSchema>;
export type OverviewStatsResult = z.infer<typeof overviewStatsResultSchema>;
