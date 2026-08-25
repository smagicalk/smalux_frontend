import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/query-keys";
import { httpClient } from "@/shared/api/http/http-client";
import type { PingProtocol, PingListResult } from "@/shared/api/methods";

/**
 * 获取服务可用性网络拨测目标列表 Hook（HTTP GET /api/v1/ping-targets）
 */
export function usePingTargets() {
  return useQuery({
    queryKey: queryKeys.ping,
    queryFn: () => httpClient.get<PingListResult>("/api/v1/ping-targets")
  });
}

/**
 * 新增服务网络拨测监控目标 Hook（HTTP POST /api/v1/ping-targets）
 */
export function useCreatePingTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; address: string; protocol: PingProtocol; group: "public" | "control" | "notify" | "private" }) =>
      httpClient.post("/api/v1/ping-targets", params),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.ping })
  });
}

/**
 * 删除指定服务网络拨测监控目标 Hook（HTTP DELETE /api/v1/ping-targets/:id）
 */
export function useDeletePingTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      httpClient.delete(`/api/v1/ping-targets/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.ping })
  });
}
