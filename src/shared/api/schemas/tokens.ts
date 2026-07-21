import { z } from "zod";

// token.* — API access tokens with scoped permissions.

export const tokenSchema = z.object({
  id: z.string(),
  name: z.string(),
  scopes: z.array(z.string()),
  createdAt: z.number(),
  expiresAt: z.number().optional(),
  lastUsedAt: z.number().optional(),
  createdBy: z.string(),
  revoked: z.boolean().default(false)
});
export type Token = z.infer<typeof tokenSchema>;

export const tokenListResultSchema = z.object({
  tokens: z.array(tokenSchema)
});

// mutations
export const tokenCreateParamsSchema = z.object({
  name: z.string(),
  scopes: z.array(z.string()),
  expiresAt: z.number().optional()
});
export const tokenRevokeParamsSchema = z.object({ id: z.string() });
