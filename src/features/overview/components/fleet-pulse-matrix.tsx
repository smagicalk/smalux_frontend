import { Link, useNavigate } from "@tanstack/react-router";
import {
  Radio,
  Search,
  Terminal,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { GroupPillTabs } from "@/shared/ui/group-pill-tabs";
import type { NodePulse } from "../types";

interface FleetPulseMatrixProps {
  nodes: NodePulse[];
  total: number;
  totalPages: number;
  availableGroups: Array<{ group: string; count: number; hasWarn: boolean }>;
  page: number;
  pageSize: number;
  selectedGroup: string;
  statusFilter: "all" | "online" | "warning";
  searchQuery: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onGroupChange: (group: string) => void;
  onStatusChange: (status: "all" | "online" | "warning") => void;
  onSearchChange: (search: string) => void;
  selectedNode: NodePulse | null;
  onSelectNode: (node: NodePulse | null) => void;
}

export function FleetPulseMatrix({
  nodes,
  total,
  totalPages,
  availableGroups,
  page,
  pageSize,
  selectedGroup,
  statusFilter,
  searchQuery,
  onPageChange,
  onPageSizeChange,
  onGroupChange,
  onStatusChange,
  onSearchChange,
  selectedNode,
  onSelectNode
}: FleetPulseMatrixProps) {
  const navigate = useNavigate();

  const handleNodeDoubleClick = (node: NodePulse) => {
    navigate({
      to: "/admin/infrastructure",
      search: { server: node.id }
    });
  };

  const renderNodeCard = (node: NodePulse) => {
    const isWarn = node.status === "warning";
    const isSelected = selectedNode?.id === node.id;

    return (
      <div
        key={node.id}
        onClick={() => onSelectNode(isSelected ? null : node)}
        onDoubleClick={() => handleNodeDoubleClick(node)}
        title="单击选中诊断 · 双击直达主机详情"
        className={`group relative rounded-xl border p-3 cursor-pointer select-none transition-all duration-200 hover:shadow-md ${
          isSelected
            ? "border-primary ring-2 ring-primary/30 bg-primary/5"
            : isWarn
            ? "border-amber-500/40 bg-amber-500/5 hover:border-amber-500/70"
            : "border-border/70 bg-card/60 hover:border-primary/50 hover:bg-card"
        }`}
      >
        <div className="flex items-start justify-between gap-1.5">
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground truncate">
              <span
                className={`size-2 rounded-full shrink-0 ${
                  isWarn ? "bg-amber-400 pulse-dot" : "bg-emerald-400"
                }`}
              />
              <span className="truncate group-hover:text-primary transition-colors">{node.name}</span>
            </div>
            <div className="text-[10px] text-muted-foreground font-mono truncate flex items-center gap-1">
              <span className="text-primary font-semibold bg-primary/10 px-1 rounded border border-primary/20">{node.id}</span>
              <span>·</span>
              <span>{node.region}</span>
            </div>
          </div>
          <span className="text-[9px] font-mono text-muted-foreground shrink-0 bg-muted/60 px-1 py-0.5 rounded border border-border/50">
            {node.ip.split(".").slice(-2).join(".")}
          </span>
        </div>

        {/* Meters */}
        <div className="mt-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-muted-foreground">CPU</span>
            {node.status === "offline" ? (
              <span className="text-muted-foreground/60 text-[9px] font-sans">已离线</span>
            ) : node.cpu == null ? (
              <span className="text-muted-foreground/60 text-[9px] font-sans">未采集</span>
            ) : (
              <span className={node.cpu > 80 ? "text-amber-500 font-bold" : "text-foreground"}>
                {node.cpu}%
              </span>
            )}
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                node.cpu != null && node.cpu > 80 ? "bg-amber-500" : "bg-primary"
              }`}
              style={{ width: `${node.status !== "offline" && node.cpu != null ? node.cpu : 0}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono pt-0.5">
            <span className="text-muted-foreground">RAM</span>
            {node.status === "offline" ? (
              <span className="text-muted-foreground/60 text-[9px] font-sans">已离线</span>
            ) : node.memory == null ? (
              <span className="text-muted-foreground/60 text-[9px] font-sans">未采集</span>
            ) : (
              <span className="text-foreground">{node.memory}%</span>
            )}
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${node.status !== "offline" && node.memory != null ? node.memory : 0}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  const totalFullFleetCount = availableGroups.reduce((acc, g) => acc + g.count, 0) || total;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 space-y-3">
        {/* Top title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Radio className="size-4 text-primary" />
              <CardTitle className="text-base">全网节点热力集群 (Fleet Pulse Matrix)</CardTitle>
              <Badge variant="neutral" className="text-[11px] font-mono px-2 py-0.5">
                {totalFullFleetCount} 纳管节点
              </Badge>
            </div>
            <CardDescription>
              实时节点负载与遥测分布，支持服务端 RPC 分页与快速检索 (💡 单击诊断 · 双击进入主机详情)
            </CardDescription>
          </div>
        </div>

        {/* Horizontally Scrollable Group Pills Tabs */}
        <GroupPillTabs
          groups={availableGroups}
          selectedGroup={selectedGroup}
          onGroupChange={onGroupChange}
          totalCount={totalFullFleetCount}
        />

        {/* Toolbar: Search + Status Filter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
          <div className="relative w-52 sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="搜索 ID / 名称 / IP / 区域..."
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

          {/* Status Filter */}
          <div className="flex items-center gap-1 rounded-lg border border-border/80 bg-muted/30 p-0.5 text-xs shrink-0">
            {[
              { id: "all" as const, label: "全部" },
              { id: "online" as const, label: "🟢 正常" },
              { id: "warning" as const, label: "🟡 预警" }
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => onStatusChange(st.id)}
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
        {nodes.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground font-mono">
            未找到匹配的集群节点
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {nodes.map((node) => renderNodeCard(node))}
            </div>

            {/* Pagination Controls */}
            <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground font-mono">
                <span>共 <strong>{total}</strong> 节点</span>
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
                    <option value={6}>6 条</option>
                    <option value={12}>12 条</option>
                    <option value={18}>18 条</option>
                    <option value={24}>24 条</option>
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
          </>
        )}
      </CardContent>

      {/* Floating Action Bar for Selected Node */}
      {selectedNode && (
        <div className="fixed bottom-6 right-8 z-40 flex items-center gap-3 rounded-2xl border border-primary/40 bg-background/95 px-4 py-2.5 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-bold text-foreground">
              已选中: {selectedNode.name}
            </span>
            <span className="text-[10px] font-mono text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded border border-primary/30">
              {selectedNode.id}
            </span>
          </div>

          <div className="h-4 w-px bg-border/80" />

          <div className="flex items-center gap-2">
            <Link
              to="/admin/infrastructure"
              search={{ server: selectedNode.id }}
            >
              <Button size="sm" className="h-7 px-2.5 text-xs font-semibold cursor-pointer">
                <Terminal className="size-3 mr-1" /> 深度诊断 & Web 终端
              </Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSelectNode(null)}
              className="size-7 p-0 cursor-pointer"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
