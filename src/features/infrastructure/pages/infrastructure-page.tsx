import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { Server, Activity, Plus, RefreshCw, Terminal } from "lucide-react";
import { PageHeader } from "@/shared/ui/page-header";
import { Button } from "@/shared/ui/button";
import { toast } from "@/shared/ui/toaster";

import type { HostServer, SlaTimeRange } from "../types";
import { useInfrastructureData } from "../api/use-infrastructure-api";
import { HostServersView } from "../components/host-servers-view";
import { PingProbesView } from "../components/ping-probes-view";
import { AgentInstallDialog } from "../components/agent-install-dialog";
import { CreateProbeDialog } from "../components/create-probe-dialog";

export function InfrastructurePage() {
  const navigate = useNavigate();
  const location = useLocation();

  // 兼容老路由或外链带参数 ?server=xxx 直达详情页
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(location.search);
      const target = searchParams.get("server") || searchParams.get("serverId");
      if (target) {
        navigate({
          to: "/admin/infrastructure/servers/$serverId",
          params: { serverId: target }
        });
      }
    } catch {}
  }, [location.search, navigate]);

  const [activeTab, setActiveTab] = useState<"servers" | "ping">("servers");
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [probeDialogOpen, setProbeDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Server-side RPC Pagination & Filter State for Servers
  const [serverPage, setServerPage] = useState(1);
  const [serverPageSize, setServerPageSize] = useState(12);
  const [serverSearch, setServerSearch] = useState("");
  const [serverStatus, setServerStatus] = useState<"all" | "online" | "warning" | "offline">("all");
  const [serverGroup, setServerGroup] = useState("all");
  const [serverSortBy, setServerSortBy] = useState<"id" | "name" | "cpu" | "memory" | "disk">("name");
  const [serverSortOrder, setServerSortOrder] = useState<"asc" | "desc">("asc");

  // Server-side RPC Pagination & Filter State for Probes
  const [probePage, setProbePage] = useState(1);
  const [probePageSize, setProbePageSize] = useState(10);
  const [probeSearch, setProbeSearch] = useState("");
  const [probeProtocol, setProbeProtocol] = useState<"all" | "HTTP" | "HTTPS" | "TCP" | "ICMP">("all");
  const [probeStatus, setProbeStatus] = useState<"all" | "up" | "degraded" | "down">("all");
  const [probeSlaRange, setProbeSlaRange] = useState<SlaTimeRange>("24h");

  const {
    servers,
    serverTotal,
    serverTotalPages,
    availableGroups,
    pingTargets,
    probeTotal,
    probeTotalPages,
    allProbes,
    agentInstallCommand,
    isLoading,
    refetchServers,
    refetchPing
  } = useInfrastructureData(
    {
      page: serverPage,
      limit: serverPageSize,
      search: serverSearch,
      status: serverStatus === "all" ? undefined : serverStatus,
      group: serverGroup,
      sortBy: serverSortBy,
      sortOrder: serverSortOrder
    },
    {
      page: probePage,
      limit: probePageSize,
      search: probeSearch,
      protocol: probeProtocol,
      status: probeStatus,
      slaRange: probeSlaRange
    }
  );

  const handleSelectServer = (server: HostServer) => {
    navigate({
      to: "/admin/infrastructure/servers/$serverId",
      params: { serverId: server.id }
    });
  };

  const handleServerSortChange = (field: "id" | "name" | "cpu" | "memory" | "disk") => {
    if (serverSortBy === field) {
      setServerSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setServerSortBy(field);
      setServerSortOrder("desc");
    }
    setServerPage(1);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    refetchServers();
    refetchPing();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("全网主机与探针数据已同步刷新");
    }, 600);
  };

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="基础设施与探针管理"
        subtitle="全球多区域计算节点纳管、健康度排查与分布式拨测探针"
        action={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="cursor-pointer font-medium"
            >
              <RefreshCw className={`size-3.5 mr-1.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
              {isRefreshing ? "正在刷新..." : "全网刷新"}
            </Button>
            {activeTab === "servers" ? (
              <Button
                size="sm"
                onClick={() => setAgentDialogOpen(true)}
                className="cursor-pointer font-medium"
              >
                <Terminal className="size-3.5 mr-1.5" /> 一键安装 Agent
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => setProbeDialogOpen(true)}
                className="cursor-pointer font-medium"
              >
                <Plus className="size-3.5 mr-1.5" /> 新建拨测探针
              </Button>
            )}
          </div>
        }
      />

      <div className="flex-1 space-y-5 p-6">
        {/* Tab Switcher */}
        <div className="flex items-center gap-1 rounded-xl border border-border/80 bg-muted/40 p-1 w-fit text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("servers")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-semibold transition-colors cursor-pointer ${
              activeTab === "servers"
                ? "bg-card text-foreground shadow-2xs border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Server className="size-4 text-primary" />
            <span>主机集群 ({serverTotal})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ping")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-semibold transition-colors cursor-pointer ${
              activeTab === "ping"
                ? "bg-card text-foreground shadow-2xs border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Activity className="size-4 text-emerald-400" />
            <span>服务拨测与探针 ({probeTotal})</span>
          </button>
        </div>

        {/* View Content with Server-side Pagination & RPC Filtering */}
        {activeTab === "servers" ? (
          <HostServersView
            servers={servers}
            total={serverTotal}
            totalPages={serverTotalPages}
            availableGroups={availableGroups}
            page={serverPage}
            pageSize={serverPageSize}
            searchQuery={serverSearch}
            statusFilter={serverStatus}
            selectedGroup={serverGroup}
            sortBy={serverSortBy}
            sortOrder={serverSortOrder}
            onPageChange={setServerPage}
            onPageSizeChange={(newSize) => {
              setServerPageSize(newSize);
              setServerPage(1);
            }}
            onSearchChange={(val) => {
              setServerSearch(val);
              setServerPage(1);
            }}
            onStatusFilterChange={(st) => {
              setServerStatus(st);
              setServerPage(1);
            }}
            onGroupChange={(grp) => {
              setServerGroup(grp);
              setServerPage(1);
            }}
            onSortChange={handleServerSortChange}
            onSelectServer={handleSelectServer}
          />
        ) : (
          <PingProbesView
            probes={pingTargets}
            total={probeTotal}
            totalPages={probeTotalPages}
            allProbes={allProbes}
            page={probePage}
            pageSize={probePageSize}
            searchQuery={probeSearch}
            protocolFilter={probeProtocol}
            statusFilter={probeStatus}
            slaRange={probeSlaRange}
            onPageChange={setProbePage}
            onPageSizeChange={(newSize) => {
              setProbePageSize(newSize);
              setProbePage(1);
            }}
            onSearchChange={(val) => {
              setProbeSearch(val);
              setProbePage(1);
            }}
            onProtocolChange={(proto) => {
              setProbeProtocol(proto);
              setProbePage(1);
            }}
            onStatusChange={(st) => {
              setProbeStatus(st);
              setProbePage(1);
            }}
            onSlaRangeChange={setProbeSlaRange}
            onOpenCreateProbe={() => setProbeDialogOpen(true)}
          />
        )}
      </div>

      {/* Agent Quick Install Dialog */}
      <AgentInstallDialog
        open={agentDialogOpen}
        onOpenChange={setAgentDialogOpen}
        installCommand={agentInstallCommand}
      />

      {/* Create Ping Probe Dialog */}
      <CreateProbeDialog
        open={probeDialogOpen}
        onOpenChange={setProbeDialogOpen}
      />
    </div>
  );
}
