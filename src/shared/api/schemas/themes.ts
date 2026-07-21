import { z } from "zod";

// theme.* — uploadable/publishable theme packages (draft → published → archived).

export const themeSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(["draft", "published", "archived"]),
  publicVisible: z.boolean(),
  version: z.string(),
  updatedAt: z.number(),
  author: z.string()
});
export type Theme = z.infer<typeof themeSchema>;

export const themeListResultSchema = z.object({
  themes: z.array(themeSchema)
});

// mutations
export const themeUploadParamsSchema = z.object({
  name: z.string(),
  version: z.string().default("0.1.0")
});
export const themePublishParamsSchema = z.object({ id: z.string() });
export const themeArchiveParamsSchema = z.object({ id: z.string() });
