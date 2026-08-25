import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/query-keys";
import { httpClient } from "@/shared/api/http/http-client";
import type { AlertSeverity, AlertListResult } from "@/shared/api/methods";

/**
 * 获取集群告警规则与历史触发事件列表 Hook（HTTP GET /api/v1/alerts）
 */
export function useAlerts() {
  return useQuery({
    queryKey: queryKeys.alerts,
    queryFn: () => httpClient.get<AlertListResult>("/api/v1/alerts")
  });
}

/**
 * 新建告警规则策略 Hook（HTTP POST /api/v1/alerts）
 */
export function useCreateAlertRule() {
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
    }) => httpClient.post("/api/v1/alerts", params),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.alerts })
  });
}

/**
 * 静音/取消静音指定告警规则 Hook（HTTP POST /api/v1/alerts/:id/silence）
 */
export function useSilenceAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; silenced: boolean }) =>
      httpClient.post(`/api/v1/alerts/${params.id}/silence`, { silenced: params.silenced }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.alerts })
  });
}

/**
 * 删除指定告警规则 Hook（HTTP DELETE /api/v1/alerts/:id）
 */
export function useDeleteAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      httpClient.delete(`/api/v1/alerts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.alerts })
  });
}
