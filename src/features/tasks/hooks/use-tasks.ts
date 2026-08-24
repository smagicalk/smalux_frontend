import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { methods } from "@/shared/api/methods";
import { queryKeys } from "@/shared/api/query-keys";
import { useRpc } from "@/app/providers/rpc-context";

/**
 * 获取集群批量命令执行与分发任务列表 Hook
 * 
 * 对应 `task.list` JSON-RPC 方法。
 * 
 * @param filters 任务状态与关键词过滤
 */
export function useTasks(filters: { status?: string; search?: string } = {}) {
  const { client } = useRpc();
  return useQuery({
    queryKey: queryKeys.taskList(filters),
    queryFn: () => client.call("task.list", filters, methods["task.list"].result)
  });
}

/**
 * 获取预置常用运维任务模板列表 Hook
 * 
 * 对应 `task.template.list` JSON-RPC 方法。
 */
export function useTaskTemplates() {
  const { client } = useRpc();
  return useQuery({
    queryKey: ["task-templates"],
    queryFn: () => client.call("task.template.list", {}, methods["task.template.list"].result)
  });
}

/**
 * 下发执行远程运维指令/脚本 Hook（Mutation）
 * 
 * 对应 `task.dispatch` JSON-RPC 方法。
 * 针对高风险命令（risk === "high"）将进入待审批状态（pending），执行成功后自动刷新任务队列。
 */
export function useDispatchTask() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { serverId: string; command: string; risk: "low" | "medium" | "high"; scope: string }) =>
      client.call("task.dispatch", params, methods["task.dispatch"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tasks })
  });
}

/**
 * 管理员审批并放行高危运维任务 Hook（Mutation）
 * 
 * 对应 `task.approve` JSON-RPC 方法。
 */
export function useApproveTask() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      client.call("task.approve", { id }, methods["task.approve"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tasks })
  });
}
