import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/query-keys";
import { httpClient } from "@/shared/api/http/http-client";
import type { CronListResult, CronLogListResult } from "@/shared/api/methods";

/**
 * 获取集群分布式定时任务列表 Hook（HTTP GET /api/v1/crons）
 */
export function useCrons() {
  return useQuery({
    queryKey: queryKeys.cron,
    queryFn: () => httpClient.get<CronListResult>("/api/v1/crons")
  });
}

/**
 * 获取计划任务历史执行流水记录 Hook（HTTP GET /api/v1/crons/logs）
 */
export function useCronLogs(params?: { cronId?: string; serverId?: string }) {
  return useQuery({
    queryKey: queryKeys.cronLogs(params),
    queryFn: () => httpClient.get<CronLogListResult>("/api/v1/crons/logs", params)
  });
}

/**
 * 新增定时任务 Hook（HTTP POST /api/v1/crons）
 */
export function useCreateCron() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; serverId: string; expression: string; command: string }) =>
      httpClient.post("/api/v1/crons", params),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cron })
  });
}

/**
 * 更新/编辑定时任务 Hook（HTTP PUT /api/v1/crons/:id）
 */
export function useUpdateCron() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; name: string; serverId: string; expression: string; command: string }) =>
      httpClient.put(`/api/v1/crons/${params.id}`, params),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cron })
  });
}

/**
 * 启用/禁用定时任务 Hook（HTTP POST /api/v1/crons/:id/toggle）
 */
export function useToggleCron() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; enabled: boolean }) =>
      httpClient.post(`/api/v1/crons/${params.id}/toggle`, { enabled: params.enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cron })
  });
}

/**
 * 删除指定定时任务 Hook（HTTP DELETE /api/v1/crons/:id）
 */
export function useDeleteCron() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      httpClient.delete(`/api/v1/crons/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cron })
  });
}
