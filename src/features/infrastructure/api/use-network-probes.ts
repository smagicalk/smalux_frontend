import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { HostServer } from "../types";
import {
  getServerNetworkDetails,
  getServerProbeRegions,
  type ServerNetworkDetails,
  type GlobalProbeRegion
} from "../mock/infrastructure-mock";

/**
 * Mock API: Fetch IP addressing, routing, NIC hardware and BGP peering details
 */
export async function fetchServerNetworkDetailsApi(
  server: Partial<HostServer>
): Promise<ServerNetworkDetails> {
  // Simulate lightweight RPC delay
  await new Promise((resolve) => setTimeout(resolve, 50));
  return getServerNetworkDetails(server);
}

/**
 * Mock API: Fetch current multi-region probe node latency and packet loss
 */
export async function fetchServerProbeRegionsApi(
  server: Partial<HostServer>
): Promise<GlobalProbeRegion[]> {
  // Simulate lightweight RPC delay
  await new Promise((resolve) => setTimeout(resolve, 80));
  return getServerProbeRegions(server);
}

/**
 * Mock API: Trigger an on-demand full-mesh global ping test across all 10 probe regions
 */
export async function runGlobalProbeTestApi(server: Partial<HostServer>): Promise<{
  avgLatency: number;
  minLatency: number;
  minRegion: string;
  avgLoss: string;
}> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (server.status === "offline") {
    throw new Error("全网拨测失败: 目标主机无网络响应 (All probes timed out)");
  }

  const isWarning = server.status === "warning";
  const avgLatency = isWarning ? 138.5 : 96.2;
  const minLatency = isWarning ? 28 : 16;
  const minRegion = "中国香港 (Hong Kong)";
  const avgLoss = isWarning ? "1.2%" : "0.08%";

  return {
    avgLatency,
    minLatency,
    minRegion,
    avgLoss
  };
}

/**
 * React Hook for Server Network Addressing and Global Probe Telemetry
 */
export function useServerNetworkProbes(
  server: Partial<HostServer> | null | undefined,
  _timeRange: string = "24h"
) {
  const qc = useQueryClient();
  const [isTesting, setIsTesting] = useState(false);

  // 1. Network details query
  const networkQuery = useQuery({
    queryKey: ["server-network-details", server?.id, server?.ip, server?.ipv4, server?.ipv6],
    queryFn: () => {
      if (!server) return null;
      return fetchServerNetworkDetailsApi(server);
    },
    enabled: Boolean(server?.id),
    staleTime: 5000
  });

  // 2. Probe regions query
  const probeQuery = useQuery({
    queryKey: ["server-global-probes", server?.id, server?.status],
    queryFn: () => {
      if (!server) return [];
      return fetchServerProbeRegionsApi(server);
    },
    enabled: Boolean(server?.id),
    staleTime: 4000,
    refetchInterval: 10000 // Poll every 10 seconds for probe jitter
  });

  const networkDetails: ServerNetworkDetails | null =
    networkQuery.data ?? (server ? getServerNetworkDetails(server) : null);

  const probeRegions: GlobalProbeRegion[] =
    probeQuery.data ?? (server ? getServerProbeRegions(server) : []);

  // Compute aggregate stats
  const activeProbes = probeRegions.filter((p) => p.status !== "down");
  const avgLatency = activeProbes.length > 0
    ? Math.round(activeProbes.reduce((sum, p) => sum + p.currentLatency, 0) / activeProbes.length)
    : 0;

  const minProbe = activeProbes.reduce<GlobalProbeRegion | null>(
    (min, p) => (!min || p.currentLatency < min.currentLatency ? p : min),
    null
  );

  const runGlobalTest = async () => {
    if (!server) return;
    setIsTesting(true);
    try {
      const res = await runGlobalProbeTestApi(server);
      toast.success(
        `全网拨测完成: 平均时延 ${res.avgLatency}ms · 最优 ${res.minLatency}ms (${res.minRegion}) · 丢包 ${res.avgLoss}`
      );
      qc.invalidateQueries({ queryKey: ["server-global-probes", server.id] });
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
      minLatency: minProbe?.currentLatency || 16,
      minRegion: minProbe?.name || "中国香港 (Hong Kong)",
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
