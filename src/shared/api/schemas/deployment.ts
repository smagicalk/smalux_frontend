import { z } from "zod";

// deployment.* — build targets + the active deployment mode switch.

export const deploymentModeSchema = z.enum(["static", "nginx", "rust-embed"]);
export type DeploymentMode = z.infer<typeof deploymentModeSchema>;

export const deploymentTargetSchema = z.object({
  id: z.string(),
  mode: deploymentModeSchema,
  name: z.string(),
  status: z.enum(["ready", "building", "failed"]),
  updatedAt: z.number(),
  complexity: z.enum(["low", "medium", "high"])
});
export type DeploymentTarget = z.infer<typeof deploymentTargetSchema>;

export const deploymentListResultSchema = z.object({
  targets: z.array(deploymentTargetSchema),
  current: deploymentModeSchema.optional()
});

// mutations
export const deploymentSwitchParamsSchema = z.object({ mode: deploymentModeSchema });
