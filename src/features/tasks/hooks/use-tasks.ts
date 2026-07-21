import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { methods } from "@/shared/api/methods";
import { queryKeys } from "@/shared/api/query-keys";
import { useRpc } from "@/app/providers/rpc-context";

export function useTasks(filters: { status?: string; search?: string } = {}) {
  const { client } = useRpc();
  return useQuery({
    queryKey: queryKeys.taskList(filters),
    queryFn: () => client.call("task.list", filters, methods["task.list"].result)
  });
}

export function useTaskTemplates() {
  const { client } = useRpc();
  return useQuery({
    queryKey: ["task-templates"],
    queryFn: () => client.call("task.template.list", {}, methods["task.template.list"].result)
  });
}

export function useDispatchTask() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { serverId: string; command: string; risk: "low" | "medium" | "high"; scope: string }) =>
      client.call("task.dispatch", params, methods["task.dispatch"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tasks })
  });
}

export function useApproveTask() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      client.call("task.approve", { id }, methods["task.approve"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tasks })
  });
}
