import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/query-keys";
import { httpClient } from "@/shared/api/http/http-client";
import type { ChannelType, NotificationListResult } from "@/shared/api/methods";

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => httpClient.get<NotificationListResult>("/api/v1/notifications")
  });
}

export function useCreateChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; type: ChannelType; endpoint: string }) =>
      httpClient.post("/api/v1/notifications", params),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications })
  });
}

export function useToggleChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; enabled: boolean }) =>
      httpClient.post(`/api/v1/notifications/${params.id}/toggle`, { enabled: params.enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications })
  });
}
