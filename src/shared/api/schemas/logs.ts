import { z } from "zod";

// log.* — audit trail. module is a closed enum since audit covers fixed
// subsystems; result is success/failure so failures stand out.

export const logSchema = z.object({
  id: z.string(),
  ts: z.number(),
  actor: z.string(),
  module: z.enum([
    "auth",
    "task",
    "cron",
    "token",
    "theme",
    "config",
    "terminal",
    "alert"
  ]),
  action: z.string(),
  result: z.enum(["success", "failure"]),
  target: z.string().optional(),
  ip: z.string().optional(),
  detail: z.string().optional()
});
export type Log = z.infer<typeof logSchema>;

export const logListParamsSchema = z
  .object({
    search: z.string().optional(),
    module: z.string().optional(),
    result: z.enum(["success", "failure"]).optional()
  })
  .default({});

export const logListResultSchema = z.object({
  logs: z.array(logSchema),
  total: z.number()
});
