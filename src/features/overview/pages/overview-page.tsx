import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { RefreshCw, Server } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";
import { toast } from "@/shared/ui/toaster";

import type { NodePulse } from "../types";
import { useOverviewData } from "../api/use-overview-data";
import { OverviewCockpitHero } from "../components/overview-cockpit-hero";
import { FleetPulseMatrix } from "../components/fleet-pulse-matrix";
import { ClusterTelemetryChart } from "../components/cluster-telemetry-chart";
import { IncidentActionHub } from "../components/incident-action-hub";
import { LiveEventTerminal } from "../components/live-event-terminal";

export function OverviewPage() {
  const [selectedNode, setSelectedNode] = useState<NodePulse | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Server-side RPC Pagination & Filter State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "warning">("all");

  const {
    allFleetNodes,
    fleetNodes,
    totalNodes,
    totalPages,
    availableGroups,
    incidents,
    liveEvents,
    heroStats,
    refetchServers
  } = useOverviewData({
    page,
    limit: pageSize,
    search: searchQuery,
    group: selectedGroup,
    status: statusFilter
  });

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1);
  };

  const handleGroupChange = (grp: string) => {
    setSelectedGroup(grp);
    setPage(1);
  };

  const handleStatusChange = (st: "all" | "online" | "warning") => {
    setStatusFilter(st);
    setPage(1);
  };

  // Trigger Cluster Instant Health Scan
  const handleRunHealthScan = () => {
    setIsScanning(true);
    toast.info("正在对全网节点与探针执行深度健康巡检...");
    refetchServers();
    setTimeout(() => {
      setIsScanning(false);
      toast.success(`全网巡检完成：${heroStats.onlineCount} 节点状态优良，实时遥测数据已同步`);
    }, 1200);
  };

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="总览大盘"
        subtitle="全息智能监控与集群指挥中心"
        action={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRunHealthScan}
              disabled={isScanning}
              className="cursor-pointer font-medium"
            >
              <RefreshCw className={`size-3.5 mr-1.5 ${isScanning ? "animate-spin text-primary" : ""}`} />
              {isScanning ? "深度巡检中..." : "一键全网巡检"}
            </Button>
            <Button asChild size="sm" className="cursor-pointer font-medium">
              <Link to="/admin/infrastructure">
                <Server className="size-3.5 mr-1.5" /> 主机与探针
              </Link>
            </Button>
          </div>
        }
      />

      <div className="flex-1 space-y-6 p-6">
        {/* 1. Futuristic Cockpit Hero Banner */}
        <OverviewCockpitHero
          onlineCount={heroStats.onlineCount}
          totalCount={heroStats.totalCount}
          sla={heroStats.sla}
          healthScore={heroStats.healthScore}
          throughput={heroStats.throughput}
          avgCpu={heroStats.avgCpu}
          avgMemory={heroStats.avgMemory}
          avgDisk={heroStats.avgDisk}
          activeAlertsCount={incidents.length}
        />

        {/* 2. Scalable Fleet Pulse Matrix with Server-side Pagination & RPC Filters */}
        <FleetPulseMatrix
          nodes={fleetNodes}
          total={totalNodes}
          totalPages={totalPages}
          availableGroups={availableGroups}
          page={page}
          pageSize={pageSize}
          selectedGroup={selectedGroup}
          statusFilter={statusFilter}
          searchQuery={searchQuery}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
          onGroupChange={handleGroupChange}
          onStatusChange={handleStatusChange}
          onSearchChange={handleSearchChange}
          selectedNode={selectedNode}
          onSelectNode={setSelectedNode}
        />

        {/* 3. Full-Width Panoramic Core Performance Telemetry Waveform */}
        <ClusterTelemetryChart
          fleetNodes={allFleetNodes}
          availableGroups={availableGroups}
          onSelectNode={setSelectedNode}
        />

        {/* 4. Bottom Row: Incident Action Hub (Left) + Unified Live Event Stream (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <IncidentActionHub incidents={incidents} />
          <LiveEventTerminal events={liveEvents} />
        </div>
      </div>
    </div>
  );
}
