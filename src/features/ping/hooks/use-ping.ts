import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { methods } from "@/shared/api/methods";
import { queryKeys } from "@/shared/api/query-keys";
import { useRpc } from "@/app/providers/rpc-context";
import type { PingProtocol } from "@/shared/api/methods";

export function usePingTargets() {
  const { client } = useRpc();
  return useQuery({
    queryKey: queryKeys.ping,
    queryFn: () => client.call("monitor.service.list", {}, methods["monitor.service.list"].result)
  });
}

export function useCreatePingTarget() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; address: string; protocol: PingProtocol; group: "public" | "control" | "notify" | "private" }) =>
      client.call("monitor.service.create", params, methods["monitor.service.create"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.ping })
  });
}

export function useDeletePingTarget() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      client.call("monitor.service.delete", { id }, methods["monitor.service.delete"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.ping })
  });
}
