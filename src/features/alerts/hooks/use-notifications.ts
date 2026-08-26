import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/query-keys";
import { httpClient } from "@/shared/api/http/http-client";
import type { ChannelType, NotificationListResult } from "@/shared/api/methods";

/**
 * 获取通知推送渠道与近期投递历史列表 Hook（HTTP GET /api/v1/notifications）
 */
export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => httpClient.get<NotificationListResult>("/api/v1/notifications")
  });
}

/**
 * 新建通知推送渠道 Hook（HTTP POST /api/v1/notifications）
 */
export function useCreateChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; type: ChannelType; endpoint: string; headers?: string; template?: string }) =>
      httpClient.post("/api/v1/notifications", params),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications })
  });
}

/**
 * 启用/停用通知推送渠道 Hook（HTTP POST /api/v1/notifications/:id/toggle）
 */
export function useToggleChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; enabled: boolean }) =>
      httpClient.post(`/api/v1/notifications/${params.id}/toggle`, { enabled: params.enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications })
  });
}

/**
 * 删除通知推送渠道 Hook（HTTP DELETE /api/v1/notifications/:id）
 */
export function useDeleteChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      httpClient.delete(`/api/v1/notifications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications })
  });
}

/**
 * 发送单次连通性测试通知 Hook（HTTP POST /api/v1/notifications/:id/test）
 */
export function useTestChannel() {
  return useMutation({
    mutationFn: (params: { id: string; channelName: string }) =>
      httpClient.post<{ ok: boolean; message?: string }>(`/api/v1/notifications/${params.id}/test`, {})
  });
}
