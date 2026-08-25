import { useState, useMemo, useEffect, useRef } from "react";
import {
  Radio,
  X,
  Search,
  RefreshCw,
  Copy,
  Check,
  PowerOff,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Clock,
  Sparkles,
  List,
  FolderTree,
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  User,
  ArrowUpDown
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { toast } from "sonner";
import type { HostServer, ServerProcessItem } from "../types";
import { getMockServerProcesses } from "../mock/infrastructure-mock";

interface ServerProcessesDrawerProps {
  server: HostServer | null;
  isOpen: boolean;
  onClose: () => void;
  processCollectionEnabled: boolean;
  onEnableCollection?: () => void;
}

/**
 * Parse memory value into numeric KB (default baseline) for consistent sorting regardless of whether input is string or number
 * Supports:
 * - Pure numbers (e.g. 85000 -> 85000 KB)
 * - Strings with units (e.g. "1 MB" -> 1024 KB, "1.5 GB" -> 1572864 KB, "512 KB" -> 512 KB, "2048 B" -> 2 KB)
 * - Pure numeric strings (e.g. "85000" -> 85000 KB)
 */
export function parseProcessMemoryToKb(val?: number | string | null): number {
  if (val === undefined || val === null || val === "") return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  
  const str = String(val).trim().toLowerCase();
  const match = str.match(/([0-9]+(?:\.[0-9]+)?)\s*([a-z]*)/i);
  if (!match) return 0;
  
  const num = parseFloat(match[1]);
  if (isNaN(num) || num <= 0) return 0;
  
  const unit = (match[2] || "").trim();
  
  if (unit.startsWith("t")) return num * 1024 * 1024 * 1024;
  if (unit.startsWith("g")) return num * 1024 * 1024;
  if (unit.startsWith("m")) return num * 1024;
  if (unit.startsWith("k")) return num;
  if (unit.startsWith("b")) return num / 1024;
  
  // If no explicit unit was provided (e.g. "85000"), baseline default is KB
  return num;
}

/**
 * Format resident memory (RSS in KB) with automatic human-readable unit conversion (KB / MB / GB / TB)
 */
export function formatProcessMemory(val?: number | string | null): string {
  if (val === undefined || val === null || val === "") return "—";
  const kb = parseProcessMemoryToKb(val);
  if (kb <= 0) return "—";
  
  // >= 1 TB (1024 * 1024 * 1024 KB)
  if (kb >= 1073741824) {
    const tb = kb / 1073741824;
    const formatted = tb >= 10 ? parseFloat(tb.toFixed(1)) : parseFloat(tb.toFixed(2));
    return `${formatted} TB`;
  }
  // >= 1 GB (1024 * 1024 KB)
  if (kb >= 1048576) {
    const gb = kb / 1048576;
    const formatted = gb >= 10 ? parseFloat(gb.toFixed(1)) : parseFloat(gb.toFixed(2));
    return `${formatted} GB`;
  }
  // >= 1 MB (1024 KB)
  if (kb >= 1024) {
    const mb = kb / 1024;
    const formatted = mb >= 100 ? Math.round(mb) : parseFloat(mb.toFixed(1));
    return `${formatted} MB`;
  }
  // < 1 MB
  return `${Math.round(kb)} KB`;
}

type ProcessSortKey = "cpu" | "res" | "pid" | "threads";

export interface FlatTreeItem extends ServerProcessItem {
  level: number;
  hasChildren: boolean;
  isExpanded: boolean;
  childCount: number;
  isLastChild: boolean;
}

export function ServerProcessesDrawer({
  server,
  isOpen,
  onClose,
  processCollectionEnabled,
  onEnableCollection
}: ServerProcessesDrawerProps) {
  const [userFilter, setUserFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "tree">("list");
  const [collapsedMap, setCollapsedMap] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<ProcessSortKey>("cpu");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [snapshotTime, setSnapshotTime] = useState<string>("刚刚");

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setIsSortMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [copiedPid, setCopiedPid] = useState<number | null>(null);

  // Kill confirmation modal state
  const [confirmKillProcess, setConfirmKillProcess] = useState<ServerProcessItem | null>(null);
  const [killSignal, setKillSignal] = useState<"SIGTERM" | "SIGKILL">("SIGTERM");
  const [isKilling, setIsKilling] = useState(false);

  const canRemoteExec = server?.status !== "offline" && server?.allowRemoteExec !== false;

  const serverId = server?.id;

  const baseProcesses = useMemo(() => {
    return getMockServerProcesses(server);
  }, [serverId]);

  const [processesList, setProcessesList] = useState<ServerProcessItem[]>(baseProcesses);

  // Sync only when target server ID changes or drawer opens
  useEffect(() => {
    if (isOpen && serverId) {
      setProcessesList(getMockServerProcesses(server));
      setSnapshotTime("刚刚");
      setCollapsedMap({});
    }
  }, [isOpen, serverId]);

  // Available unique users
  const uniqueUsers = useMemo(() => {
    const set = new Set<string>();
    processesList.forEach((p) => set.add(p.user));
    return Array.from(set).sort();
  }, [processesList]);

  // Flat List filtered & sorted
  const flatProcesses = useMemo(() => {
    let result = [...processesList];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.command || "").toLowerCase().includes(q) ||
          p.pid.toString().includes(q) ||
          p.user.toLowerCase().includes(q)
      );
    }

    if (userFilter !== "all") {
      result = result.filter((p) => p.user === userFilter);
    }

    result.sort((a, b) => {
      let aVal = sortBy === "res" ? parseProcessMemoryToKb(a.resKb ?? a.resMb) : (a[sortBy] ?? 0);
      let bVal = sortBy === "res" ? parseProcessMemoryToKb(b.resKb ?? b.resMb) : (b[sortBy] ?? 0);
      if (typeof aVal === "string") aVal = Number(aVal) || 0;
      if (typeof bVal === "string") bVal = Number(bVal) || 0;

      return sortOrder === "asc" ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

    return result;
  }, [processesList, searchQuery, userFilter, sortBy, sortOrder]);

  // Tree View structure calculation
  const treeRows = useMemo<FlatTreeItem[]>(() => {
    const rawList = [...processesList];
    const pidMap = new Map<number, ServerProcessItem>();
    const childrenMap = new Map<number, ServerProcessItem[]>();

    rawList.forEach((p) => {
      pidMap.set(p.pid, p);
      if (!childrenMap.has(p.pid)) childrenMap.set(p.pid, []);
    });

    const roots: ServerProcessItem[] = [];

    // Separate main services / root processes from sub-workers
    rawList.forEach((p) => {
      // If parent exists in list and is not init (PID 1) or is a direct sub-process
      const hasParentInList = p.ppid !== undefined && p.ppid !== 0 && pidMap.has(p.ppid) && p.ppid !== p.pid;
      
      // We treat system daemons (whose ppid is 1) as distinct service roots for clean UX,
      // while workers (whose ppid is nginx/node/dockerd/sshd) are children under their masters.
      if (hasParentInList && p.ppid !== 1) {
        childrenMap.get(p.ppid!)!.push(p);
      } else if (p.pid !== 1) {
        roots.push(p);
      } else {
        // PID 1 (systemd)
        roots.push(p);
      }
    });

    // Sort roots & children by selected sort
    const sorter = (a: ServerProcessItem, b: ServerProcessItem) => {
      let aVal = sortBy === "res" ? parseProcessMemoryToKb(a.resKb ?? a.resMb) : (a[sortBy] ?? 0);
      let bVal = sortBy === "res" ? parseProcessMemoryToKb(b.resKb ?? b.resMb) : (b[sortBy] ?? 0);
      if (typeof aVal === "string") aVal = Number(aVal) || 0;
      if (typeof bVal === "string") bVal = Number(bVal) || 0;
      return sortOrder === "asc" ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    };

    roots.sort(sorter);
    childrenMap.forEach((children) => children.sort(sorter));

    // Filter matching if searching or filtering by user
    const q = searchQuery.trim().toLowerCase();
    const isMatched = (p: ServerProcessItem): boolean => {
      if (userFilter !== "all" && p.user !== userFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.command || "").toLowerCase().includes(q) ||
        p.pid.toString().includes(q) ||
        p.user.toLowerCase().includes(q)
      );
    };

    // Recursively check if node or any descendant matches
    const hasMatchedDescendant = (p: ServerProcessItem): boolean => {
      if (isMatched(p)) return true;
      const kids = childrenMap.get(p.pid) || [];
      return kids.some((k) => hasMatchedDescendant(k));
    };

    const flat: FlatTreeItem[] = [];

    const traverse = (node: ServerProcessItem, level: number, isLast: boolean) => {
      if (q || userFilter !== "all") {
        if (!hasMatchedDescendant(node)) return;
      }

      const kids = childrenMap.get(node.pid) || [];
      const hasKids = kids.length > 0;
      const isExpanded = !collapsedMap[node.pid];

      flat.push({
        ...node,
        level,
        hasChildren: hasKids,
        isExpanded,
        childCount: kids.length,
        isLastChild: isLast
      });

      if (hasKids && isExpanded) {
        kids.forEach((k, idx) => {
          traverse(k, level + 1, idx === kids.length - 1);
        });
      }
    };

    roots.forEach((r, idx) => {
      traverse(r, 0, idx === roots.length - 1);
    });

    return flat;
  }, [processesList, searchQuery, userFilter, sortBy, sortOrder, collapsedMap]);

  const toggleCollapse = (pid: number) => {
    setCollapsedMap((prev) => ({
      ...prev,
      [pid]: !prev[pid]
    }));
  };

  const handleExpandAll = () => {
    setCollapsedMap({});
    toast.success("已展开所有父子进程节点");
  };

  const handleCollapseAll = () => {
    const newCollapsed: Record<number, boolean> = {};
    processesList.forEach((p) => {
      if (processesList.some((k) => k.ppid === p.pid)) {
        newCollapsed[p.pid] = true;
      }
    });
    setCollapsedMap(newCollapsed);
    toast.success("已折叠所有子进程分支");
  };

  const handleRefreshProcesses = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setProcessesList((prev) =>
        prev.map((p) => ({
          ...p,
          cpu: +(Math.max(0.1, p.cpu + (Math.random() * 2 - 1))).toFixed(1),
          mem: +(Math.max(0.1, p.mem + (Math.random() * 0.4 - 0.2))).toFixed(1),
          resKb: Math.max(500, Math.round((Number(p.resKb ?? (Number(p.resMb) * 1024)) || 50000) + (Math.random() * 10000 - 5000)))
        }))
      );
      setSnapshotTime(new Date().toLocaleTimeString("zh-CN", { hour12: false }));
      setIsRefreshing(false);
      toast.success("已抓取最新进程树快照");
    }, 600);
  };

  const handleCopyCommand = (e: React.MouseEvent, cmd: string, pid: number) => {
    e.stopPropagation();
    navigator.clipboard.writeText(cmd);
    setCopiedPid(pid);
    toast.success(`已复制进程 [PID ${pid}] 启动命令`);
    setTimeout(() => setCopiedPid(null), 2000);
  };

  const handleSortChange = (key: ProcessSortKey) => {
    if (sortBy === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortOrder("desc");
    }
  };

  // Execute Kill Request to Backend
  const handleExecuteKill = () => {
    if (!confirmKillProcess || !server) return;
    setIsKilling(true);

    const payload = {
      serverId: server.id,
      serverIp: server.ip,
      pid: confirmKillProcess.pid,
      processName: confirmKillProcess.name,
      signal: killSignal,
      timestamp: Date.now()
    };

    console.info("[API dispatch] /api/v1/infrastructure/servers/process/kill", payload);

    setTimeout(() => {
      setIsKilling(false);
      const killedPid = confirmKillProcess.pid;
      const killedName = confirmKillProcess.name;
      
      setProcessesList((prev) => prev.filter((p) => p.pid !== killedPid));
      setConfirmKillProcess(null);

      toast.success(`已下发指令终止进程: [PID ${killedPid}] ${killedName}`, {
        description: `机器 ID: ${server.id} (${server.name}) · 信号: ${killSignal}`
      });
    }, 650);
  };

  if (!isOpen || !server) return null;

  const totalCpuUsage = processesList.reduce((acc, p) => acc + p.cpu, 0).toFixed(1);
  const totalMemUsage = processesList.reduce((acc, p) => acc + p.mem, 0).toFixed(1);
  const displayedItemsCount = viewMode === "tree" ? treeRows.length : flatProcesses.length;

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-4 sm:pl-8">
        <div className="w-screen max-w-5xl bg-card border-l border-border/80 shadow-2xl flex flex-col text-foreground font-sans">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-border/70 bg-card/90 flex items-start justify-between gap-4 shrink-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Radio className="size-4 text-primary" />
                <h2 className="text-base font-bold text-foreground">
                  全量系统进程监控 (Process Explorer)
                </h2>
                {server.status === "offline" ? (
                  <Badge variant="danger" className="text-[10px]">
                    主机离线
                  </Badge>
                ) : server.processCollectionMode === "forbidden" ? (
                  <Badge variant="danger" className="text-[10px] bg-rose-500/10 text-rose-400 border-rose-500/20 gap-1">
                    <Lock className="size-2.5" /> 策略已禁用 · 历史快照
                  </Badge>
                ) : !processCollectionEnabled || server.processCollectionMode === "disable_auto" ? (
                  <Badge variant="neutral" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/20 gap-1">
                    <Clock className="size-2.5" /> 按需采样快照
                  </Badge>
                ) : (
                  <Badge variant="success" className="text-[10px]">
                    常驻采集已开启
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                目标节点: <strong className="text-foreground">{server.name}</strong> ({server.ip}) · 当前快照进程数:{" "}
                <span className="font-mono text-primary font-bold">{processesList.length}</span> 个
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={server.processCollectionMode === "forbidden" || server.status === "offline" ? undefined : handleRefreshProcesses}
                disabled={isRefreshing || server.status === "offline" || server.processCollectionMode === "forbidden"}
                className="h-8 text-xs font-mono gap-1.5 cursor-pointer"
                title={
                  server.status === "offline"
                    ? "主机已离线，无法抓取即时快照"
                    : server.processCollectionMode === "forbidden"
                    ? "探针安全策略已硬禁用进程采集"
                    : "向探针下发单次抓取最新快照指令"
                }
              >
                <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`} />
                {isRefreshing ? "采样中..." : "即时抓取快照"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="h-8 w-8 p-0 cursor-pointer hover:bg-rose-500/10 hover:text-rose-500"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          {/* Forbidden Notice Banner */}
          {server.processCollectionMode === "forbidden" && (
            <div className="px-4 sm:px-5 py-2.5 bg-rose-500/10 border-b border-rose-500/25 flex items-center justify-between gap-3 text-xs text-rose-300 font-mono shrink-0">
              <div className="flex items-center gap-2">
                <Lock className="size-4 text-rose-400 shrink-0" />
                <span>探针安全策略已硬禁用进程采集 · 当前展示为历史留存快照 (禁止实时采样)</span>
              </div>
              <span className="text-[11px] text-rose-300/80">只读快照视图</span>
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="px-4 sm:px-5 py-2.5 border-b border-border/60 bg-muted/20 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shrink-0">
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>
                当前展示: <strong className="text-foreground">{displayedItemsCount}</strong> / {processesList.length}
              </span>
              <span>·</span>
              <span>
                进程总 CPU 负载: <strong className="text-indigo-400 font-bold">{totalCpuUsage}%</strong>
              </span>
              <span>·</span>
              <span>
                进程总物理内存: <strong className="text-emerald-400 font-bold">{totalMemUsage}%</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground text-[11px]">
              <span className="flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                快照时间: {snapshotTime}
              </span>
            </div>
          </div>

          {/* Search, User Filter, View Mode & Sorter Toolbar */}
          <div className="p-4 sm:px-5 pb-3 border-b border-border/60 bg-card/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Search Box */}
            <div className="relative flex-1 min-w-[180px] max-w-sm">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索进程名、PID、命令或用户..."
                className="w-full h-8 pl-8.5 pr-8 rounded-lg border border-border/80 bg-muted/40 text-xs font-mono text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer text-xs"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            {/* View Mode & Filters */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Segmented View Mode Toggle */}
              <div className="flex items-center rounded-lg border border-border/80 bg-muted/40 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    viewMode === "list"
                      ? "bg-card text-primary shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="平铺列表展示"
                >
                  <List className="size-3" />
                  列表
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("tree")}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    viewMode === "tree"
                      ? "bg-card text-primary shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  title="树形父子进程 (pstree) 结构展示"
                >
                  <FolderTree className="size-3" />
                  树形结构
                </button>
              </div>

              {/* Tree Quick Actions when in Tree Mode */}
              {viewMode === "tree" && (
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleExpandAll}
                    className="h-8 px-2 text-[11px] font-mono text-muted-foreground hover:text-foreground cursor-pointer"
                    title="展开所有父子进程分支"
                  >
                    展开
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCollapseAll}
                    className="h-8 px-2 text-[11px] font-mono text-muted-foreground hover:text-foreground cursor-pointer"
                    title="折叠所有子进程分支"
                  >
                    折叠
                  </Button>
                </div>
              )}

              {/* User filter (Modern Floating Popover) */}
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen((prev) => !prev);
                    setIsSortMenuOpen(false);
                  }}
                  className={`h-8 px-2.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 font-medium transition-all shadow-2xs cursor-pointer select-none ${
                    isUserMenuOpen
                      ? "bg-primary/15 text-primary border-primary/50 ring-1 ring-primary/20"
                      : "bg-muted/40 hover:bg-muted/70 text-foreground border-border/80 hover:border-primary/40"
                  }`}
                >
                  <User className="size-3 text-muted-foreground" />
                  <span>{userFilter === "all" ? "全部用户" : userFilter}</span>
                  <span className="text-[10px] text-muted-foreground bg-muted px-1 rounded">
                    {userFilter === "all" ? uniqueUsers.length : 1}
                  </span>
                  <ChevronDown className={`size-3 text-muted-foreground transition-transform duration-200 ${isUserMenuOpen ? "rotate-180 text-primary" : ""}`} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-44 max-h-56 overflow-y-auto rounded-xl border border-border/90 bg-popover/95 backdrop-blur-md p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-0.5 font-mono">
                    <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground tracking-wider uppercase flex items-center justify-between border-b border-border/40 mb-1">
                      <span>进程归属用户</span>
                      <span className="text-[9px] bg-muted px-1.5 py-0.2 rounded-full">{uniqueUsers.length}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUserFilter("all");
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        userFilter === "all" ? "bg-primary/15 text-primary font-bold" : "text-foreground hover:bg-muted/70"
                      }`}
                    >
                      <span>全部用户</span>
                      {userFilter === "all" && <Check className="size-3 text-primary" />}
                    </button>
                    {uniqueUsers.map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => {
                          setUserFilter(u);
                          setIsUserMenuOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          userFilter === u ? "bg-primary/15 text-primary font-bold" : "text-foreground hover:bg-muted/70"
                        }`}
                      >
                        <span>{u}</span>
                        {userFilter === u && <Check className="size-3 text-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sort selector (Modern Floating Popover) */}
              <div className="relative" ref={sortMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsSortMenuOpen((prev) => !prev);
                    setIsUserMenuOpen(false);
                  }}
                  className={`h-8 px-2.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 font-medium transition-all shadow-2xs cursor-pointer select-none ${
                    isSortMenuOpen
                      ? "bg-primary/15 text-primary border-primary/50 ring-1 ring-primary/20"
                      : "bg-muted/40 hover:bg-muted/70 text-foreground border-border/80 hover:border-primary/40"
                  }`}
                >
                  <ArrowUpDown className="size-3 text-muted-foreground" />
                  <span>
                    {sortBy === "cpu"
                      ? "CPU%"
                      : sortBy === "res"
                      ? "物理内存"
                      : sortBy === "threads"
                      ? "线程数"
                      : "PID"}
                  </span>
                  <ChevronDown className={`size-3 text-muted-foreground transition-transform duration-200 ${isSortMenuOpen ? "rotate-180 text-primary" : ""}`} />
                </button>

                {isSortMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-48 max-h-56 overflow-y-auto rounded-xl border border-border/90 bg-popover/95 backdrop-blur-md p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-0.5">
                    <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground tracking-wider uppercase flex items-center justify-between border-b border-border/40 mb-1">
                      <span>指标排序规则</span>
                      <ArrowUpDown className="size-3 text-muted-foreground" />
                    </div>
                    {[
                      { key: "cpu" as const, label: "CPU 使用率 (高到低)" },
                      { key: "res" as const, label: "常驻物理内存 (高到低)" },
                      { key: "threads" as const, label: "线程总数 (高到低)" },
                      { key: "pid" as const, label: "PID 进程号" }
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          handleSortChange(item.key);
                          setIsSortMenuOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          sortBy === item.key ? "bg-primary/15 text-primary font-bold" : "text-foreground hover:bg-muted/70"
                        }`}
                      >
                        <span>{item.label}</span>
                        {sortBy === item.key && <Check className="size-3 text-primary" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Process Table Container with generous left/right padding & borders */}
          <div className="flex-1 p-4 sm:p-5 overflow-hidden flex flex-col bg-muted/10">
            <div className="flex-1 rounded-xl border border-border/80 bg-card/60 shadow-xs overflow-x-auto overflow-y-auto relative">
              {displayedItemsCount === 0 ? (
                <div className="p-16 text-center text-xs text-muted-foreground font-mono flex flex-col items-center justify-center gap-2">
                  <Radio className="size-6 text-muted-foreground/40 mb-1" />
                  <span className="font-semibold text-foreground">暂未采集到活跃进程数据</span>
                  <span className="text-[11px] text-muted-foreground/70">
                    {!processCollectionEnabled 
                      ? "该节点未开启实时进程采集，可点击右上角开启或抓取快照"
                      : "节点当前处于静默状态或未上报活跃进程快照"}
                  </span>
                </div>
              ) : (
                <table className="w-full text-left text-xs font-mono border-collapse min-w-[700px]">
                  <thead className="bg-muted/60 text-muted-foreground border-b border-border/70 sticky top-0 z-20 backdrop-blur-md select-none">
                    <tr>
                      <th
                        onClick={() => handleSortChange("pid")}
                        className="px-3.5 py-2.5 font-semibold cursor-pointer hover:text-foreground w-20 min-w-[76px]"
                      >
                        PID
                      </th>
                      <th className="px-3 py-2.5 font-semibold w-24 min-w-[84px]">用户</th>
                      <th className="px-3.5 py-2.5 font-semibold min-w-[280px]">
                        {viewMode === "tree" ? "进程拓扑树与启动命令 (Process Tree)" : "进程命令与启动参数 (Command)"}
                      </th>
                      <th className="px-3 py-2.5 font-semibold w-28 min-w-[96px] text-center" title="Linux 调度状态: R(运行中) S(休眠/等待事件) D(磁盘I/O阻塞) Z(僵尸) T(暂停)">
                        状态 (State)
                      </th>
                      <th
                        onClick={() => handleSortChange("threads")}
                        className="px-3 py-2.5 font-semibold cursor-pointer hover:text-foreground text-center w-18 min-w-[64px] whitespace-nowrap"
                        title="线程数 (Thread Count)"
                      >
                        线程
                      </th>
                      <th
                        onClick={() => handleSortChange("res")}
                        className="px-3.5 py-2.5 font-semibold cursor-pointer hover:text-foreground text-right whitespace-nowrap w-28 min-w-[100px]"
                        title="常驻集物理内存占用 (Resident Set Size)"
                      >
                        常驻内存
                      </th>
                      <th
                        onClick={() => handleSortChange("cpu")}
                        className="px-3.5 py-2.5 font-semibold cursor-pointer hover:text-foreground text-right w-20 min-w-[76px] whitespace-nowrap"
                      >
                        CPU%
                      </th>
                      <th className="px-3 py-2.5 text-center sticky right-0 z-30 bg-muted/90 backdrop-blur-md border-l border-border/70 shadow-[-6px_0_10px_rgba(0,0,0,0.12)] w-24 min-w-[88px] font-semibold whitespace-nowrap">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 bg-card/20">
                    {(viewMode === "tree" ? treeRows : flatProcesses).map((p) => {
                      const isCopied = copiedPid === p.pid;
                      const fullCmd = p.command || p.name;
                      const treeItem = viewMode === "tree" ? (p as FlatTreeItem) : null;

                      return (
                        <tr key={p.pid} className="hover:bg-muted/30 transition-colors group">
                          <td className="px-3.5 py-2.5">
                            <button
                              type="button"
                              onClick={(e) => handleCopyCommand(e, fullCmd, p.pid)}
                              className="font-bold text-primary hover:underline hover:text-primary/80 cursor-pointer inline-flex items-center gap-1 group/pid select-none"
                              title={`点击复制完整启动命令: ${fullCmd}`}
                            >
                              <span>{p.pid}</span>
                              {isCopied ? (
                                <Check className="size-3 text-emerald-400 shrink-0" />
                              ) : (
                                <Copy className="size-2.5 text-muted-foreground/40 group-hover/pid:text-primary opacity-0 group-hover/pid:opacity-100 transition-opacity shrink-0" />
                              )}
                            </button>
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">{p.user}</td>
                          
                          {/* Command Column with Tree Indentation & Collapse Switch */}
                          <td className="px-3.5 py-2.5 font-medium text-foreground">
                            {treeItem ? (
                              <div className="flex items-center gap-1.5" style={{ paddingLeft: `${treeItem.level * 20}px` }}>
                                {treeItem.hasChildren ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleCollapse(treeItem.pid);
                                    }}
                                    className="p-1 rounded-md bg-muted/60 hover:bg-primary/20 text-muted-foreground hover:text-primary cursor-pointer transition-colors shrink-0 flex items-center justify-center border border-border/60"
                                    title={treeItem.isExpanded ? "点击折叠子进程" : "点击展开子进程"}
                                  >
                                    {treeItem.isExpanded ? (
                                      <ChevronDown className="size-3.5 text-primary" />
                                    ) : (
                                      <ChevronRight className="size-3.5 text-muted-foreground" />
                                    )}
                                  </button>
                                ) : treeItem.level > 0 ? (
                                  <span className="text-muted-foreground/60 inline-flex items-center shrink-0 w-4 justify-center">
                                    <CornerDownRight className="size-3.5 text-muted-foreground/40" />
                                  </span>
                                ) : (
                                  <span className="w-4 shrink-0" />
                                )}

                                <div
                                  onClick={() => treeItem.hasChildren && toggleCollapse(treeItem.pid)}
                                  className={`truncate max-w-[200px] sm:max-w-xs md:max-w-md font-mono ${
                                    treeItem.hasChildren ? "cursor-pointer hover:text-primary select-none font-bold" : ""
                                  }`}
                                  title={fullCmd}
                                >
                                  {fullCmd}
                                </div>

                                {treeItem.hasChildren && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleCollapse(treeItem.pid);
                                    }}
                                    className="px-1.5 py-0.2 text-[10px] rounded-full bg-primary/10 hover:bg-primary/25 text-primary border border-primary/30 shrink-0 font-normal cursor-pointer transition-colors"
                                    title={`包含 ${treeItem.childCount} 个子进程，点击${treeItem.isExpanded ? "折叠" : "展开"}`}
                                  >
                                    {treeItem.childCount}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="truncate max-w-[220px] sm:max-w-sm font-mono" title={fullCmd}>
                                {fullCmd}
                              </div>
                            )}
                          </td>

                          {/* Self-explanatory Status Badge */}
                          <td className="px-3 py-2.5 text-center whitespace-nowrap">
                            {p.status === "R" ? (
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                title="运行中 (Running)：正在 CPU 上执行计算或处于就绪运行队列"
                              >
                                运行中 (R)
                              </span>
                            ) : p.status === "D" ? (
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                title="I/O 阻塞 (Disk Sleep)：不可中断睡眠，等待磁盘或网络硬件 I/O 响应"
                              >
                                I/O阻塞 (D)
                              </span>
                            ) : p.status === "Z" ? (
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                title="僵尸进程 (Zombie)：进程已终止，但父进程尚未回收其退出状态"
                              >
                                僵尸 (Z)
                              </span>
                            ) : p.status === "T" ? (
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30"
                                title="已暂停 (Stopped)：被信号停止或处于调试跟踪状态"
                              >
                                已暂停 (T)
                              </span>
                            ) : (
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted/60 text-muted-foreground border border-border/40"
                                title="休眠 (Sleeping)：可中断睡眠，正在等待系统定时器、网络连接或 I/O 事件 (绝大多数常驻后台守护进程的标准状态)"
                              >
                                休眠 (S)
                              </span>
                            )}
                          </td>

                          {/* Threads */}
                          <td className="px-3 py-2.5 text-center text-muted-foreground font-mono whitespace-nowrap">
                            {p.threads || 1}
                          </td>

                          <td className="px-3.5 py-2.5 text-right text-foreground font-mono whitespace-nowrap">
                            {formatProcessMemory(p.resKb ?? p.resMb)}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-bold text-indigo-400 whitespace-nowrap">
                            {p.cpu}%
                          </td>

                          {/* Sticky Right Centered Action Column */}
                          <td className="px-3 py-2.5 text-center sticky right-0 z-10 bg-card/95 group-hover:bg-card border-l border-border/60 shadow-[-6px_0_10px_rgba(0,0,0,0.12)]">
                            <div className="flex items-center justify-center">
                              {/* Kill Process Action */}
                              {canRemoteExec ? (
                                <button
                                  type="button"
                                  onClick={() => setConfirmKillProcess(p)}
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-mono font-bold text-rose-300 bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/40 hover:border-rose-500/80 transition-all cursor-pointer active:scale-95 shadow-2xs"
                                  title="向 Agent 发送终止指令"
                                >
                                  <PowerOff className="size-3 text-rose-400" />
                                  Kill
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono text-muted-foreground/40 bg-muted/40 border border-border/50 cursor-not-allowed select-none opacity-60"
                                  title={server.status === "offline" ? "节点当前已离线，无法下发指令" : "该节点未开启远程执行权限 (allowRemoteExec: false)"}
                                >
                                  <PowerOff className="size-3 text-muted-foreground/40" />
                                  <span className="line-through decoration-muted-foreground/40">Kill</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Footer Info */}
          <div className="p-3 sm:px-5 border-t border-border/70 bg-card/80 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground shrink-0">
            <div className="flex items-center gap-3">
              <span>💡 提示：点击 PID 即可快速复制完整启动命令；切换【树形结构】可点击小箭头或数字徽标折叠/展开子进程</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={onClose} className="h-8 text-xs font-medium cursor-pointer">
                关闭抽屉
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* High-Contrast Modal for Kill Confirmation */}
      {confirmKillProcess && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-card border border-rose-500/50 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 text-foreground font-sans">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 shrink-0 border border-rose-500/30">
                <ShieldAlert className="size-6" />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  危险操作：确认终止系统进程？
                </h3>
                <p className="text-xs text-muted-foreground">
                  终止生产核心服务可能导致业务中断或数据不一致，请谨慎操作。
                </p>
              </div>
            </div>

            {/* Stale / Historical Snapshot Warning Alert */}
            {(!processCollectionEnabled || snapshotTime !== "刚刚") && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-300 text-xs">
                <AlertTriangle className="size-4.5 shrink-0 text-amber-400 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-200">
                    <span>⚠️ 当前为历史快照 ({snapshotTime}) · 存在误杀风险</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-200/80">
                    自动常驻采集未开启，进程状态可能已变更或 PID 已被 Linux 内核复用。终止前请务必确认目标命令无误。
                  </p>
                </div>
              </div>
            )}

            {/* Target Process Summary Card */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 font-mono text-xs space-y-2">
              <div className="flex justify-between items-center text-muted-foreground border-b border-border/50 pb-1.5">
                <span>目标节点:</span>
                <span className="text-foreground font-bold">{server.name} ({server.ip})</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>PID / 进程名:</span>
                <span className="text-primary font-bold">{confirmKillProcess.pid} ({confirmKillProcess.name})</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>运行用户 / 资源:</span>
                <span>{confirmKillProcess.user} · CPU {confirmKillProcess.cpu}% · RES {formatProcessMemory(confirmKillProcess.resKb ?? confirmKillProcess.resMb)}</span>
              </div>
              <div className="text-[11px] text-muted-foreground/80 break-all bg-card/60 p-2 rounded border border-border/40">
                <strong>启动命令:</strong> {confirmKillProcess.command || confirmKillProcess.name}
              </div>
            </div>

            {/* Signal Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <span>选择下发系统信号 (Signal):</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setKillSignal("SIGTERM")}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    killSignal === "SIGTERM"
                      ? "border-amber-500/60 bg-amber-500/15 text-amber-300 font-bold"
                      : "border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="text-xs">SIGTERM (信号 15)</div>
                  <div className="text-[10px] opacity-75 font-normal">优雅终止，允许进程保存状态退出 (推荐)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setKillSignal("SIGKILL")}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                    killSignal === "SIGKILL"
                      ? "border-rose-500/60 bg-rose-500/15 text-rose-300 font-bold"
                      : "border-border/60 bg-muted/30 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="text-xs">SIGKILL (信号 9)</div>
                  <div className="text-[10px] opacity-75 font-normal">强制终止，由内核立即销毁，不可捕获</div>
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmKillProcess(null)}
                disabled={isKilling}
                className="h-8 text-xs cursor-pointer"
              >
                取消
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleExecuteKill}
                disabled={isKilling}
                className="h-8 text-xs font-bold gap-1.5 bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
              >
                {isKilling ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" />
                    正在下发指令...
                  </>
                ) : (
                  <>
                    <PowerOff className="size-3.5" />
                    确认下发 Kill 指令
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
