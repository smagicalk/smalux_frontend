import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { methods } from "@/shared/api/methods";
import { queryKeys } from "@/shared/api/query-keys";
import { useRpc } from "@/app/providers/rpc-context";
import type { AlertSeverity } from "@/shared/api/methods";

export function useAlerts() {
  const { client } = useRpc();
  return useQuery({
    queryKey: queryKeys.alerts,
    queryFn: () => client.call("alert.list", {}, methods["alert.list"].result)
  });
}

export function useCreateAlertRule() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      name: string;
      metric: string;
      operator: ">" | "<" | "==" | "!=";
      threshold: number;
      windowSec: number;
      severity: AlertSeverity;
      serverId?: string;
    }) => client.call("alert.create", params, methods["alert.create"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.alerts })
  });
}

export function useSilenceAlert() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; silenced: boolean }) =>
      client.call("alert.silence", params, methods["alert.silence"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.alerts })
  });
}

export function useDeleteAlert() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      client.call("alert.delete", { id }, methods["alert.delete"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.alerts })
  });
}
