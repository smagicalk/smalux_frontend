import { z } from "zod";

/**
 * 开放平台 API 访问令牌（Access Token）数据契约 Schema
 */
export const tokenSchema = z.object({
  /** 令牌唯一标识 ID */
  id: z.string(),
  /** 令牌名称/用途备注（如 "CI/CD 自动化部署 Token", "Prometheus 数据拉取"） */
  name: z.string(),
  /** 授权作用域权限列表（如 ["server:read", "task:dispatch"]） */
  scopes: z.array(z.string()),
  /** 签发创建的时间戳（毫秒） */
  createdAt: z.number(),
  /** 令牌过期失效时间戳（毫秒，若为空表示永久有效） */
  expiresAt: z.number().optional(),
  /** 最近一次使用该 Token 调用的时间戳（毫秒） */
  lastUsedAt: z.number().optional(),
  /** 签发创建该 Token 的管理员用户名 */
  createdBy: z.string(),
  /** 该 Token 是否已被主动吊销作废 */
  revoked: z.boolean().default(false)
});
export type Token = z.infer<typeof tokenSchema>;

/**
 * 令牌列表查询响应契约
 */
export const tokenListResultSchema = z.object({
  /** 令牌列表数组 */
  tokens: z.array(tokenSchema)
});

/**
 * 签发新 API 令牌入参契约
 */
export const tokenCreateParamsSchema = z.object({
  /** 令牌名称 */
  name: z.string(),
  /** 权限作用域列表 */
  scopes: z.array(z.string()),
  /** 过期时间戳（毫秒，可选） */
  expiresAt: z.number().optional()
});

/**
 * 吊销/作废令牌入参契约
 */
export const tokenRevokeParamsSchema = z.object({
  /** 待吊销令牌 ID */
  id: z.string()
});
