import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { methods } from "@/shared/api/methods";
import { queryKeys } from "@/shared/api/query-keys";
import { useRpc } from "@/app/providers/rpc-context";
import type { PingProtocol } from "@/shared/api/methods";

/**
 * 获取服务可用性网络拨测目标列表 Hook
 * 
 * 对应 `monitor.service.list` JSON-RPC 方法。
 * 查询 HTTP/HTTPS/TCP/ICMP/WSS 服务探针的在线状态、实时时延与可用率。
 */
export function usePingTargets() {
  const { client } = useRpc();
  return useQuery({
    queryKey: queryKeys.ping,
    queryFn: () => client.call("monitor.service.list", {}, methods["monitor.service.list"].result)
  });
}

/**
 * 新增服务网络拨测监控目标 Hook（Mutation）
 * 
 * 对应 `monitor.service.create` JSON-RPC 方法。
 */
export function useCreatePingTarget() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; address: string; protocol: PingProtocol; group: "public" | "control" | "notify" | "private" }) =>
      client.call("monitor.service.create", params, methods["monitor.service.create"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.ping })
  });
}

/**
 * 删除指定服务网络拨测监控目标 Hook（Mutation）
 * 
 * 对应 `monitor.service.delete` JSON-RPC 方法。
 */
export function useDeletePingTarget() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      client.call("monitor.service.delete", { id }, methods["monitor.service.delete"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.ping })
  });
}
