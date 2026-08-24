import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { methods } from "@/shared/api/methods";
import { queryKeys } from "@/shared/api/query-keys";
import { useRpc } from "@/app/providers/rpc-context";
import type { DeploymentMode } from "@/shared/api/methods";

/**
 * 获取系统发布部署目标与模式列表 Hook
 * 
 * 对应 `deployment.list` JSON-RPC 方法。
 */
export function useDeployment() {
  const { client } = useRpc();
  return useQuery({
    queryKey: queryKeys.deployment,
    queryFn: () => client.call("deployment.list", {}, methods["deployment.list"].result)
  });
}

/**
 * 切换系统部署发布模式 Hook（Mutation）
 * 
 * 对应 `deployment.switch` JSON-RPC 方法。
 */
export function useSwitchDeployment() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mode: DeploymentMode) =>
      client.call("deployment.switch", { mode }, methods["deployment.switch"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.deployment })
  });
}
