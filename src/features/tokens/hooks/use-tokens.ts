import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { methods } from "@/shared/api/methods";
import { queryKeys } from "@/shared/api/query-keys";
import { useRpc } from "@/app/providers/rpc-context";

/**
 * 获取 API 访问令牌（Access Token）列表 Hook
 * 
 * 对应 `token.list` JSON-RPC 方法。
 */
export function useTokens() {
  const { client } = useRpc();
  return useQuery({
    queryKey: queryKeys.tokens,
    queryFn: () => client.call("token.list", {}, methods["token.list"].result)
  });
}

/**
 * 签发新的 API Token Hook（Mutation）
 * 
 * 对应 `token.create` JSON-RPC 方法。
 */
export function useCreateToken() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; scopes: string[]; expiresAt?: number }) =>
      client.call("token.create", params, methods["token.create"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tokens })
  });
}

/**
 * 吊销/撤销已签发的 Token Hook（Mutation）
 * 
 * 对应 `token.revoke` JSON-RPC 方法。
 */
export function useRevokeToken() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      client.call("token.revoke", { id }, methods["token.revoke"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tokens })
  });
}
