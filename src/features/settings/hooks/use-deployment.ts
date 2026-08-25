import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/query-keys";
import { httpClient } from "@/shared/api/http/http-client";
import type { DeploymentMode, DeploymentListResult } from "@/shared/api/methods";

/**
 * 获取系统发布部署目标与模式列表 Hook（HTTP GET /api/v1/deployments）
 */
export function useDeployment() {
  return useQuery({
    queryKey: queryKeys.deployment,
    queryFn: () => httpClient.get<DeploymentListResult>("/api/v1/deployments")
  });
}

/**
 * 切换系统部署发布模式 Hook（HTTP POST /api/v1/deployments/switch）
 */
export function useSwitchDeployment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mode: DeploymentMode) =>
      httpClient.post("/api/v1/deployments/switch", { mode }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.deployment })
  });
}
