import { useQuery } from "@tanstack/react-query";
import { methods, type AgentHardwareResult } from "@/shared/api/methods";
import { queryKeys } from "@/shared/api/query-keys";
import { useRpc } from "@/app/providers/rpc-context";

/**
 * 获取服务器底层硬件规格与 Linux 内核环境详情 Hook
 * 
 * 基于独立契约 `agent.hardware` JSON-RPC 方法。
 * 查询结果包含：CPU 物理型号/指令集、内存代际与规格、NVMe/SSD 存储总线、内核版本与网络 BBR 特性、虚拟化层形态等。
 * 
 * @param serverId 主机 ID
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
    staleTime: 60_000 // 硬件信息变动频率极低，缓存 1 分钟
  });
}
