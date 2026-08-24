import { z } from "zod";

import { taskStatusSchema } from "./tasks";

// cron.* — scheduled jobs. Reuses taskStatusSchema for lastRun outcome.

export const cronSchema = z.object({
  id: z.string(),
  name: z.string(),
  serverId: z.string(),
  serverName: z.string(),
  expression: z.string(),
  command: z.string(),
  enabled: z.boolean(),
  lastRunAt: z.number().optional(),
  nextRunAt: z.number().optional(),
  lastStatus: taskStatusSchema.optional()
});
export type Cron = z.infer<typeof cronSchema>;

export const cronListResultSchema = z.object({
  crons: z.array(cronSchema),
  total: z.number()
});

// cron execution historical log entry
export const cronLogSchema = z.object({
  id: z.string(),
  cronId: z.string(),
  cronName: z.string(),
  batchId: z.string().optional(),
  runNumber: z.number().optional(),
  expression: z.string(),
  serverId: z.string(),
  serverName: z.string(),
  command: z.string(),
  status: taskStatusSchema,
  triggerType: z.enum(["cron", "manual"]).default("cron"),
  startedAt: z.number(),
  finishedAt: z.number().optional(),
  durationMs: z.number().optional(),
  exitCode: z.number().optional(),
  output: z.string().optional()
});
export type CronLog = z.infer<typeof cronLogSchema>;

export const cronLogListResultSchema = z.object({
  logs: z.array(cronLogSchema),
  total: z.number()
});

// mutations
export const cronCreateParamsSchema = z.object({
  name: z.string(),
  serverId: z.string(),
  expression: z.string(),
  command: z.string()
});
export const cronUpdateParamsSchema = cronCreateParamsSchema.extend({ id: z.string() });
export const cronToggleParamsSchema = z.object({ id: z.string(), enabled: z.boolean() });
export const cronDeleteParamsSchema = z.object({ id: z.string() });
