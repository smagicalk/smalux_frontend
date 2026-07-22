import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  methods,
  type AgentRegisterParams,
  type AgentUpdateParams
} from "@/shared/api/methods";
import { queryKeys } from "@/shared/api/query-keys";
import { useRpc } from "@/app/providers/rpc-context";

export interface ServerListFilters {
  region?: string;
  status?: "online" | "warning" | "offline";
  search?: string;
}

/**
 * Fetch the server fleet. Wraps the `agent.list` RPC in a TanStack Query so
 * pages get caching, loading and refetch for free. The transport (mock/ws)
 * is chosen by runtime config — this hook is identical in both.
 */
export function useServers(filters: ServerListFilters = {}) {
  const { client } = useRpc();
  return useQuery({
    queryKey: queryKeys.servers(filters),
    queryFn: () =>
      client.call(
        "agent.list",
        filters,
        methods["agent.list"].result
      )
  });
}

/**
 * Register a new server agent. Invalidates every `agent.list` query variant so
 * the fleet list refreshes regardless of which filter view is mounted.
 */
export function useRegisterServer() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: AgentRegisterParams) =>
      client.call("agent.register", params, methods["agent.register"].result),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["servers"] });
    }
  });
}

/** Persist operator-owned billing metadata and refresh every server list. */
export function useUpdateServer() {
  const { client } = useRpc();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: AgentUpdateParams) =>
      client.call("agent.update", params, methods["agent.update"].result),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["servers"] });
    }
  });
}
