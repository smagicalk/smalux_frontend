/**
 * 账户安全中心、TOTP 2FA 双因子认证与多端会话管理 TanStack Query Hooks
 * 
 * 提供：
 * 1. 管理员安全大盘指标概览 (`useSecurityOverview`)
 * 2. TOTP 双因子动态密钥生成、校验激活与验密关闭 (`useSetupTotp`, `useVerifyTotp`, `useDisableTotp`)
 * 3. 管理员登录密码变更 (`useChangePassword`)
 * 4. 活跃终端会话查询、单设备强制下线与一键剔除其他所有外部终端 (`useSessions`, `useTerminateSession`, `useTerminateOtherSessions`)
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/query-keys";
import { httpClient } from "@/shared/api/http/http-client";
import type {
  SecurityOverview,
  SessionInfo
} from "@/features/settings/mock/settings-mock";

/**
 * 获取管理员账户安全大盘概览
 * 
 * 对应后端接口：`GET /api/v1/security/overview`
 * @returns 包含 MFA 状态、Passkeys 数量、活跃会话总数、安全评分与密码修改时间的统计对象
 */
export function useSecurityOverview() {
  return useQuery({
    queryKey: queryKeys.securityOverview,
    queryFn: () => httpClient.get<SecurityOverview>("/api/v1/security/overview")
  });
}

/**
 * 获取 TOTP 绑定密钥与动态二维码链接
 * 
 * 对应后端接口：`POST /api/v1/security/totp/setup`
 * @returns `{ secret: string, otpauthUrl: string }`
 */
export function useSetupTotp() {
  return useMutation({
    mutationFn: () => httpClient.post<{ secret: string; otpauthUrl: string }>("/api/v1/security/totp/setup")
  });
}

/**
 * 校验 6 位动态验证码并激活 TOTP 双因子保护
 * 
 * 对应后端接口：`POST /api/v1/security/totp/verify`
 * @param code 客户端 Authenticator 算出的 6 位动态数字口令
 */
export function useVerifyTotp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => httpClient.post<{ ok: boolean }>("/api/v1/security/totp/verify", { code }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.securityOverview });
    }
  });
}

/**
 * 验证管理员登录密码后关闭并解绑 TOTP 双因子认证（防未授权降级）
 * 
 * 对应后端接口：`POST /api/v1/security/totp/disable`
 * @param verifyPassword 当前管理员登录密码
 */
export function useDisableTotp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (verifyPassword?: string) =>
      httpClient.post<{ ok: boolean }>("/api/v1/security/totp/disable", { verifyPassword }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.securityOverview });
    }
  });
}

/**
 * 修改管理员登录密码
 * 
 * 对应后端接口：`POST /api/v1/security/password/change`
 * @param params.oldPassword 当前旧密码
 * @param params.newPassword 新密码（至少 8 位）
 * @param params.mfaCode 若已启用 TOTP，必须携带 6 位动态验证码
 */
export function useChangePassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { oldPassword: string; newPassword: string; mfaCode?: string }) =>
      httpClient.post<{ ok: boolean }>("/api/v1/security/password/change", params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.securityOverview });
    }
  });
}

/**
 * 获取全部活跃登录终端与会话列表
 * 
 * 对应后端接口：`GET /api/v1/security/sessions`
 * @returns 会话列表 `{ sessions: SessionInfo[] }`
 */
export function useSessions() {
  return useQuery({
    queryKey: queryKeys.sessions,
    queryFn: () => httpClient.get<{ sessions: SessionInfo[] }>("/api/v1/security/sessions")
  });
}

/**
 * 强制注销指定的外部终端会话
 * 
 * 对应后端接口：`DELETE /api/v1/security/sessions/:id`
 * @param id 目标终端会话 ID
 */
export function useTerminateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => httpClient.delete<{ ok: boolean }>(`/api/v1/security/sessions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.sessions });
      qc.invalidateQueries({ queryKey: queryKeys.securityOverview });
    }
  });
}

/**
 * 一键强制注销除当前终端外的所有外部会话（防 Session 劫持与异地残留）
 * 
 * 对应后端接口：`POST /api/v1/security/sessions/terminate-others`
 */
export function useTerminateOtherSessions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => httpClient.post<{ ok: boolean; terminatedCount: number }>("/api/v1/security/sessions/terminate-others"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.sessions });
      qc.invalidateQueries({ queryKey: queryKeys.securityOverview });
    }
  });
}
