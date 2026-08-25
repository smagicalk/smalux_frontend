import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  methods,
  type AgentListParams,
  type AgentRegisterParams,
  type AgentUpdateParams
} from "@/shared/api/methods";
import { queryKeys } from "@/shared/api/query-keys";
import { useRpc } from "@/app/providers/rpc-context";

export type ServerListFilters = AgentListParams;

/**
 * 获取集群服务器节点列表 Hook
 * 
 * 封装 `agent.list` JSON-RPC 方法并集成 TanStack Query，自动享有数据缓存、Loading 状态和条件重取能力。
 * 底层 Transport 自动由全局 RuntimeConfig 决定，Mock / WS / HTTP 无感自适应。
 * 
 * @param filters 过滤与分页参数（如地域、状态、分组、关键词、分页等）
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
 * 注册/接入新服务器节点 Hook（Mutation）
 * 
 * 执行成功后自动失效所有服务器列表缓存，触发全页面无缝自动重载。
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

/**
 * 更新节点财务账单与基础元数据 Hook（Mutation）
 */
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
