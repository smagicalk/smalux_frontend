import { useState } from "react";
import {
  Server,
  Search,
  LayoutGrid,
  List,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Activity,
  Cpu,
  Layers,
  HardDrive
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { GroupPillTabs } from "@/shared/ui/group-pill-tabs";
import { toast } from "sonner";
import type { HostServer } from "../types";

interface HostServersViewProps {
  servers: HostServer[];
  total: number;
  totalPages: number;
  availableGroups: Array<{ group: string; count: number }>;
  page: number;
  pageSize: number;
  searchQuery: string;
  statusFilter: "all" | "online" | "warning" | "offline";
  selectedGroup: string;
  sortBy: "id" | "name" | "cpu" | "memory" | "disk";
  sortOrder: "asc" | "desc";
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSearchChange: (search: string) => void;
  onStatusFilterChange: (status: "all" | "online" | "warning" | "offline") => void;
  onGroupChange: (group: string) => void;
  onSortChange: (field: "id" | "name" | "cpu" | "memory" | "disk") => void;
  selectedServer?: HostServer | null;
  onSelectServer: (server: HostServer) => void;
}

export function HostServersView({
  servers,
  total,
  totalPages,
  availableGroups,
  page,
  pageSize,
  searchQuery,
  statusFilter,
  selectedGroup,
  sortBy,
  sortOrder,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onStatusFilterChange,
  onGroupChange,
  onSortChange,
  selectedServer,
  onSelectServer
}: HostServersViewProps) {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const totalFullFleetCount = availableGroups.reduce((acc, g) => acc + g.count, 0) || total;

  const handleCopy = (e: React.MouseEvent, text: string, label: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    toast.success(`已复制 ${label}: ${text}`);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 space-y-3">
        {/* Header Title & View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Server className="size-4 text-primary" />
              <CardTitle className="text-base">主机节点矩阵 (Host Fleet)</CardTitle>
              <Badge variant="neutral" className="text-[11px] font-mono px-2 py-0.5">
                {totalFullFleetCount} 纳管节点
              </Badge>
            </div>
            <CardDescription>
              纳管服务器的实时负载、网络流量、硬件规格与运行健康度 (💡 单击/双击直达深度排查)
            </CardDescription>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 self-start sm:self-auto rounded-lg border border-border/70 bg-muted/40 p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-card text-foreground font-bold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="size-3.5" /> 卡片网格
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-card text-foreground font-bold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="size-3.5" /> 紧凑表格
            </button>
          </div>
        </div>

        {/* Modern Horizontally Scrollable Group Pills Tabs */}
        <GroupPillTabs
          groups={availableGroups}
          selectedGroup={selectedGroup}
          onGroupChange={onGroupChange}
          totalCount={totalFullFleetCount}
        />

        {/* Filters & Search Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[260px]">
            {/* Search Input */}
            <div className="relative w-56 sm:w-68">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="搜索名称 / IP / 区域..."
                className="w-full h-8 rounded-lg border border-border/80 bg-muted/30 pl-8 pr-3 text-xs outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/60 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>

          {/* Status Filter Toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-border/80 bg-muted/30 p-0.5 text-xs shrink-0">
            {[
              { id: "all" as const, label: "全部" },
              { id: "online" as const, label: "🟢 在线" },
              { id: "warning" as const, label: "🟡 预警" },
              { id: "offline" as const, label: "🔴 离线" }
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => onStatusFilterChange(st.id)}
                className={`rounded-md px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                  statusFilter === st.id
                    ? "bg-card text-foreground font-bold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-1">
        {servers.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground font-mono">
            未找到匹配的主机节点
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View - Clean & Compact */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {servers.map((server) => {
              const isSelected = selectedServer?.id === server.id;
              const isWarn = server.status === "warning";
              const isOff = server.status === "offline";

              const memTotal = server.memTotalGb || 16;
              const memUsed = server.memUsedGb || +(memTotal * (server.memory / 100)).toFixed(1);
              const diskTotal = server.diskTotalGb || 500;
              const diskUsed = server.diskUsedGb || +(diskTotal * (server.disk / 100)).toFixed(1);
              const trafficTotal = server.trafficTotalGb || 10000;
              const trafficUsed = server.trafficUsedGb || Math.round(1800 + server.cpu * 55);
              const trafficRatio = Math.min(100, Math.round((trafficUsed / trafficTotal) * 100));

              return (
                <div
                  key={server.id}
                  onClick={() => onSelectServer(server)}
                  className={`group relative rounded-xl border p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isSelected
                      ? "border-primary ring-2 ring-primary/30 bg-primary/5"
                      : isWarn
                      ? "border-amber-500/40 bg-amber-500/5 hover:border-amber-500/70"
                      : isOff
                      ? "border-rose-500/40 bg-rose-500/5 hover:border-rose-500/70"
                      : "border-border/80 bg-card/60 hover:border-primary/50 hover:bg-card"
                  }`}
                >
                  {/* Top Row: Name & ID + Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`size-2 rounded-full shrink-0 ${
                            isWarn
                              ? "bg-amber-400 animate-ping"
                              : isOff
                              ? "bg-rose-500"
                              : "bg-emerald-400"
                          }`}
                        />
                        <span className="font-bold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                          {server.name}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono flex items-center gap-1.5 truncate">
                        <span className="text-primary font-semibold bg-primary/10 px-1 rounded border border-primary/20">
                          {server.id}
                        </span>
                        <span>·</span>
                        <span className="truncate">{server.region}</span>
                      </div>
                    </div>

                    <Badge
                      variant={isOff ? "danger" : isWarn ? "warning" : "success"}
                      dot
                      className="text-[9px] px-1.5 py-0 h-4 font-medium shrink-0"
                    >
                      {isOff ? "离线" : isWarn ? "高载" : "在线"}
                    </Badge>
                  </div>

                  {/* IP, OS & Real-time Network Speeds (Single Line) */}
                  <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                    <span className="truncate max-w-[130px]">{server.ip} · {server.os}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isOff ? (
                        <span className="text-muted-foreground/60 text-[9px] font-sans">已离线</span>
                      ) : !server.networkIn && !server.networkOut ? (
                        <span className="text-muted-foreground/60 text-[9px] font-sans">未采集</span>
                      ) : (
                        <>
                          <span className="text-sky-400 font-medium">↓ {server.networkIn || "—"}</span>
                          <span className="text-muted-foreground/40">/</span>
                          <span className="text-indigo-400 font-medium">↑ {server.networkOut || "—"}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Metrics Gauges */}
                  <div className="mt-3 space-y-2.5">
                    {/* CPU Gauge */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Cpu className="size-2.5 text-muted-foreground" /> CPU 使用率
                        </span>
                        {isOff ? (
                          <span className="text-muted-foreground/60 text-[9px] font-sans">已离线</span>
                        ) : server.cpu == null ? (
                          <span className="text-muted-foreground/60 text-[9px] font-sans">未采集</span>
                        ) : (
                          <span className={server.cpu > 80 ? "text-amber-400 font-bold" : "text-foreground"}>
                            {server.cpu}%
                          </span>
                        )}
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden mt-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            !isOff && server.cpu != null && server.cpu > 80 ? "bg-amber-500" : "bg-primary"
                          }`}
                          style={{ width: `${!isOff && server.cpu != null ? server.cpu : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Memory Gauge */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Layers className="size-2.5 text-muted-foreground" /> 内存占用{" "}
                          {!isOff && server.memory != null ? `(${memUsed}G/${memTotal}G)` : ""}
                        </span>
                        {isOff ? (
                          <span className="text-muted-foreground/60 text-[9px] font-sans">已离线</span>
                        ) : server.memory == null ? (
                          <span className="text-muted-foreground/60 text-[9px] font-sans">未采集</span>
                        ) : (
                          <span className={server.memory > 85 ? "text-amber-400 font-bold" : "text-foreground"}>
                            {server.memory}%
                          </span>
                        )}
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden mt-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            !isOff && server.memory != null && server.memory > 85 ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${!isOff && server.memory != null ? server.memory : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Disk Gauge */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <HardDrive className="size-2.5 text-muted-foreground" /> 磁盘空间{" "}
                          {!isOff && server.disk != null ? `(${diskUsed}G/${diskTotal}G)` : ""}
                        </span>
                        {isOff ? (
                          <span className="text-muted-foreground/60 text-[9px] font-sans">已离线</span>
                        ) : server.disk == null ? (
                          <span className="text-muted-foreground/60 text-[9px] font-sans">未采集</span>
                        ) : (
                          <span className="text-foreground">{server.disk}%</span>
                        )}
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden mt-0.5">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                          style={{ width: `${!isOff && server.disk != null ? server.disk : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Monthly Traffic Quota Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Activity className="size-2.5 text-muted-foreground" /> 当月流量{" "}
                          {!isOff && server.trafficTotalGb != null
                            ? `(${(trafficUsed / 1024).toFixed(1)}TB/${(trafficTotal / 1024).toFixed(0)}TB)`
                            : ""}
                        </span>
                        {isOff ? (
                          <span className="text-muted-foreground/60 text-[9px] font-sans">已离线</span>
                        ) : server.trafficTotalGb == null ? (
                          <span className="text-muted-foreground/60 text-[9px] font-sans">未配置</span>
                        ) : (
                          <span className={trafficRatio > 80 ? "text-amber-400 font-bold" : "text-foreground"}>
                            {trafficRatio}%
                          </span>
                        )}
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden mt-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            trafficRatio > 80 ? "bg-amber-500" : "bg-gradient-to-r from-teal-500 to-sky-500"
                          }`}
                          style={{ width: `${!isOff && server.trafficTotalGb != null ? trafficRatio : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer: TCP Conns, Load & Uptime */}
                  <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                    <div className="flex items-center gap-1.5 truncate">
                      {isOff ? (
                        <span className="text-muted-foreground/60">节点已离线</span>
                      ) : (
                        <>
                          <span className="text-foreground/70 font-semibold">{server.tcpConns != null ? `${server.tcpConns} Conns` : "—"}</span>
                          <span>·</span>
                          <span className="truncate">{server.uptime || "—"}</span>
                        </>
                      )}
                    </div>
                    <span className="shrink-0 flex items-center text-primary group-hover:underline">
                      排查详情 <ChevronRight className="size-2.5 ml-0.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View - High Density Single Line */
          <div className="rounded-xl border border-border/70 overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-muted/40 border-b border-border/70 text-muted-foreground select-none">
                <tr>
                  <th
                    onClick={() => onSortChange("name")}
                    className="p-2.5 font-semibold cursor-pointer hover:text-foreground whitespace-nowrap min-w-[200px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>主机节点</span>
                      {sortBy === "name" ? (
                        sortOrder === "asc" ? <ChevronUp className="size-3 text-primary" /> : <ChevronDown className="size-3 text-primary" />
                      ) : (
                        <ArrowUpDown className="size-3 opacity-40 hover:opacity-100" />
                      )}
                    </div>
                  </th>
                  <th className="p-2.5 font-semibold whitespace-nowrap min-w-[240px]">
                    IP 地址 / 区域
                  </th>
                  <th
                    onClick={() => onSortChange("cpu")}
                    className="p-2.5 font-semibold cursor-pointer hover:text-foreground text-right whitespace-nowrap w-24"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>CPU</span>
                      {sortBy === "cpu" ? (
                        sortOrder === "asc" ? <ChevronUp className="size-3 text-primary" /> : <ChevronDown className="size-3 text-primary" />
                      ) : (
                        <ArrowUpDown className="size-3 opacity-40 hover:opacity-100" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => onSortChange("memory")}
                    className="p-2.5 font-semibold cursor-pointer hover:text-foreground text-right whitespace-nowrap w-28"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>内存</span>
                      {sortBy === "memory" ? (
                        sortOrder === "asc" ? <ChevronUp className="size-3 text-primary" /> : <ChevronDown className="size-3 text-primary" />
                      ) : (
                        <ArrowUpDown className="size-3 opacity-40 hover:opacity-100" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => onSortChange("disk")}
                    className="p-2.5 font-semibold cursor-pointer hover:text-foreground text-right whitespace-nowrap w-28"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>磁盘</span>
                      {sortBy === "disk" ? (
                        sortOrder === "asc" ? <ChevronUp className="size-3 text-primary" /> : <ChevronDown className="size-3 text-primary" />
                      ) : (
                        <ArrowUpDown className="size-3 opacity-40 hover:opacity-100" />
                      )}
                    </div>
                  </th>
                  <th className="p-2.5 font-semibold text-right whitespace-nowrap w-36">
                    实时网络 (下行/上行)
                  </th>
                  <th className="p-2.5 font-semibold text-right whitespace-nowrap w-24">
                    运行时长
                  </th>
                  <th className="p-2.5 font-semibold text-right whitespace-nowrap w-20">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 bg-card/30">
                {servers.map((server) => {
                  const isSelected = selectedServer?.id === server.id;
                  const isWarn = server.status === "warning";
                  const isOff = server.status === "offline";

                  const memTotal = server.memTotalGb || 16;
                  const memUsed = server.memUsedGb || +(memTotal * (server.memory / 100)).toFixed(1);
                  const diskTotal = server.diskTotalGb || 500;
                  const diskUsed = server.diskUsedGb || +(diskTotal * (server.disk / 100)).toFixed(1);

                  const ipv4 = server.ipv4 || server.ip;
                  const ipv6 = server.ipv6;
                  const regionDisplay = server.region.includes("(")
                    ? server.region.split("(")[1]?.replace(")", "")
                    : server.region;

                  return (
                    <tr
                      key={server.id}
                      onClick={() => onSelectServer(server)}
                      className={`group cursor-pointer transition-colors hover:bg-muted/40 h-10.5 ${
                        isSelected ? "bg-primary/10 hover:bg-primary/15" : ""
                      }`}
                    >
                      {/* Host Name & OS & Status Indicator */}
                      <td className="p-2.5 whitespace-nowrap font-mono">
                        <div className="flex items-center gap-2">
                          <span
                            className={`size-2 rounded-full shrink-0 ${
                              isOff ? "bg-rose-500" : isWarn ? "bg-amber-400" : "bg-emerald-400"
                            }`}
                            title={isOff ? "状态: 离线" : isWarn ? "状态: 高载预警" : "状态: 正常在线"}
                          />
                          <span
                            className="font-semibold text-foreground truncate group-hover:text-primary transition-colors text-xs"
                            title={server.name}
                          >
                            {server.name}
                          </span>
                          {server.os && (
                            <span className="text-[10px] text-muted-foreground/80 px-1.5 py-0.2 rounded bg-muted/60 border border-border/40 shrink-0 font-sans">
                              {server.os.split(" ")[0]}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* IP Addresses (IPv4 & IPv6 in single line) + Region */}
                      <td className="p-2.5 whitespace-nowrap font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-muted-foreground text-[11px] shrink-0 truncate max-w-[70px]"
                            title={server.region}
                          >
                            {regionDisplay}
                          </span>
                          <span
                            onClick={(e) => handleCopy(e, ipv4, "IPv4")}
                            className="text-foreground/90 font-medium hover:text-primary hover:underline cursor-pointer select-all"
                            title={`IPv4: ${ipv4} (点击复制)`}
                          >
                            {ipv4}
                          </span>
                          {ipv6 && (
                            <span
                              onClick={(e) => handleCopy(e, ipv6, "IPv6")}
                              className="text-[10px] text-muted-foreground/80 bg-muted/40 hover:bg-muted hover:text-foreground border border-border/50 px-1.5 py-0.5 rounded cursor-pointer select-all truncate max-w-[130px]"
                              title={`IPv6: ${ipv6} (点击复制)`}
                            >
                              {ipv6}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* CPU Usage */}
                      <td className="p-2.5 text-right whitespace-nowrap font-mono">
                        {isOff ? (
                          <span className="text-muted-foreground/60 text-[11px] font-sans">已离线</span>
                        ) : server.cpu == null ? (
                          <span className="text-muted-foreground/60 text-[11px] font-sans">未采集</span>
                        ) : (
                          <span
                            className={
                              server.cpu > 85
                                ? "text-rose-400 font-bold"
                                : server.cpu > 70
                                ? "text-amber-400 font-bold"
                                : "text-foreground"
                            }
                          >
                            {server.cpu}%
                          </span>
                        )}
                      </td>

                      {/* Memory Usage */}
                      <td className="p-2.5 text-right whitespace-nowrap font-mono">
                        {isOff ? (
                          <span className="text-muted-foreground/60 text-[11px] font-sans">已离线</span>
                        ) : server.memory == null ? (
                          <span className="text-muted-foreground/60 text-[11px] font-sans">未采集</span>
                        ) : (
                          <>
                            <span
                              className={
                                server.memory > 85
                                  ? "text-amber-400 font-bold"
                                  : "text-foreground"
                              }
                            >
                              {server.memory}%
                            </span>
                            <span className="text-[10px] text-muted-foreground ml-1 font-sans">
                              ({memUsed}G)
                            </span>
                          </>
                        )}
                      </td>

                      {/* Disk Usage */}
                      <td className="p-2.5 text-right whitespace-nowrap font-mono">
                        {isOff ? (
                          <span className="text-muted-foreground/60 text-[11px] font-sans">已离线</span>
                        ) : server.disk == null ? (
                          <span className="text-muted-foreground/60 text-[11px] font-sans">未采集</span>
                        ) : (
                          <>
                            <span
                              className={
                                server.disk > 85
                                  ? "text-amber-400 font-bold"
                                  : "text-foreground"
                              }
                            >
                              {server.disk}%
                            </span>
                            <span className="text-[10px] text-muted-foreground ml-1 font-sans">
                              ({diskUsed}G)
                            </span>
                          </>
                        )}
                      </td>

                      {/* Real-time Network Speeds */}
                      <td className="p-2.5 text-right whitespace-nowrap font-mono">
                        {isOff ? (
                          <span className="text-muted-foreground/60 text-[11px] font-sans">已离线</span>
                        ) : !server.networkIn && !server.networkOut ? (
                          <span className="text-muted-foreground/60 text-[11px] font-sans">未采集</span>
                        ) : (
                          <>
                            <span className="text-sky-400 font-medium">↓ {server.networkIn || "—"}</span>
                            <span className="text-muted-foreground/40 mx-1">/</span>
                            <span className="text-indigo-400 font-medium">↑ {server.networkOut || "—"}</span>
                          </>
                        )}
                      </td>

                      {/* Uptime */}
                      <td className="p-2.5 text-right whitespace-nowrap font-mono text-muted-foreground text-[11px]">
                        {isOff ? <span className="text-muted-foreground/60 font-sans">已离线</span> : server.uptime || "—"}
                      </td>

                      {/* Actions */}
                      <td className="p-2.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectServer(server);
                          }}
                          className="text-xs text-primary hover:text-primary/80 hover:underline cursor-pointer inline-flex items-center gap-0.5 font-sans font-medium"
                        >
                          详情 <ChevronRight className="size-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Compact Pagination Bar */}
        {total > 0 && (
          <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground font-mono">
              <span>共 <strong>{total}</strong> 台节点</span>
              <span>·</span>
              <span>第 <strong>{page}</strong> / {totalPages} 页</span>
              <span>·</span>
              <div className="flex items-center gap-1">
                <span>每页:</span>
                <select
                  value={pageSize}
                  onChange={(e) => onPageSizeChange(Number(e.target.value))}
                  className="bg-muted/40 border border-border/80 rounded px-1.5 py-0.5 outline-none font-semibold text-foreground cursor-pointer"
                >
                  <option value={8}>8 条</option>
                  <option value={12}>12 条</option>
                  <option value={24}>24 条</option>
                  <option value={48}>48 条</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="h-7.5 px-2.5 text-xs gap-1 cursor-pointer"
              >
                <ChevronLeft className="size-3.5" /> 上一页
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="h-7.5 px-2.5 text-xs gap-1 cursor-pointer"
              >
                下一页 <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
