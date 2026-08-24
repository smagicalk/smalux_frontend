import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { methods } from "@/shared/api/methods";
import { queryKeys } from "@/shared/api/query-keys";
import { useRpc } from "@/app/providers/rpc-context";
import type { Account } from "@/shared/api/methods";

/**
 * 获取系统多用户与成员账号列表 Hook
 * 
 * 对应 `account.list` JSON-RPC 方法。
 */
export function useAccounts() {
  const { client } = useRpc();
  return useQuery({
    queryKey: queryKeys.accounts,
    queryFn: () => client.call("account.list", {}, methods["account.list"].result)
  });
}

/**
 * 邀请/创建新系统成员 Hook（Mutation）
 * 
 * 对应 `account.invite` JSON-RPC 方法。
 */
export function useInviteAccount() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { username: string; role: Account["role"] }) =>
      client.call("account.invite", params, methods["account.invite"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.accounts })
  });
}

/**
 * 锁定/解锁用户账号 Hook（Mutation）
 * 
 * 对应 `account.lock` JSON-RPC 方法。
 */
export function useLockAccount() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; locked: boolean }) =>
      client.call("account.lock", params, methods["account.lock"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.accounts })
  });
}

/**
 * 修改成员角色与权限 Hook（Mutation）
 * 
 * 对应 `account.update` JSON-RPC 方法。
 */
export function useUpdateAccount() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; role: Account["role"] }) =>
      client.call("account.update", params, methods["account.update"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.accounts })
  });
}
