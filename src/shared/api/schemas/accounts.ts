import { z } from "zod";

/**
 * 系统多用户与操作员账号（Account）数据契约 Schema
 * 
 * 对应 `account.*` API 实体，包含权限角色、MFA 多因素认证、Passkey 凭证状态与锁定状态。
 */
export const accountSchema = z.object({
  /** 用户唯一标识 ID（如 "acc-admin-01"） */
  id: z.string(),
  /** 用户登录名/账号名称（如 "root", "devops_leader"） */
  username: z.string(),
  /**
   * 用户系统权限角色：
   * - admin: 超级管理员（具备全系统配置、删除节点、管理 Token 等全部权限）
   * - operator: 运维值班员（具备命令下发、Cron 编辑、告警静默权限）
   * - viewer: 只读观察员（仅可查看大盘与监控指标）
   * - auditor: 安全审计员（具备查看全量系统审计流水与安全配置权限）
   */
  role: z.enum(["admin", "operator", "viewer", "auditor"]),
  /**
   * 账号当前状态：
   * - active: 正常活跃
   * - locked: 已被管理员强制锁定（禁止登录）
   * - invited: 邀请中（等待首次激活或设置密码）
   */
  status: z.enum(["active", "locked", "invited"]),
  /** 是否已绑定并启用 MFA 双因素二次验证（如 TOTP 谷歌验证器） */
  mfaEnabled: z.boolean(),
  /** 是否已注册并启用 WebAuthn / Passkey 生物识别免密安全凭证 */
  passkeyEnabled: z.boolean(),
  /** 最近一次成功登录的 Unix 时间戳（毫秒） */
  lastLoginAt: z.number().optional(),
  /** 当前在线活跃的登录会话（Session）数量 */
  sessions: z.number().default(0)
});
export type Account = z.infer<typeof accountSchema>;

/**
 * 用户列表查询响应契约
 */
export const accountListResultSchema = z.object({
  /** 账号列表数组 */
  accounts: z.array(accountSchema),
  /** 系统中成员总数 */
  total: z.number()
});
export type AccountListResult = z.infer<typeof accountListResultSchema>;

/**
 * 邀请新用户入参契约
 */
export const accountInviteParamsSchema = z.object({
  /** 被邀请成员的用户名/邮箱 */
  username: z.string(),
  /** 预分配的角色权限 */
  role: accountSchema.shape.role
});

/**
 * 锁定/解锁用户入参契约
 */
export const accountLockParamsSchema = z.object({
  /** 用户 ID */
  id: z.string(),
  /** 是否锁定（true 为锁定，false 为解锁） */
  locked: z.boolean()
});

/**
 * 更新用户权限角色入参契约
 */
export const accountUpdateParamsSchema = z.object({
  /** 用户 ID */
  id: z.string(),
  /** 新分配的系统角色 */
  role: accountSchema.shape.role
});
export type AccountUpdateParams = z.infer<typeof accountUpdateParamsSchema>;
