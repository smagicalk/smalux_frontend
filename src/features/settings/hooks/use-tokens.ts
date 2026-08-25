import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/query-keys";
import { httpClient } from "@/shared/api/http/http-client";
import type { TokenListResult } from "@/shared/api/methods";

/**
 * 获取 API 访问令牌列表 Hook（HTTP GET /api/v1/tokens）
 */
export function useTokens() {
  return useQuery({
    queryKey: queryKeys.tokens,
    queryFn: () => httpClient.get<TokenListResult>("/api/v1/tokens")
  });
}

/**
 * 签发新的 API Token Hook（HTTP POST /api/v1/tokens）
 */
export function useCreateToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; scopes: string[]; expiresAt?: number }) =>
      httpClient.post("/api/v1/tokens", params),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tokens })
  });
}

/**
 * 吊销/撤销 Token Hook（HTTP DELETE /api/v1/tokens/:id）
 */
export function useRevokeToken() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      httpClient.delete(`/api/v1/tokens/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tokens })
  });
}
