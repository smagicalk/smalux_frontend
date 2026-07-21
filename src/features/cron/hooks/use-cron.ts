import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { methods } from "@/shared/api/methods";
import { queryKeys } from "@/shared/api/query-keys";
import { useRpc } from "@/app/providers/rpc-context";

export function useCrons() {
  const { client } = useRpc();
  return useQuery({
    queryKey: queryKeys.cron,
    queryFn: () => client.call("cron.list", {}, methods["cron.list"].result)
  });
}

export function useCreateCron() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; serverId: string; expression: string; command: string }) =>
      client.call("cron.create", params, methods["cron.create"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cron })
  });
}

export function useToggleCron() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; enabled: boolean }) =>
      client.call("cron.toggle", params, methods["cron.toggle"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cron })
  });
}

export function useDeleteCron() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      client.call("cron.delete", { id }, methods["cron.delete"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cron })
  });
}
