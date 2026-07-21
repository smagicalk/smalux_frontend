import { z } from "zod";

// config.* — key/value settings grouped for the settings page.

export const settingSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.string(),
  group: z.enum(["general", "security", "limits", "network"]),
  editable: z.boolean().default(true)
});
export type Setting = z.infer<typeof settingSchema>;

export const settingListResultSchema = z.object({
  settings: z.array(settingSchema)
});

// mutations
export const configUpdateParamsSchema = z.object({
  key: z.string(),
  value: z.string()
});
