import { useQuery } from "@tanstack/react-query";
import { methods, type OverviewStatsResult } from "@/shared/api/methods";
import { queryKeys } from "@/shared/api/query-keys";
import { useRpc } from "@/app/providers/rpc-context";

/**
 * 获取总览页驾驶舱核心汇总指标 Hook（Cockpit HUD）
 * 
 * 封装 `overview.stats` JSON-RPC 方法。
 * 查询内容：集群健康评分、全网 24h SLA、在线/总节点数、全集群实时总吞吐量、全网活跃并发连接数、全局平均 CPU/内存/磁盘占用等。
 * 配置 5 秒自动轮询（refetchInterval: 5000），确保驾驶舱抬头显示器数据常态保鲜。
 */
export function useOverviewStats() {
  const { client } = useRpc();
  return useQuery<OverviewStatsResult>({
    queryKey: queryKeys.overviewStats,
    queryFn: () =>
      client.call(
        "overview.stats",
        {},
        methods["overview.stats"].result
      ),
    refetchInterval: 5000 // 每 5 秒自动刷新驾驶舱指标
  });
}
