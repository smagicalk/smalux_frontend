import { z } from "zod";

// account.* — operator accounts: roles, MFA/passkey flags, lock state.

export const accountSchema = z.object({
  id: z.string(),
  username: z.string(),
  role: z.enum(["admin", "operator", "viewer", "auditor"]),
  status: z.enum(["active", "locked", "invited"]),
  mfaEnabled: z.boolean(),
  passkeyEnabled: z.boolean(),
  lastLoginAt: z.number().optional(),
  sessions: z.number().default(0)
});
export type Account = z.infer<typeof accountSchema>;

export const accountListResultSchema = z.object({
  accounts: z.array(accountSchema),
  total: z.number()
});

// mutations — role is shared from accountSchema.shape so the enum stays single-source.
export const accountInviteParamsSchema = z.object({
  username: z.string(),
  role: accountSchema.shape.role
});
export const accountLockParamsSchema = z.object({ id: z.string(), locked: z.boolean() });
export const accountUpdateParamsSchema = z.object({
  id: z.string(),
  role: accountSchema.shape.role
});
export type AccountUpdateParams = z.infer<typeof accountUpdateParamsSchema>;
