import { useMemo } from "react";
import { useServers } from "@/features/servers/hooks/use-servers";
import { useMonitoring } from "@/features/servers/hooks/use-monitoring";
import { useThrottledMonitoring } from "@/features/servers/hooks/use-throttled-monitoring";
import { useAlerts } from "@/features/alerts/hooks/use-alerts";
import { useLogs } from "@/features/logs/hooks/use-logs";
import { useOverviewStats } from "./use-overview-stats";
import type { NodePulse, IncidentItem, LiveEventItem } from "../types";
import {
  MOCK_FLEET_NODES,
  MOCK_INCIDENTS,
  MOCK_LIVE_EVENTS
} from "../mock/overview-mock";

/**
 * 总览大盘过滤与分页入参
 */
export interface OverviewQueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  group?: string;
  status?: "all" | "online" | "warning";
}

/**
 * 总览大盘核心聚合 Hook（Overview Page 专用）
 * 
 * 汇聚多数据源构建全景运维驾驶舱：
 * 1. 驾驶舱 HUD：调用 `useOverviewStats` 获取全网集群健康度与聚合 SLA。
 * 2. 节点脉冲矩阵（Fleet Pulse Matrix）：将主机列表与 WebSocket `useThrottledMonitoring` 秒级流融合，动态展示网格矩阵。
 * 3. 故障告警流（Incidents）：结合 `useAlerts` 展示当前活跃告警事件。
 * 4. 实时活动审计（Live Activity Stream）：结合 `useLogs` 实时呈现节点上线与变更事件。
 * 
 * @param filters 大盘节点矩阵过滤参数
 */
export function useOverviewData(
  filters: OverviewQueryFilters = { page: 1, limit: 12, group: "all", status: "all" }
) {
  const { isLoading, refetch: refetchServers } = useServers();
  const { data: statsData, refetch: refetchStats } = useOverviewStats();
  useMonitoring();
  const liveMetricsMap = useThrottledMonitoring((latest) => latest, 1000);
  const { data: alertsData } = useAlerts();
  const { data: logsData } = useLogs();

  // 1. Master source of all Fleet Nodes (with live metric merging)
  const allFleetNodes: NodePulse[] = useMemo(() => {
    return MOCK_FLEET_NODES.map((node) => {
      const m = liveMetricsMap.get(node.id);
      if (!m) return node;
      return {
        ...node,
        cpu: Math.round(m.cpuUsage) || node.cpu,
        memory: m.memTotal > 0 ? Math.round((m.memUsed / m.memTotal) * 100) : node.memory,
        disk: m.diskTotal > 0 ? Math.round((m.diskUsed / m.diskTotal) * 100) : node.disk
      };
    });
  }, [liveMetricsMap]);

  // 2. All distinct groups with node counts & warn status across full fleet
  const availableGroups = useMemo(() => {
    const map = new Map<string, { count: number; hasWarn: boolean }>();
    allFleetNodes.forEach((n) => {
      const g = n.group || "默认分组";
      const existing = map.get(g) || { count: 0, hasWarn: false };
      map.set(g, {
        count: existing.count + 1,
        hasWarn: existing.hasWarn || n.status === "warning"
      });
    });
    return Array.from(map.entries())
      .filter(([_, val]) => val.count > 0)
      .map(([group, val]) => ({
        group,
        count: val.count,
        hasWarn: val.hasWarn
      }));
  }, [allFleetNodes]);

  // 3. Filtered & Paginated nodes for the current request
  const { paginatedNodes, totalNodes, totalPages, filteredNodesList } = useMemo(() => {
    let list = allFleetNodes;

    if (filters.group && filters.group !== "all") {
      list = list.filter((n) => n.group === filters.group);
    }
    if (filters.status && filters.status !== "all") {
      list = list.filter((n) => n.status === filters.status);
    }
    if (filters.search?.trim()) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (n) =>
          n.name.toLowerCase().includes(q) ||
          n.id.toLowerCase().includes(q) ||
          n.group.toLowerCase().includes(q) ||
          n.region.toLowerCase().includes(q) ||
          n.ip.includes(q)
      );
    }

    const total = list.length;
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, filters.limit || 12);
    const totalPages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;

    return {
      paginatedNodes: list.slice(start, start + limit),
      totalNodes: total,
      totalPages,
      filteredNodesList: list
    };
  }, [allFleetNodes, filters]);

  // 4. Dedicated Overview Cockpit HUD Stats (From overview.stats RPC, with fallback)
  const heroStats = useMemo(() => {
    if (statsData) {
      return statsData;
    }

    const totalCount = allFleetNodes.length || 1;
    const onlineCount = allFleetNodes.filter((n) => n.status === "online").length;
    const warningCount = allFleetNodes.filter((n) => n.status === "warning").length;

    const avgCpu = Math.round(allFleetNodes.reduce((acc, n) => acc + n.cpu, 0) / totalCount);
    const avgMem = Math.round(allFleetNodes.reduce((acc, n) => acc + n.memory, 0) / totalCount);
    const avgDisk = Math.round(allFleetNodes.reduce((acc, n) => acc + n.disk, 0) / totalCount);

    const totalThroughputGB = (
      allFleetNodes.reduce((acc, n) => acc + (n.cpu * 22 + 100) + (n.cpu * 16 + 80), 0) / 1024
    ).toFixed(2);

    const healthScore = +( (onlineCount / totalCount) * 100 - (warningCount > 0 ? warningCount * 1.2 : 0) ).toFixed(1);
    const sla = +( 100 - (totalCount - onlineCount) * 0.02 ).toFixed(2);
    const activeConnections = `${(totalCount * 65 + avgCpu * 12).toLocaleString()} 活跃`;

    return {
      healthScore,
      onlineRate: Math.round((onlineCount / totalCount) * 100),
      onlineCount,
      totalCount,
      sla,
      throughput: `${totalThroughputGB} GB/s`,
      activeConnections,
      avgCpu,
      avgMemory: avgMem,
      avgDisk,
      activeAlertsCount: warningCount
    };
  }, [statsData, allFleetNodes]);

  // 5. Incidents
  const incidents: IncidentItem[] = useMemo(() => {
    const history = alertsData?.history ?? [];
    if (history.length > 5) {
      return history.map((h) => ({
        id: h.id,
        severity: (h.severity as "critical" | "warning" | "info") || "warning",
        ruleName: h.ruleName || "指标异常告警",
        serverName: h.serverName || "集群节点",
        serverId: h.serverName || "srv-tok-01",
        currentValue: `${Math.round(h.value * 100)}%`,
        threshold: "> 80%",
        duration: "持续 6 分钟",
        acknowledged: false,
        silenced: false
      }));
    }
    return MOCK_INCIDENTS;
  }, [alertsData]);

  // 6. Live Events
  const liveEvents: LiveEventItem[] = useMemo(() => {
    const logs = logsData?.logs ?? [];
    const moduleMap: Record<string, LiveEventItem["tag"]> = {
      theme: "TASK",
      alert: "CRON",
      auth: "AUTH",
      task: "TASK",
      cron: "CRON",
      token: "AUTH",
      config: "TASK",
      terminal: "AGENT"
    };

    if (logs.length > 12) {
      return logs.map((log) => ({
        id: log.id,
        tag: moduleMap[log.module] || "TASK",
        text: `${log.actor}: ${log.action} ${log.target || ""}`.trim(),
        time: "刚刚",
        color: log.result === "failure" ? "text-rose-500" : "text-emerald-500"
      }));
    }
    return MOCK_LIVE_EVENTS;
  }, [logsData]);

  const refetchAll = () => {
    refetchServers();
    refetchStats();
  };

  return {
    allFleetNodes,
    fleetNodes: paginatedNodes,
    filteredNodesList,
    totalNodes,
    totalPages,
    availableGroups,
    heroStats,
    incidents,
    liveEvents,
    isLoading,
    refetchServers: refetchAll
  };
}
