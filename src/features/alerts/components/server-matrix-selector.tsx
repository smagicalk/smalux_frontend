import { useState, useMemo } from "react";
import {
  Server,
  Search,
  Check,
  CheckSquare,
  Square,
  Globe,
  FolderTree,
  Tag,
  X,
  Layers,
  ChevronRight,
  Sparkles,
  Filter,
  CheckCheck,
  RotateCcw
} from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import type { Server as ServerType } from "@/shared/api/methods";

interface ServerMatrixSelectorProps {
  servers: ServerType[];
  selectedServerIds: string[];
  onChange: (ids: string[]) => void;
}

/** 提取主机的业务分组名称 */
export function getServerGroupName(server: ServerType): string {
  if (server.tags && server.tags.length > 0) return server.tags[0];
  if ((server as any).group) return String((server as any).group);
  return server.region || "默认分组";
}

export function ServerMatrixSelector({
  servers,
  selectedServerIds,
  onChange
}: ServerMatrixSelectorProps) {
  // 左侧分组搜索与当前激活的分组
  const [groupSearch, setGroupSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState<string>("__ALL__");

  // 右侧主机搜索与状态筛选
  const [hostSearch, setHostSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "online" | "warning" | "offline">("all");

  // 已选托盘抽屉展开状态
  const [isTrayExpanded, setIsTrayExpanded] = useState(false);

  // 1. 结构化分组字典与统计
  const groupStats = useMemo(() => {
    const map = new Map<string, { total: number; selected: number; servers: ServerType[] }>();

    servers.forEach((s) => {
      const g = getServerGroupName(s);
      if (!map.has(g)) {
        map.set(g, { total: 0, selected: 0, servers: [] });
      }
      const entry = map.get(g)!;
      entry.total += 1;
      entry.servers.push(s);
      if (selectedServerIds.includes(s.id)) {
        entry.selected += 1;
      }
    });

    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      total: data.total,
      selected: data.selected,
      servers: data.servers,
      isAllSelected: data.selected === data.total && data.total > 0,
      isPartiallySelected: data.selected > 0 && data.selected < data.total
    }));
  }, [servers, selectedServerIds]);

  // 过滤后的分组列表（支持海量分组自身搜索）
  const filteredGroups = useMemo(() => {
    if (!groupSearch.trim()) return groupStats;
    const q = groupSearch.toLowerCase();
    return groupStats.filter((g) => g.name.toLowerCase().includes(q));
  }, [groupStats, groupSearch]);

  // 2. 当前选中分组下的主机列表（支持右侧按关键词与状态二次检索）
  const currentGroupServers = useMemo(() => {
    let list = servers;
    if (activeGroup !== "__ALL__") {
      list = servers.filter((s) => getServerGroupName(s) === activeGroup);
    }

    return list.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (hostSearch.trim()) {
        const q = hostSearch.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchId = s.id.toLowerCase().includes(q);
        const matchIp = (s.publicIp || "").toLowerCase().includes(q);
        const matchTags = (s.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!matchName && !matchId && !matchIp && !matchTags) return false;
      }
      return true;
    });
  }, [servers, activeGroup, statusFilter, hostSearch]);

  // 3. 勾选切换单台主机
  const handleToggleServer = (id: string) => {
    if (selectedServerIds.includes(id)) {
      onChange(selectedServerIds.filter((item) => item !== id));
    } else {
      onChange([...selectedServerIds, id]);
    }
  };

  // 4. 整组一键全选/反选
  const handleToggleGroupAll = (groupServers: ServerType[], e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const groupIds = groupServers.map((s) => s.id);
    const allSelected = groupIds.every((id) => selectedServerIds.includes(id));

    if (allSelected) {
      // 取消该组的所有主机
      onChange(selectedServerIds.filter((id) => !groupIds.includes(id)));
    } else {
      // 全选该组的所有主机
      const next = new Set([...selectedServerIds, ...groupIds]);
      onChange(Array.from(next));
    }
  };

  // 5. 快速批量操作
  const handleSelectAllVisible = () => {
    const visibleIds = currentGroupServers.map((s) => s.id);
    const allSelected = visibleIds.every((id) => selectedServerIds.includes(id));
    if (allSelected) {
      onChange(selectedServerIds.filter((id) => !visibleIds.includes(id)));
    } else {
      onChange(Array.from(new Set([...selectedServerIds, ...visibleIds])));
    }
  };

  const handleSelectOnlineOnly = () => {
    const onlineIds = currentGroupServers.filter((s) => s.status === "online").map((s) => s.id);
    onChange(Array.from(new Set([...selectedServerIds, ...onlineIds])));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const totalAllSelected = selectedServerIds.length === servers.length && servers.length > 0;

  return (
    <div className="rounded-2xl border border-border/80 bg-card/80 backdrop-blur-md overflow-hidden shadow-xs font-mono text-xs flex flex-col">
      {/* 顶部总览操作条 */}
      <div className="px-4 py-2.5 bg-muted/40 border-b border-border/60 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
            <FolderTree className="size-3.5" />
          </div>
          <span className="font-bold text-foreground">海量业务分组与主机多选工作台</span>
          <span className="text-[11px] text-muted-foreground">
            (已汇总 <strong>{groupStats.length}</strong> 个分组 · <strong>{servers.length}</strong> 台主机)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-muted-foreground">
            当前已勾选: <strong className="text-primary font-bold text-sm">{selectedServerIds.length}</strong> / {servers.length} 台
          </span>
          {selectedServerIds.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[11px] text-rose-400 hover:text-rose-300 hover:underline cursor-pointer flex items-center gap-1 ml-1"
            >
              <RotateCcw className="size-3" /> 清空已选
            </button>
          )}
        </div>
      </div>

      {/* 主体两栏联动区域：左侧分组导航 + 右侧主机列表 */}
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[300px] max-h-[360px] divide-y md:divide-y-0 md:divide-x divide-border/60">
        {/* ───────────── 左侧：海量分组导航侧边栏 (4 栏) ───────────── */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col bg-muted/15 min-h-0">
          {/* 分组自身搜索框 */}
          <div className="p-2.5 border-b border-border/50 bg-background/50">
            <div className="relative">
              <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                autoComplete="off"
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                placeholder="搜索业务分组名称..."
                className="w-full h-7.5 pl-8 pr-7 rounded-lg border border-border/70 bg-background text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary"
              />
              {groupSearch && (
                <button
                  type="button"
                  onClick={() => setGroupSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>

          {/* 分组列表可滚动容器 */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-1 select-none">
            {/* 全部分组顶层项 */}
            <div
              onClick={() => setActiveGroup("__ALL__")}
              className={`p-2 rounded-xl transition-all duration-150 cursor-pointer flex items-center justify-between gap-2 ${
                activeGroup === "__ALL__"
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "text-foreground hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  onClick={(e) => handleToggleGroupAll(servers, e)}
                  className={`size-4 rounded border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                    totalAllSelected
                      ? activeGroup === "__ALL__"
                        ? "bg-white text-primary border-white"
                        : "bg-primary border-primary text-primary-foreground"
                      : "border-border/80 bg-background"
                  }`}
                  title="全选/取消全网所有主机"
                >
                  {totalAllSelected && <Check className="size-3 stroke-[3]" />}
                </div>
                <div className="truncate flex items-center gap-1.5 text-xs">
                  <Globe className="size-3.5 shrink-0" />
                  <span>🌐 全集群所有主机</span>
                </div>
              </div>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full shrink-0 ${
                activeGroup === "__ALL__" ? "bg-primary-foreground/20 text-primary-foreground font-bold" : "bg-muted text-muted-foreground"
              }`}>
                {selectedServerIds.length}/{servers.length}
              </span>
            </div>

            {/* 各细分业务分组列表 */}
            {filteredGroups.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-[11px]">
                未搜索到匹配的分组
              </div>
            ) : (
              filteredGroups.map((g) => {
                const isActive = activeGroup === g.name;
                return (
                  <div
                    key={g.name}
                    onClick={() => setActiveGroup(g.name)}
                    className={`p-2 rounded-xl transition-all duration-150 cursor-pointer flex items-center justify-between gap-2 group ${
                      isActive
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {/* 分组左侧整组勾选 Checkbox */}
                      <div
                        onClick={(e) => handleToggleGroupAll(g.servers, e)}
                        className={`size-4 rounded border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                          g.isAllSelected
                            ? isActive
                              ? "bg-white text-primary border-white"
                              : "bg-primary border-primary text-primary-foreground"
                            : g.isPartiallySelected
                            ? "bg-primary/40 border-primary text-white"
                            : "border-border/80 bg-background"
                        }`}
                        title={`批量勾选/取消「${g.name}」下的全部主机`}
                      >
                        {g.isAllSelected ? (
                          <Check className="size-3 stroke-[3]" />
                        ) : g.isPartiallySelected ? (
                          <span className="size-1.5 rounded-sm bg-primary" />
                        ) : null}
                      </div>

                      <div className="truncate flex items-center gap-1 text-xs">
                        <Tag className="size-3 shrink-0 opacity-70" />
                        <span className="truncate">{g.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 font-mono text-[10px]">
                      <span className={`px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : g.selected > 0
                          ? "bg-primary/10 text-primary font-bold border border-primary/20"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {g.selected}/{g.total}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ───────────── 右侧：当前分组下的主机矩阵列表 (8 栏) ───────────── */}
        <div className="md:col-span-7 lg:col-span-8 flex flex-col bg-background/50 min-h-0">
          {/* 右侧顶部：主机关键词搜索 + 状态过滤 + 快捷批量按钮 */}
          <div className="p-2.5 border-b border-border/50 bg-background/70 space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  autoComplete="off"
                  value={hostSearch}
                  onChange={(e) => setHostSearch(e.target.value)}
                  placeholder={`在${activeGroup === "__ALL__" ? "全部主机" : `「${activeGroup}」`}中搜索名称、IP、ID...`}
                  className="w-full h-7.5 pl-8 pr-7 rounded-lg border border-border/70 bg-background text-xs text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary"
                />
                {hostSearch && (
                  <button
                    type="button"
                    onClick={() => setHostSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                aria-label="筛选主机状态"
                className="h-7.5 px-2 rounded-lg border border-border/70 bg-background text-xs font-mono text-foreground outline-none cursor-pointer"
              >
                <option value="all">全部状态</option>
                <option value="online">🟢 在线</option>
                <option value="offline">⚪ 离线</option>
              </select>
            </div>

            {/* 批量快捷操作 */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5 select-none">
              <div className="flex items-center gap-2 font-mono">
                <button
                  type="button"
                  onClick={handleSelectAllVisible}
                  className="text-primary hover:underline font-bold cursor-pointer flex items-center gap-1"
                >
                  <CheckSquare className="size-3" />
                  {currentGroupServers.every((s) => selectedServerIds.includes(s.id)) && currentGroupServers.length > 0
                    ? "取消当前可见"
                    : "全选当前可见"}
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={handleSelectOnlineOnly}
                  className="text-emerald-500 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="size-3" /> 仅选在线
                </button>
              </div>

              <span className="font-mono text-[10px]">
                当前匹配 <strong>{currentGroupServers.length}</strong> 台主机
              </span>
            </div>
          </div>

          {/* 右侧主机卡片矩阵列表 */}
          <div className="flex-1 overflow-y-auto p-2.5 select-none">
            {currentGroupServers.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground gap-1.5">
                <Server className="size-6 text-muted-foreground/40" />
                <span className="font-medium">未找到符合条件的主机</span>
                <span className="text-[10px]">请调整左侧分组或清空搜索过滤词</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentGroupServers.map((srv) => {
                  const isChecked = selectedServerIds.includes(srv.id);
                  const isOnline = srv.status === "online";
                  const sGroup = getServerGroupName(srv);

                  return (
                    <div
                      key={srv.id}
                      onClick={() => handleToggleServer(srv.id)}
                      className={`p-2 rounded-xl border text-left transition-all duration-150 cursor-pointer flex items-center justify-between gap-2 ${
                        isChecked
                          ? "border-primary bg-primary/15 text-foreground ring-1 ring-primary/40 shadow-2xs"
                          : "border-border/60 bg-card/70 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Checkbox */}
                        <div className={`size-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          isChecked ? "bg-primary border-primary text-primary-foreground" : "border-border/80 bg-background"
                        }`}>
                          {isChecked && <Check className="size-3 stroke-[3]" />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`size-1.5 rounded-full shrink-0 ${isOnline ? "bg-emerald-500" : "bg-zinc-500"}`} />
                            <span className="font-bold text-xs text-foreground truncate" title={srv.name}>
                              {srv.name}
                            </span>
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate font-mono">
                            {srv.publicIp || srv.id}
                          </div>
                        </div>
                      </div>

                      {sGroup && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-muted/80 text-muted-foreground shrink-0 font-mono border border-border/40">
                          {sGroup}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 底部已选主机托盘栏 (可展开查看全部标签) */}
      {selectedServerIds.length > 0 && (
        <div className="px-4 py-2 bg-muted/20 border-t border-border/50 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-mono text-muted-foreground">
              已选清单 (<strong className="text-primary">{selectedServerIds.length}</strong> 台):
            </span>
            <button
              type="button"
              onClick={() => setIsTrayExpanded(!isTrayExpanded)}
              className="text-primary hover:underline cursor-pointer text-[10px]"
            >
              {isTrayExpanded ? "收起清单 ▲" : "展开全部清单 ▼"}
            </button>
          </div>

          <div className={`flex items-center gap-1.5 flex-wrap overflow-y-auto pr-1 transition-all ${
            isTrayExpanded ? "max-h-24" : "max-h-8"
          }`}>
            {selectedServerIds.map((id) => {
              const s = servers.find((item) => item.id === id);
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-card border border-primary/30 text-primary text-[11px] font-mono shadow-2xs"
                >
                  <span className="truncate max-w-[120px]">{s?.name || id}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleServer(id)}
                    className="hover:text-rose-400 cursor-pointer p-0.2"
                  >
                    <X className="size-2.5" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
