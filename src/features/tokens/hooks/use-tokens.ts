import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { methods } from "@/shared/api/methods";
import { queryKeys } from "@/shared/api/query-keys";
import { useRpc } from "@/app/providers/rpc-context";

export function useTokens() {
  const { client } = useRpc();
  return useQuery({
    queryKey: queryKeys.tokens,
    queryFn: () => client.call("token.list", {}, methods["token.list"].result)
  });
}

export function useCreateToken() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; scopes: string[]; expiresAt?: number }) =>
      client.call("token.create", params, methods["token.create"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tokens })
  });
}

export function useRevokeToken() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      client.call("token.revoke", { id }, methods["token.revoke"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tokens })
  });
}
