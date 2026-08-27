import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { RefreshCw, Terminal } from "lucide-react";
import { PageHeader } from "@/shared/ui/page-header";
import { Button } from "@/shared/ui/button";
import { toast } from "@/shared/ui/toaster";

import type { HostServer } from "../types";
import { useInfrastructureData } from "../api/use-infrastructure-api";
import { HostServersView } from "../components/host-servers-view";
import { AgentInstallDialog } from "../components/agent-install-dialog";

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

  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Server-side RPC Pagination & Filter State for Servers
  const [serverPage, setServerPage] = useState(1);
  const [serverPageSize, setServerPageSize] = useState(12);
  const [serverSearch, setServerSearch] = useState("");
  const [serverStatus, setServerStatus] = useState<"all" | "online" | "warning" | "offline">("all");
  const [serverGroup, setServerGroup] = useState("all");
  const [serverSortBy, setServerSortBy] = useState<"id" | "name" | "cpu" | "memory" | "disk">("name");
  const [serverSortOrder, setServerSortOrder] = useState<"asc" | "desc">("asc");

  const {
    servers,
    serverTotal,
    serverTotalPages,
    availableGroups,
    agentInstallCommand,
    isLoading,
    refetchServers
  } = useInfrastructureData({
    page: serverPage,
    limit: serverPageSize,
    search: serverSearch,
    status: serverStatus === "all" ? undefined : serverStatus,
    group: serverGroup,
    sortBy: serverSortBy,
    sortOrder: serverSortOrder
  });

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
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("全网主机节点数据已同步刷新");
    }, 600);
  };

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="主机基础设施"
        subtitle="全球多云计算节点统一纳管、实时遥测监控与集群运维管理"
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
            <Button
              size="sm"
              onClick={() => setAgentDialogOpen(true)}
              className="cursor-pointer font-medium"
            >
              <Terminal className="size-3.5 mr-1.5" /> 一键安装 Agent
            </Button>
          </div>
        }
      />

      <div className="flex-1 p-6">
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
      </div>

      {/* Agent Quick Install Dialog */}
      <AgentInstallDialog
        open={agentDialogOpen}
        onOpenChange={setAgentDialogOpen}
        installCommand={agentInstallCommand}
      />
    </div>
  );
}
