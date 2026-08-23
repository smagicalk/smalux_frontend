import { useMemo } from "react";
import { useServers } from "@/features/servers/hooks/use-servers";
import { useMonitoring } from "@/features/servers/hooks/use-monitoring";
import { useThrottledMonitoring } from "@/features/servers/hooks/use-throttled-monitoring";
import { usePingTargets } from "@/features/ping/hooks/use-ping";
import type { HostServer, AgentInstallCommand, SlaTimeRange } from "../types";
import {
  MOCK_HOST_SERVERS,
  MOCK_PING_TARGETS,
  MOCK_AGENT_INSTALL_COMMAND
} from "../mock/infrastructure-mock";

const GROUP_TAG_MAP: Record<string, string> = {
  gateway: "网关集群",
  cdn: "边缘 CDN 分发",
  core: "核心业务微服务",
  api: "核心业务微服务",
  edge: "边缘 CDN 分发",
  database: "高可用数据库",
  ha: "高可用数据库",
  cache: "Redis 缓存集群",
  queue: "消息队列 Kafka",
  ai: "AI 算力与推理",
  compute: "AI 算力与推理",
  storage: "存储与冷备节点",
  backup: "存储与冷备节点"
};

export interface ServerQueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  group?: string;
  status?: "online" | "warning" | "offline";
  sortBy?: "id" | "name" | "cpu" | "memory" | "disk";
  sortOrder?: "asc" | "desc";
}

export interface ProbeQueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  protocol?: "all" | "HTTP" | "HTTPS" | "TCP" | "ICMP";
  status?: "all" | "up" | "degraded" | "down";
  slaRange?: SlaTimeRange;
}

/**
 * Isolated infrastructure feature hook for host servers, ping probes, and agent installation.
 * Accepts server-side pagination & filter params and dispatches to RPC / Mock backend.
 */
export function useInfrastructureData(
  serverFilters: ServerQueryFilters = { page: 1, limit: 12 },
  probeFilters: ProbeQueryFilters = { page: 1, limit: 10, protocol: "all", status: "all", slaRange: "24h" }
) {
  const { data: serverData, isLoading: isLoadingServers, refetch: refetchServers } = useServers({
    page: serverFilters.page || 1,
    limit: serverFilters.limit || 12,
    search: serverFilters.search || undefined,
    status: serverFilters.status || undefined,
    group: serverFilters.group !== "all" ? serverFilters.group : undefined,
    sortBy: serverFilters.sortBy,
    sortOrder: serverFilters.sortOrder
  });

  useMonitoring();
  const liveMetricsMap = useThrottledMonitoring((latest) => latest, 1000);
  const { data: _pingData, isLoading: isLoadingPing, refetch: refetchPing } = usePingTargets();

  // 1. Transform Host Servers from Backend response
  const servers: HostServer[] = useMemo(() => {
    const realServers = serverData?.servers ?? [];
    if (!realServers || realServers.length === 0) {
      // In mock fallback, simulate server-side filtering & pagination on MOCK_HOST_SERVERS
      let list = MOCK_HOST_SERVERS.map((s) => {
        const cpuCores = s.cpuCores || (s.group.includes("AI") ? 32 : s.group.includes("数据库") ? 16 : 8);
        const memTotalGb = s.memTotalGb || (s.group.includes("AI") ? 128 : s.group.includes("数据库") ? 64 : 16);
        const memUsedGb = s.memUsedGb || +(memTotalGb * (s.memory / 100)).toFixed(1);
        const diskTotalGb = s.diskTotalGb || (s.group.includes("存储") ? 4000 : 500);
        const diskUsedGb = s.diskUsedGb || +(diskTotalGb * (s.disk / 100)).toFixed(1);
        const trafficTotalGb = s.trafficTotalGb || 10000;
        const trafficUsedGb = s.trafficUsedGb || Math.round(1500 + s.cpu * 60);
        const tcpConns = s.tcpConns || Math.round(s.cpu * 32 + 280);

        const ipv4 = s.ipv4 || s.ip;
        const ipv6 = s.ipv6 || `2402:4e00:1000::${s.id.replace("srv-", "").replace("-", ":")}`;

        return {
          ...s,
          ipv4,
          ipv6,
          cpuCores,
          memTotalGb,
          memUsedGb,
          diskTotalGb,
          diskUsedGb,
          trafficTotalGb,
          trafficUsedGb,
          tcpConns
        };
      });

      if (serverFilters.search) {
        const q = serverFilters.search.toLowerCase();
        list = list.filter(
          (s) =>
            s.id.toLowerCase().includes(q) ||
            s.name.toLowerCase().includes(q) ||
            s.ip.includes(q) ||
            (s.ipv4 && s.ipv4.includes(q)) ||
            (s.ipv6 && s.ipv6.toLowerCase().includes(q)) ||
            s.region.toLowerCase().includes(q)
        );
      }
      if (serverFilters.status && serverFilters.status !== ("all" as string)) {
        list = list.filter((s) => s.status === serverFilters.status);
      }
      if (serverFilters.group && serverFilters.group !== "all") {
        list = list.filter((s) => s.group === serverFilters.group);
      }
      if (serverFilters.sortBy) {
        const order = serverFilters.sortOrder === "desc" ? -1 : 1;
        list = [...list].sort((a, b) => {
          if (serverFilters.sortBy === "id") return a.id.localeCompare(b.id) * order;
          if (serverFilters.sortBy === "name") return a.name.localeCompare(b.name) * order;
          if (serverFilters.sortBy === "cpu") return (a.cpu - b.cpu) * order;
          if (serverFilters.sortBy === "memory") return (a.memory - b.memory) * order;
          if (serverFilters.sortBy === "disk") return (a.disk - b.disk) * order;
          return 0;
        });
      }
      const page = serverFilters.page || 1;
      const limit = serverFilters.limit || 12;
      return list.slice((page - 1) * limit, page * limit);
    }

    return realServers.map((s) => {
      const m = liveMetricsMap.get(s.id);
      const cpu = m ? Math.round(m.cpuUsage) : 20;
      const memory = m && m.memTotal > 0 ? Math.round((m.memUsed / m.memTotal) * 100) : 50;
      const disk = m && m.diskTotal > 0 ? Math.round((m.diskUsed / m.diskTotal) * 100) : 40;
      const uptime = m?.uptime ? `${Math.round(m.uptime / 86400)}天 ${Math.round((m.uptime % 86400) / 3600)}小时` : "48天 12小时";
      const load = m?.loadOne != null ? `${m.loadOne.toFixed(2)}, ${(m.loadFive ?? 0).toFixed(2)}, ${(m.loadFifteen ?? 0).toFixed(2)}` : "0.32, 0.45, 0.40";
      const networkIn = m?.netRxSpeed ? `${Math.round(m.netRxSpeed / 1_000_000)} MB/s` : "45 MB/s";
      const networkOut = m?.netTxSpeed ? `${Math.round(m.netTxSpeed / 1_000_000)} MB/s` : "68 MB/s";

      const cpuCores = 8;
      const memTotalGb = m?.memTotal ? Math.round(m.memTotal / 1_000_000_000) : 16;
      const memUsedGb = m?.memUsed ? +(m.memUsed / 1_000_000_000).toFixed(1) : +(16 * (memory / 100)).toFixed(1);
      const diskTotalGb = m?.diskTotal ? Math.round(m.diskTotal / 1_000_000_000) : 500;
      const diskUsedGb = m?.diskUsed ? +(m.diskUsed / 1_000_000_000).toFixed(1) : +(500 * (disk / 100)).toFixed(1);
      const trafficTotalGb = 10000;
      const trafficUsedGb = +(1800 + cpu * 55);
      const tcpConns = Math.round(cpu * 32 + 280);

      const mockHost = MOCK_HOST_SERVERS.find((m) => m.id === s.id || m.name.toLowerCase() === s.name.toLowerCase());
      const firstTag = s.tags?.[0]?.toLowerCase() || "";
      const matchedTag = s.tags?.find((t) => t === "测试场景分组" || t.includes("集群") || t.includes("节点"));
      const group = matchedTag || mockHost?.group || GROUP_TAG_MAP[firstTag] || "核心业务微服务";
      const ipv4 = s.ipv4 || s.publicIp || mockHost?.ip || "127.0.0.1";
      const ipv6 = s.ipv6 || mockHost?.ipv6 || (s.id ? `2402:4e00:10::${s.id.slice(-2)}` : undefined);

      return {
        id: s.id,
        name: s.name,
        ip: ipv4,
        ipv4,
        ipv6,
        region: s.region || mockHost?.region || "亚太区域",
        group,
        os: s.os || mockHost?.os || "Linux",
        arch: s.arch || mockHost?.arch || "x86_64",
        agentVersion: s.agentVersion || mockHost?.agentVersion || "1.4.2",
        status: s.status,
        cpu,
        cpuCores,
        memory,
        memTotalGb,
        memUsedGb,
        disk,
        diskTotalGb,
        diskUsedGb,
        uptime,
        load,
        networkIn,
        networkOut,
        trafficTotalGb,
        trafficUsedGb,
        tcpConns,
        note: s.note || mockHost?.note,
        price: s.price ?? mockHost?.price,
        currency: s.currency || mockHost?.currency,
        expiresAt: s.expiresAt ?? mockHost?.expiresAt,
        billingCycle: s.billingCycle || mockHost?.billingCycle,
        lastSeenAt: s.lastSeenAt || mockHost?.lastSeenAt || 0,
        enableProcessCollection: mockHost?.enableProcessCollection !== undefined ? mockHost.enableProcessCollection : (s as any).enableProcessCollection !== false,
        allowRemoteExec: mockHost?.allowRemoteExec !== undefined ? mockHost.allowRemoteExec : (s as any).allowRemoteExec !== false,
        processCollectionMode: s.processCollectionMode || mockHost?.processCollectionMode || (s.enableProcessCollection === false ? "disable_auto" : "enabled")
      };
    });
  }, [serverData, liveMetricsMap, serverFilters]);

  // Total server count & pages
  const serverTotal = serverData?.total ?? (() => {
    let list = MOCK_HOST_SERVERS;
    if (serverFilters.search) {
      const q = serverFilters.search.toLowerCase();
      list = list.filter(
        (s) =>
          s.id.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.ip.includes(q) ||
          s.region.toLowerCase().includes(q)
      );
    }
    if (serverFilters.status && serverFilters.status !== ("all" as string)) {
      list = list.filter((s) => s.status === serverFilters.status);
    }
    if (serverFilters.group && serverFilters.group !== "all") {
      list = list.filter((s) => s.group === serverFilters.group);
    }
    return list.length;
  })();

  const serverTotalPages = Math.ceil(serverTotal / (serverFilters.limit || 12)) || 1;

  // Available groups computed across full fleet
  const availableGroups = useMemo(() => {
    const map = new Map<string, number>();
    MOCK_HOST_SERVERS.forEach((s) => {
      const g = s.group || "默认分组";
      map.set(g, (map.get(g) || 0) + 1);
    });
    return Array.from(map.entries())
      .filter(([_, count]) => count > 0)
      .map(([group, count]) => ({ group, count }));
  }, []);

  // 2. Transform Ping Targets with simulated backend pagination & search
  const { paginatedProbes, probeTotal, probeTotalPages, allProbes } = useMemo(() => {
    const rawList = MOCK_PING_TARGETS;

    const filtered = rawList.filter((p) => {
      const matchSearch =
        !probeFilters.search?.trim() ||
        p.name.toLowerCase().includes(probeFilters.search.toLowerCase()) ||
        p.target.toLowerCase().includes(probeFilters.search.toLowerCase()) ||
        p.id.toLowerCase().includes(probeFilters.search.toLowerCase());
      const matchProto = !probeFilters.protocol || probeFilters.protocol === "all" || p.protocol === probeFilters.protocol;
      const matchStatus = !probeFilters.status || probeFilters.status === "all" || p.status === probeFilters.status;

      return matchSearch && matchProto && matchStatus;
    });

    const total = filtered.length;
    const limit = probeFilters.limit || 10;
    const page = probeFilters.page || 1;
    const totalPages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;

    return {
      paginatedProbes: filtered.slice(start, start + limit),
      probeTotal: total,
      probeTotalPages: totalPages,
      allProbes: rawList
    };
  }, [probeFilters]);

  const agentInstallCommand: AgentInstallCommand = MOCK_AGENT_INSTALL_COMMAND;

  return {
    servers,
    serverTotal,
    serverTotalPages,
    availableGroups,
    pingTargets: paginatedProbes,
    probeTotal,
    probeTotalPages,
    allProbes,
    agentInstallCommand,
    isLoading: isLoadingServers || isLoadingPing,
    refetchServers,
    refetchPing
  };
}
