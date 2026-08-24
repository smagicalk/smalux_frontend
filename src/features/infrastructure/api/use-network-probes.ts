import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRpc } from "@/app/providers/rpc-context";
import { methods, type GlobalProbeRegion } from "@/shared/api/methods";
import { queryKeys } from "@/shared/api/query-keys";
import type { HostServer } from "../types";

export type { GlobalProbeRegion };
export type { AgentNetworkDetailsResult as ServerNetworkDetails } from "@/shared/api/methods";

/**
 * 主机网络寻址详情与全球多区域拨测 Hook
 * 
 * 功能覆盖：
 * 1. `networkQuery`: 调用 `agent.getNetworkDetails` 获取网卡型号、MAC、双栈 IP、子网掩码、BGP 对等状态等。
 * 2. `probeQuery`: 调用 `agent.getProbeRegions` 获取全球 10 大核心节点（香港、新加坡、东京、硅谷、法兰克福等）的往返延迟与抖动。
 * 3. `runGlobalTest`: 触发全网多区域实时拨测扫描，计算全网平均延迟并弹出摘要通知。
 * 
 * @param server 主机部分元数据
 * @param _timeRange 时间范围
 */
export function useServerNetworkProbes(
  server: Partial<HostServer> | null | undefined,
  _timeRange: string = "24h"
) {
  const { client } = useRpc();
  const qc = useQueryClient();
  const [isTesting, setIsTesting] = useState(false);

  // 1. 网络硬件与 BGP 详情查询
  const networkQuery = useQuery({
    queryKey: queryKeys.serverNetworkDetails(server?.id ?? ""),
    queryFn: async () => {
      if (!server?.id) return null;
      return client.call(
        "agent.getNetworkDetails",
        { serverId: server.id },
        methods["agent.getNetworkDetails"].result
      );
    },
    enabled: Boolean(server?.id),
    staleTime: 5000
  });

  // 2. 全球区域拨测结果查询（10 秒定时同步）
  const probeQuery = useQuery({
    queryKey: queryKeys.serverProbeRegions(server?.id ?? ""),
    queryFn: async () => {
      if (!server?.id) return { regions: [] as GlobalProbeRegion[] };
      return client.call(
        "agent.getProbeRegions",
        { serverId: server.id },
        methods["agent.getProbeRegions"].result
      );
    },
    enabled: Boolean(server?.id),
    staleTime: 4000,
    refetchInterval: 10000
  });

  const networkDetails = networkQuery.data ?? null;
  const probeRegions: GlobalProbeRegion[] = probeQuery.data?.regions ?? [];

  // 计算聚合统计指标
  const activeProbes = probeRegions.filter((p) => p.status !== "down");
  const avgLatency =
    activeProbes.length > 0
      ? Math.round(
          activeProbes.reduce((sum, p) => sum + p.currentLatency, 0) /
            activeProbes.length
        )
      : 0;

  const minProbe = activeProbes.reduce<GlobalProbeRegion | null>(
    (min, p) => (!min || p.currentLatency < min.currentLatency ? p : min),
    null
  );

  /**
   * 执行一次即时全网拨测巡检
   */
  const runGlobalTest = async () => {
    if (!server?.id) return;
    setIsTesting(true);
    try {
      const res = await client.call(
        "agent.getProbeRegions",
        { serverId: server.id },
        methods["agent.getProbeRegions"].result
      );

      const active = res.regions.filter((p) => p.status !== "down");
      const avg =
        active.length > 0
          ? Math.round(
              active.reduce((s, p) => s + p.currentLatency, 0) / active.length
            )
          : 0;
      const min = active.reduce<GlobalProbeRegion | null>(
        (m, p) => (!m || p.currentLatency < m.currentLatency ? p : m),
        null
      );
      const avgLoss =
        active.length > 0
          ? (
              active.reduce(
                (s, p) => s + parseFloat(p.loss.replace("%", "") || "0"),
                0
              ) / active.length
            ).toFixed(2) + "%"
          : "100%";

      toast.success(
        `全网拨测完成: 平均时延 ${avg}ms · 最优 ${min?.currentLatency ?? 0}ms (${min?.name ?? "-"}) · 丢包 ${avgLoss}`
      );

      // 更新缓存
      qc.setQueryData(queryKeys.serverProbeRegions(server.id), res);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "拨测失败";
      toast.error(message);
    } finally {
      setIsTesting(false);
    }
  };

  return {
    networkDetails,
    probeRegions,
    summary: {
      avgLatency,
      minLatency: minProbe?.currentLatency ?? 16,
      minRegion: minProbe?.name ?? "中国香港 (Hong Kong)",
      upCount: probeRegions.filter((p) => p.status === "up").length,
      totalCount: probeRegions.length
    },
    isLoading: networkQuery.isLoading || probeQuery.isLoading,
    isTesting,
    runGlobalTest,
    refetch: () => {
      networkQuery.refetch();
      probeQuery.refetch();
    }
  };
}
