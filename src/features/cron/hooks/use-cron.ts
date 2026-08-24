import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { methods } from "@/shared/api/methods";
import { queryKeys } from "@/shared/api/query-keys";
import { useRpc } from "@/app/providers/rpc-context";

/**
 * 获取集群分布式定时任务（Cron）列表 Hook
 * 
 * 对应 `cron.list` JSON-RPC 方法。
 */
export function useCrons() {
  const { client } = useRpc();
  return useQuery({
    queryKey: queryKeys.cron,
    queryFn: () => client.call("cron.list", {}, methods["cron.list"].result)
  });
}

/**
 * 新增定时任务 Hook（Mutation）
 * 
 * 对应 `cron.create` JSON-RPC 方法。
 */
export function useCreateCron() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; serverId: string; expression: string; command: string }) =>
      client.call("cron.create", params, methods["cron.create"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cron })
  });
}

/**
 * 更新/编辑定时任务 Hook（Mutation）
 * 
 * 对应 `cron.update` JSON-RPC 方法。
 */
export function useUpdateCron() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; name: string; serverId: string; expression: string; command: string }) =>
      client.call("cron.update", params, methods["cron.update"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cron })
  });
}

/**
 * 启用/禁用定时任务 Hook（Mutation）
 * 
 * 对应 `cron.toggle` JSON-RPC 方法。
 */
export function useToggleCron() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; enabled: boolean }) =>
      client.call("cron.toggle", params, methods["cron.toggle"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cron })
  });
}

/**
 * 删除指定定时任务 Hook（Mutation）
 * 
 * 对应 `cron.delete` JSON-RPC 方法。
 */
export function useDeleteCron() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      client.call("cron.delete", { id }, methods["cron.delete"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.cron })
  });
}
