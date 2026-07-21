import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { methods } from "@/shared/api/methods";
import { queryKeys } from "@/shared/api/query-keys";
import { useRpc } from "@/app/providers/rpc-context";
import type { Account } from "@/shared/api/methods";

export function useAccounts() {
  const { client } = useRpc();
  return useQuery({
    queryKey: queryKeys.accounts,
    queryFn: () => client.call("account.list", {}, methods["account.list"].result)
  });
}

export function useInviteAccount() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { username: string; role: Account["role"] }) =>
      client.call("account.invite", params, methods["account.invite"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.accounts })
  });
}

export function useLockAccount() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; locked: boolean }) =>
      client.call("account.lock", params, methods["account.lock"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.accounts })
  });
}

export function useUpdateAccount() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; role: Account["role"] }) =>
      client.call("account.update", params, methods["account.update"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.accounts })
  });
}
