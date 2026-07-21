import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { methods } from "@/shared/api/methods";
import { queryKeys } from "@/shared/api/query-keys";
import { useRpc } from "@/app/providers/rpc-context";
import type { DeploymentMode } from "@/shared/api/methods";

export function useDeployment() {
  const { client } = useRpc();
  return useQuery({
    queryKey: queryKeys.deployment,
    queryFn: () => client.call("deployment.list", {}, methods["deployment.list"].result)
  });
}

export function useSwitchDeployment() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mode: DeploymentMode) =>
      client.call("deployment.switch", { mode }, methods["deployment.switch"].result),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.deployment })
  });
}
