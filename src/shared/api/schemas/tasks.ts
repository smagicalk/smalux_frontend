import { z } from "zod";

// task.* — remote command execution: queued tasks + reusable templates.

export const taskStatusSchema = z.enum([
  "pending",
  "approved",
  "running",
  "success",
  "failed",
  "timeout"
]);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

export const taskSchema = z.object({
  id: z.string(),
  serverId: z.string(),
  serverName: z.string(),
  command: z.string(),
  status: taskStatusSchema,
  risk: z.enum(["low", "medium", "high"]),
  scope: z.string(),
  startedAt: z.number().optional(),
  finishedAt: z.number().optional(),
  durationMs: z.number().optional(),
  exitCode: z.number().optional(),
  output: z.string().optional(),
  approver: z.string().optional()
});
export type Task = z.infer<typeof taskSchema>;

export const taskListResultSchema = z.object({
  tasks: z.array(taskSchema),
  total: z.number()
});

export const taskTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  command: z.string(),
  risk: z.enum(["low", "medium", "high"]),
  scope: z.string(),
  requiresApproval: z.boolean().optional(),
  description: z.string().optional()
});
export type TaskTemplate = z.infer<typeof taskTemplateSchema>;

export const taskTemplateListResultSchema = z.object({
  templates: z.array(taskTemplateSchema)
});

// mutations
export const taskDispatchParamsSchema = z.object({
  serverId: z.string(),
  command: z.string(),
  risk: z.enum(["low", "medium", "high"]).default("low"),
  scope: z.string().default("node:exec")
});
export const taskApproveParamsSchema = z.object({ id: z.string() });
