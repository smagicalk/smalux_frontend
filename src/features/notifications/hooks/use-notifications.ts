import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { methods } from "@/shared/api/methods";
import { queryKeys } from "@/shared/api/query-keys";
import { useRpc } from "@/app/providers/rpc-context";
import type { ChannelType } from "@/shared/api/methods";

export function useNotifications() {
  const { client } = useRpc();
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => client.call("notification.list", {}, methods["notification.list"].result)
  });
}

export function useCreateChannel() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; type: ChannelType; endpoint: string }) =>
      client.call("notification.create", params, methods["notification.create"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications })
  });
}

export function useToggleChannel() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; enabled: boolean }) =>
      client.call("notification.toggle", params, methods["notification.toggle"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications })
  });
}
