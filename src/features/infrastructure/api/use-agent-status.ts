import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { HostServer } from "../types";
import { getServerAgentStatus, type ServerAgentStatus } from "../mock/infrastructure-mock";

export interface AgentHeartbeatBar {
  index: number;
  minuteAgo: number;
  status: "normal" | "warning" | "offline";
  latencyMs: number;
  lossRate: string;
}

export interface AgentConnectionData extends ServerAgentStatus {
  heartbeatBars: AgentHeartbeatBar[];
  slaPercentage: string;
  slaNote: string;
}

/**
 * Mock API: Fetch detailed Agent connection telemetry & heartbeat history
 */
export async function fetchAgentStatusApi(server: Partial<HostServer>): Promise<AgentConnectionData> {
  // Simulate lightweight async RPC roundtrip
  await new Promise((resolve) => setTimeout(resolve, 60));

  const baseStatus = getServerAgentStatus(server);
  const isOffline = baseStatus.status === "offline";
  const isWarning = baseStatus.status === "warning";

  // Generate 48 discrete 60-minute interval heartbeat sample blocks
  const heartbeatBars: AgentHeartbeatBar[] = Array.from({ length: 48 }).map((_, i) => {
    const minuteAgo = 48 - i;
    const barOffline = isOffline && i > 40;
    const barWarning = (isWarning && (i === 14 || i === 36)) || (!isOffline && !isWarning && i === 7 && server.id?.includes("ai"));

    const jitter = Math.sin(i * 0.9) * 2;
    const latencyMs = barOffline ? 0 : barWarning ? 86 : Math.max(8, Math.round(baseStatus.latencyMs + jitter));

    return {
      index: i,
      minuteAgo,
      status: barOffline ? "offline" : barWarning ? "warning" : "normal",
      latencyMs,
      lossRate: barOffline ? "100%" : barWarning ? "2.5%" : "0.0%"
    };
  });

  const slaPercentage = isOffline ? "85.2% SLA" : isWarning ? "98.4% SLA" : "100.0% SLA";
  const slaNote = isOffline ? "(心跳异常中断)" : isWarning ? "(偶发链路抖动)" : "(无丢包断联)";

  return {
    ...baseStatus,
    heartbeatBars,
    slaPercentage,
    slaNote
  };
}

/**
 * Mock API: Trigger an on-demand heartbeat ping probe
 */
export async function pingAgentHeartbeatApi(server: Partial<HostServer>): Promise<{
  success: boolean;
  latencyMs: number;
  lossRate: string;
  timestamp: number;
}> {
  // Simulate active network probe roundtrip
  await new Promise((resolve) => setTimeout(resolve, 280));

  const isOffline = server.status === "offline";
  if (isOffline) {
    throw new Error("目标主机无响应 (Connection Refused / ETIMEDOUT)");
  }

  const baseLatency = server.cpu ? Math.max(8, (server.cpu % 20) + 8) : 14;
  const latencyMs = Math.round(baseLatency + (Math.random() * 2 - 1));

  return {
    success: true,
    latencyMs,
    lossRate: "0%",
    timestamp: Date.now()
  };
}

/**
 * React Hook for Agent Connection Status with Live Auto-Refresh & On-Demand Ping
 */
export function useAgentStatus(server: Partial<HostServer> | null | undefined) {
  const qc = useQueryClient();
  const [isPinging, setIsPinging] = useState(false);

  const query = useQuery({
    queryKey: ["agent-connection-status", server?.id, server?.status, server?.allowRemoteExec],
    queryFn: () => {
      if (!server) return null;
      return fetchAgentStatusApi(server);
    },
    enabled: Boolean(server?.id),
    staleTime: 2000,
    refetchInterval: 5000 // Poll every 5 seconds to simulate continuous stream telemetry
  });

  const triggerPing = async () => {
    if (!server) return;
    setIsPinging(true);
    try {
      const res = await pingAgentHeartbeatApi(server);
      toast.success(`Agent 心跳健康探测通过: RTT ${res.latencyMs}ms · 丢包 ${res.lossRate}`);
      qc.invalidateQueries({ queryKey: ["agent-connection-status", server.id] });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Agent 探测失败";
      toast.error(`Agent 连接探测失败: ${message}`);
    } finally {
      setIsPinging(false);
    }
  };

  return {
    data: query.data ?? (server ? getServerAgentStatus(server) : null),
    heartbeatBars: query.data?.heartbeatBars,
    slaPercentage: query.data?.slaPercentage || (server?.status === "offline" ? "85.2% SLA" : "100.0% SLA"),
    slaNote: query.data?.slaNote || (server?.status === "offline" ? "(心跳异常中断)" : "(无丢包断联)"),
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    isPinging,
    triggerPing,
    refetch: query.refetch
  };
}
