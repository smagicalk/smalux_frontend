import { useQuery } from "@tanstack/react-query";
import { methods, type AgentHardwareResult } from "@/shared/api/methods";
import { queryKeys } from "@/shared/api/query-keys";
import { useRpc } from "@/app/providers/rpc-context";

/**
 * Dedicated hook for fetching detailed hardware specifications and kernel runtime environment.
 * Backed by the standalone `agent.hardware` RPC contract.
 */
export function useServerHardware(serverId: string | undefined) {
  const { client } = useRpc();

  return useQuery({
    queryKey: queryKeys.serverHardware(serverId ?? ""),
    queryFn: async (): Promise<AgentHardwareResult> => {
      if (!serverId) throw new Error("serverId is required");
      return client.call(
        "agent.hardware",
        { serverId },
        methods["agent.hardware"].result
      );
    },
    enabled: Boolean(serverId),
    staleTime: 60_000
  });
}
