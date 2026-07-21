import { z } from "zod";

// alert.* — threshold rules + triggered history. severity is reused by
// notifications (an alert's severity drives which channel fires).

export const alertSeveritySchema = z.enum(["info", "warning", "critical"]);
export type AlertSeverity = z.infer<typeof alertSeveritySchema>;

export const alertRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  serverId: z.string().optional(),
  metric: z.string(),
  operator: z.enum([">", "<", "==", "!="]),
  threshold: z.number(),
  windowSec: z.number(),
  severity: alertSeveritySchema,
  enabled: z.boolean(),
  silenced: z.boolean().default(false)
});
export type AlertRule = z.infer<typeof alertRuleSchema>;

export const alertHistorySchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  ruleName: z.string(),
  serverName: z.string().optional(),
  severity: alertSeveritySchema,
  triggeredAt: z.number(),
  resolvedAt: z.number().optional(),
  value: z.number(),
  message: z.string()
});
export type AlertHistory = z.infer<typeof alertHistorySchema>;

export const alertListResultSchema = z.object({
  rules: z.array(alertRuleSchema),
  history: z.array(alertHistorySchema)
});

// mutations
export const alertCreateParamsSchema = z.object({
  name: z.string(),
  metric: z.string(),
  operator: z.enum([">", "<", "==", "!="]),
  threshold: z.number(),
  windowSec: z.number().default(300),
  severity: alertSeveritySchema,
  serverId: z.string().optional()
});
export const alertSilenceParamsSchema = z.object({ id: z.string(), silenced: z.boolean() });
export const alertDeleteParamsSchema = z.object({ id: z.string() });
