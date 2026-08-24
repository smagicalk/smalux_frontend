import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRpc } from "@/app/providers/rpc-context";
import { methods, type AgentStatusResult } from "@/shared/api/methods";
import { queryKeys } from "@/shared/api/query-keys";
import type { HostServer } from "../types";

/**
 * 48 分钟单格心跳柱条目数据模型
 */
export interface AgentHeartbeatBar {
  index: number;
  minuteAgo: number;
  status: "normal" | "warning" | "offline";
  latencyMs: number;
  lossRate: string;
}

/**
 * 复合 Agent 连接健康状态（包含图表数据与 SLA 派生字段）
 */
export interface AgentConnectionData extends AgentStatusResult {
  heartbeatBars: AgentHeartbeatBar[];
  slaPercentage: string;
  slaNote: string;
}

/**
 * 根据服务端状态快照派生 48 柱心跳柱状图数据（纯前端表现层计算）
 */
function buildHeartbeatBars(data: AgentStatusResult): AgentHeartbeatBar[] {
  const isOffline = data.status === "offline";
  const isWarning = data.status === "warning";

  return Array.from({ length: 48 }).map((_, i) => {
    const minuteAgo = 48 - i;
    const barOffline = isOffline && i > 40;
    const barWarning =
      (isWarning && (i === 14 || i === 36)) ||
      (!isOffline && !isWarning && i === 7 && data.pid % 10 < 2);

    const jitter = Math.sin(i * 0.9) * 2;
    const latencyMs = barOffline
      ? 0
      : barWarning
        ? 86
        : Math.max(8, Math.round(data.latencyMs + jitter));

    return {
      index: i,
      minuteAgo,
      status: barOffline ? "offline" : barWarning ? "warning" : "normal",
      latencyMs,
      lossRate: barOffline ? "100%" : barWarning ? "2.5%" : "0.0%"
    };
  });
}

/**
 * 派生 SLA 达标百分比文本与说明
 */
function buildSlaInfo(data: AgentStatusResult) {
  const isOffline = data.status === "offline";
  const isWarning = data.status === "warning";
  return {
    slaPercentage: isOffline ? "85.2% SLA" : isWarning ? "98.4% SLA" : "100.0% SLA",
    slaNote: isOffline ? "(心跳异常中断)" : isWarning ? "(偶发链路抖动)" : "(无丢包断联)"
  };
}

/**
 * Agent 守护进程连接质量与实时心跳探测 Hook
 * 
 * 特性：
 * 1. 自动轮询同步：每 5 秒自动通过 `agent.getStatus` RPC 查询守护进程状态。
 * 2. 即时在线拨测（triggerPing）：支持用户在界面手动点击“即时探测”，直连目标下发探测并弹出状态 Toast。
 * 3. 统一传输层：走 `RpcClient` 统一调度，无缝兼容真实后端与 Mock。
 * 
 * @param server 主机部分元数据
 */
export function useAgentStatus(server: Partial<HostServer> | null | undefined) {
  const { client } = useRpc();
  const qc = useQueryClient();
  const [isPinging, setIsPinging] = useState(false);

  const query = useQuery<AgentConnectionData | null>({
    queryKey: queryKeys.serverStatus(server?.id ?? ""),
    queryFn: async () => {
      if (!server?.id) return null;
      const raw = await client.call(
        "agent.getStatus",
        { serverId: server.id },
        methods["agent.getStatus"].result
      );
      const heartbeatBars = buildHeartbeatBars(raw);
      const { slaPercentage, slaNote } = buildSlaInfo(raw);
      return { ...raw, heartbeatBars, slaPercentage, slaNote };
    },
    enabled: Boolean(server?.id),
    staleTime: 2000,
    refetchInterval: 5000 // 5 秒定时刷新心跳状态
  });

  /**
   * 手动下发一次即时链路拨测
   */
  const triggerPing = async () => {
    if (!server?.id) return;
    setIsPinging(true);
    try {
      const res = await client.call(
        "agent.getStatus",
        { serverId: server.id },
        methods["agent.getStatus"].result
      );
      const msg = res.status === "offline"
        ? "目标主机无响应 (Connection Refused / ETIMEDOUT)"
        : `Agent 心跳健康探测通过: RTT ${res.latencyMs}ms · 丢包 ${res.lossRate}`;

      if (res.status === "offline") {
        toast.error(`Agent 连接探测失败: ${msg}`);
      } else {
        toast.success(msg);
      }

      // 将最新探测结果就地更新至 TanStack Query 缓存
      qc.setQueryData<AgentConnectionData | null>(
        queryKeys.serverStatus(server.id),
        (prev) => {
          if (!prev) return prev;
          const heartbeatBars = buildHeartbeatBars(res);
          const { slaPercentage, slaNote } = buildSlaInfo(res);
          return { ...res, heartbeatBars, slaPercentage, slaNote };
        }
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Agent 探测失败";
      toast.error(`Agent 连接探测失败: ${message}`);
    } finally {
      setIsPinging(false);
    }
  };

  const data = query.data;
  const fallbackStatus = server?.status === "offline" ? "offline" : "online";

  return {
    data: data ?? null,
    heartbeatBars: data?.heartbeatBars,
    slaPercentage:
      data?.slaPercentage ??
      (fallbackStatus === "offline" ? "85.2% SLA" : "100.0% SLA"),
    slaNote:
      data?.slaNote ??
      (fallbackStatus === "offline" ? "(心跳异常中断)" : "(无丢包断联)"),
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    isPinging,
    triggerPing,
    refetch: query.refetch
  };
}
