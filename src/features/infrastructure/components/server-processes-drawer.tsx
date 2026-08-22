import { useState, useMemo, useEffect } from "react";
import {
  Radio,
  X,
  Search,
  RefreshCw,
  Copy,
  Check,
  Cpu,
  Layers,
  Terminal,
  Activity,
  AlertTriangle,
  HardDrive,
  PowerOff,
  ShieldAlert,
  AlertCircle
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

type ProcessSortKey = "cpu" | "mem" | "pid" | "res";

export function ServerProcessesDrawer({
  server,
  isOpen,
  onClose,
  processCollectionEnabled,
  onEnableCollection
}: ServerProcessesDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [sortBy, setSortBy] = useState<ProcessSortKey>("cpu");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedPid, setCopiedPid] = useState<number | null>(null);
  const [snapshotTime, setSnapshotTime] = useState<string>("刚刚");

  // Kill confirmation modal state
  const [confirmKillProcess, setConfirmKillProcess] = useState<ServerProcessItem | null>(null);
  const [killSignal, setKillSignal] = useState<"SIGTERM" | "SIGKILL">("SIGTERM");
  const [isKilling, setIsKilling] = useState(false);

  const canRemoteExec = server?.status !== "offline" && server?.allowRemoteExec !== false;

  const baseProcesses = useMemo(() => {
    return getMockServerProcesses(server);
  }, [server]);

  const [processesList, setProcessesList] = useState<ServerProcessItem[]>(baseProcesses);

  // Sync when server changes
  useEffect(() => {
    setProcessesList(getMockServerProcesses(server));
    setSnapshotTime("刚刚");
  }, [server]);

  // Available unique users
  const uniqueUsers = useMemo(() => {
    const set = new Set<string>();
    processesList.forEach((p) => set.add(p.user));
    return Array.from(set).sort();
  }, [processesList]);

  // Filtered & Sorted Processes
  const filteredProcesses = useMemo(() => {
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
      let aVal = sortBy === "res" ? (a.resMb ?? 0) : (a[sortBy] ?? 0);
      let bVal = sortBy === "res" ? (b.resMb ?? 0) : (b[sortBy] ?? 0);
      if (typeof aVal === "string") aVal = Number(aVal) || 0;
      if (typeof bVal === "string") bVal = Number(bVal) || 0;

      return sortOrder === "asc" ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

    return result;
  }, [processesList, searchQuery, userFilter, sortBy, sortOrder]);

  const handleRefreshProcesses = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setProcessesList((prev) =>
        prev.map((p) => ({
          ...p,
          cpu: +(Math.max(0.1, p.cpu + (Math.random() * 2 - 1))).toFixed(1),
          mem: +(Math.max(0.1, p.mem + (Math.random() * 0.4 - 0.2))).toFixed(1),
          resMb: Math.max(10, Math.round((p.resMb || 50) + (Math.random() * 20 - 10)))
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
                <Badge variant={processCollectionEnabled ? "success" : "neutral"} className="text-[10px]">
                  {processCollectionEnabled ? "常驻采集已开启" : "自动采集已停用"}
                </Badge>
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
                onClick={handleRefreshProcesses}
                disabled={isRefreshing || server.status === "offline"}
                className="h-8 text-xs font-mono gap-1.5 cursor-pointer"
                title={server.status === "offline" ? "主机已离线，无法抓取即时快照" : "向探针下发单次抓取最新快照指令"}
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

          {/* Quick Metrics Bar */}
          <div className="px-4 sm:px-5 py-2.5 border-b border-border/60 bg-muted/20 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shrink-0">
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>
                总计展示: <strong className="text-foreground">{filteredProcesses.length}</strong> / {processesList.length}
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

          {/* Search, User Filter & Sorter Toolbar */}
          <div className="p-4 sm:px-5 pb-3 border-b border-border/60 bg-card/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Search Box */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索进程名、PID、启动命令或用户..."
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

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* User filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground text-[11px]">用户:</span>
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="h-8 rounded-lg border border-border/80 bg-muted/40 px-2 text-xs font-mono text-foreground outline-none cursor-pointer"
                >
                  <option value="all" className="bg-popover text-foreground">全部用户 ({uniqueUsers.length})</option>
                  {uniqueUsers.map((u) => (
                    <option key={u} value={u} className="bg-popover text-foreground">{u}</option>
                  ))}
                </select>
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-muted-foreground text-[11px]">排序:</span>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as ProcessSortKey)}
                  className="h-8 rounded-lg border border-border/80 bg-muted/40 px-2 text-xs font-mono text-foreground outline-none cursor-pointer"
                >
                  <option value="cpu" className="bg-popover text-foreground">CPU% (高到低)</option>
                  <option value="mem" className="bg-popover text-foreground">MEM% (高到低)</option>
                  <option value="res" className="bg-popover text-foreground">常驻物理内存 (高到低)</option>
                  <option value="pid" className="bg-popover text-foreground">PID 编号</option>
                </select>
              </div>
            </div>
          </div>

          {/* Process Table Container with generous left/right padding & borders */}
          <div className="flex-1 p-4 sm:p-5 overflow-hidden flex flex-col bg-muted/10">
            <div className="flex-1 rounded-xl border border-border/80 bg-card/60 shadow-xs overflow-x-auto overflow-y-auto relative">
              {filteredProcesses.length === 0 ? (
                <div className="p-12 text-center text-xs text-muted-foreground font-mono">
                  未找到匹配的进程条目
                </div>
              ) : (
                <table className="w-full text-left text-xs font-mono border-collapse min-w-[700px]">
                  <thead className="bg-muted/60 text-muted-foreground border-b border-border/70 sticky top-0 z-20 backdrop-blur-md select-none">
                    <tr>
                      <th
                        onClick={() => handleSortChange("pid")}
                        className="px-3.5 py-2.5 font-semibold cursor-pointer hover:text-foreground w-16"
                      >
                        PID
                      </th>
                      <th className="px-3 py-2.5 font-semibold w-24">用户</th>
                      <th className="px-3.5 py-2.5 font-semibold min-w-[220px]">进程命令与启动参数 (Command)</th>
                      <th className="px-3 py-2.5 font-semibold w-28 text-center" title="Linux 调度状态: R(运行中) S(休眠/等待事件) D(磁盘I/O阻塞) Z(僵尸) T(暂停)">
                        状态 (State)
                      </th>
                      <th
                        onClick={() => handleSortChange("res")}
                        className="px-3.5 py-2.5 font-semibold cursor-pointer hover:text-foreground text-right whitespace-nowrap min-w-[90px]"
                        title="常驻集物理内存占用 (Resident Set Size)"
                      >
                        常驻内存
                      </th>
                      <th
                        onClick={() => handleSortChange("cpu")}
                        className="px-3 py-2.5 font-semibold cursor-pointer hover:text-foreground text-right w-18 whitespace-nowrap"
                      >
                        CPU%
                      </th>
                      <th
                        onClick={() => handleSortChange("mem")}
                        className="px-3 py-2.5 font-semibold cursor-pointer hover:text-foreground text-right w-18 whitespace-nowrap"
                      >
                        MEM%
                      </th>
                      <th className="px-3 py-2.5 text-center sticky right-0 z-30 bg-muted/90 backdrop-blur-md border-l border-border/70 shadow-[-6px_0_10px_rgba(0,0,0,0.12)] min-w-[90px] w-28 font-semibold whitespace-nowrap">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 bg-card/20">
                    {filteredProcesses.map((p) => {
                      const isCopied = copiedPid === p.pid;
                      const fullCmd = p.command || p.name;

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
                          <td className="px-3.5 py-2.5 font-medium text-foreground">
                            <div className="truncate max-w-[220px] sm:max-w-sm" title={fullCmd}>
                              {fullCmd}
                            </div>
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

                          <td className="px-3.5 py-2.5 text-right text-foreground font-mono whitespace-nowrap">
                            {p.resMb ? `${p.resMb} MB` : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-indigo-400 whitespace-nowrap">
                            {p.cpu}%
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-emerald-400 whitespace-nowrap">
                            {p.mem}%
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
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-mono text-muted-foreground/40 bg-muted/30 border border-border/40 cursor-not-allowed select-none"
                                  title={server.status === "offline" ? "节点当前已离线，无法下发指令" : "该节点未开启远程执行权限 (allowRemoteExec: false)"}
                                >
                                  <PowerOff className="size-3" />
                                  Kill
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

          {/* Drawer Footer */}
          <div className="p-3 sm:px-5 border-t border-border/70 bg-card/90 flex items-center justify-between text-xs font-mono text-muted-foreground shrink-0">
            <span className="truncate">
              💡 单击 PID 快速复制启动命令；{canRemoteExec ? "点击 Kill 可向机器下发信号终止进程" : "当前节点已禁用远程终止指令"}
            </span>
            <Button size="sm" variant="outline" onClick={onClose} className="h-7 text-xs cursor-pointer">
              关闭窗口
            </Button>
          </div>
        </div>
      </div>

      {/* Kill Process Confirmation Modal */}
      {confirmKillProcess && (
        <div className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-150 font-sans">
          <div className="w-full max-w-md rounded-xl border border-rose-500/40 bg-card p-5 shadow-2xl space-y-4 text-foreground">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-500/15 text-rose-400 shrink-0 border border-rose-500/30">
                <ShieldAlert className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  危险操作：下发终止进程指令
                </h3>
                <p className="text-xs text-muted-foreground">
                  即将向目标节点下发系统信号强制终止该进程，请谨慎操作。
                </p>
              </div>
            </div>

            {/* Target Details Card */}
            <div className="rounded-lg border border-border/80 bg-muted/30 p-3 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">目标主机:</span>
                <strong className="text-foreground">{server.name} ({server.id})</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">目标进程:</span>
                <span className="text-primary font-bold">PID {confirmKillProcess.pid} ({confirmKillProcess.name})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">执行用户:</span>
                <span className="text-foreground">{confirmKillProcess.user}</span>
              </div>
              <div className="pt-1 border-t border-border/50">
                <span className="text-muted-foreground text-[11px] block mb-1">执行命令行:</span>
                <div className="p-1.5 rounded bg-background/80 text-[11px] text-muted-foreground break-all border border-border/60">
                  {confirmKillProcess.command || confirmKillProcess.name}
                </div>
              </div>
            </div>

            {/* Signal Selection */}
            <div className="space-y-1.5 text-xs">
              <label className="text-muted-foreground font-medium block">
                选择终止信号 (Signal):
              </label>
              <div className="grid grid-cols-2 gap-2 font-mono">
                <button
                  type="button"
                  onClick={() => setKillSignal("SIGTERM")}
                  className={`p-2 rounded-lg border text-left cursor-pointer transition-colors ${
                    killSignal === "SIGTERM"
                      ? "border-primary bg-primary/10 text-primary font-bold"
                      : "border-border/70 bg-card hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <div className="text-xs">SIGTERM (15)</div>
                  <div className="text-[10px] text-muted-foreground">优雅安全退出</div>
                </button>
                <button
                  type="button"
                  onClick={() => setKillSignal("SIGKILL")}
                  className={`p-2 rounded-lg border text-left cursor-pointer transition-colors ${
                    killSignal === "SIGKILL"
                      ? "border-rose-500 bg-rose-500/15 text-rose-400 font-bold"
                      : "border-border/70 bg-card hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <div className="text-xs">SIGKILL (9)</div>
                  <div className="text-[10px] text-muted-foreground">强制立即终止</div>
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
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
                <PowerOff className={`size-3.5 ${isKilling ? "animate-spin" : ""}`} />
                {isKilling ? "正在下发指令..." : "确认下发 Kill 指令"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
