import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/query-keys";
import { httpClient } from "@/shared/api/http/http-client";
import type { Account, AccountListResult } from "@/shared/api/methods";

/**
 * 获取系统成员账号列表 Hook（HTTP GET /api/v1/accounts）
 */
export function useAccounts() {
  return useQuery({
    queryKey: queryKeys.accounts,
    queryFn: () => httpClient.get<AccountListResult>("/api/v1/accounts")
  });
}

/**
 * 邀请/创建新系统成员 Hook（HTTP POST /api/v1/accounts）
 */
export function useInviteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { username: string; role: Account["role"] }) =>
      httpClient.post("/api/v1/accounts", params),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.accounts })
  });
}

/**
 * 锁定/解锁用户账号 Hook（HTTP PUT /api/v1/accounts/:id/lock）
 */
export function useLockAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; locked: boolean }) =>
      httpClient.put(`/api/v1/accounts/${params.id}/lock`, { locked: params.locked }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.accounts })
  });
}

/**
 * 修改成员角色与权限 Hook（HTTP PUT /api/v1/accounts/:id）
 */
export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; role: Account["role"] }) =>
      httpClient.put(`/api/v1/accounts/${params.id}`, { role: params.role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.accounts })
  });
}
