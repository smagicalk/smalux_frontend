import { useQuery } from "@tanstack/react-query";
import type { AgentHardwareResult } from "@/shared/api/methods";
import { queryKeys } from "@/shared/api/query-keys";
import { httpClient } from "@/shared/api/http/http-client";

/**
 * 获取服务器底层硬件规格与 Linux 内核环境详情 Hook（HTTP GET /api/v1/servers/:id/hardware）
 * 
 * @param serverId 主机 ID
 */
export function useServerHardware(serverId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.serverHardware(serverId ?? ""),
    queryFn: async (): Promise<AgentHardwareResult> => {
      if (!serverId) throw new Error("serverId is required");
      return httpClient.get<AgentHardwareResult>(`/api/v1/servers/${serverId}/hardware`);
    },
    enabled: Boolean(serverId),
    staleTime: 60_000 // 硬件信息变动频率极低，缓存 1 分钟
  });
}
