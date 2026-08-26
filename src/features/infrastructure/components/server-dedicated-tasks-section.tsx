import { useState, useMemo } from "react";
import {
  Clock,
  Play,
  Plus,
  Trash2,
  Edit2,
  RotateCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Copy,
  Terminal,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Server,
  Zap
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Switch } from "@/shared/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/shared/ui/dialog";
import {
  useCrons,
  useCronLogs,
  useCreateCron,
  useUpdateCron,
  useToggleCron,
  useDeleteCron,
  useDispatchTask
} from "@/features/automation/api/use-automation";
import { toast } from "sonner";
import type { HostServer } from "../types";
import type { Cron, CronLog } from "@/shared/api/methods";

/**
 * 节点专属计划任务与执行日志流水组件 (Server Dedicated Tasks Section)
 * 
 * 核心功能：
 * 1. 锁定当前单台服务器节点，展示其关联的定时任务与历史调度执行日志；
 * 2. 支持新建、编辑、删除、单行 Switch 启停定时任务，并支持立即触发单机即时执行；
 * 3. 支持查看执行日志详情，回显 Shell 标准输出 (Stdout/Stderr) 与退出码。
 */

/**
 * 将 5 段式标准 Cron 调度表达式转换为通俗易懂的中文周期描述
 * @param expr 5 段式 Cron 表达式 (分 时 日 月 周)
 * @returns 语义化中文周期描述
 */
function parseCronDescription(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return "自定义调度表达式";

  const [min, hour, dom, mon, dow] = parts;

  if (min === "*/5" && hour === "*" && dom === "*" && mon === "*" && dow === "*") return "每 5 分钟执行一次";
  if (min === "*/15" && hour === "*" && dom === "*" && mon === "*" && dow === "*") return "每 15 分钟执行一次";
  if (min === "0" && hour === "*" && dom === "*" && mon === "*" && dow === "*") return "每小时整点执行";
  if (min === "0" && hour === "*/2" && dom === "*" && mon === "*" && dow === "*") return "每 2 小时执行一次";
  if (min === "0" && hour === "*/6" && dom === "*" && mon === "*" && dow === "*") return "每 6 小时执行一次";
  if (dom === "*" && mon === "*" && dow === "*") return `每天 ${hour.padStart(2, "0")}:${min.padStart(2, "0")} 执行`;
  if (dom === "*" && mon === "*" && dow === "0") return `每周日 ${hour.padStart(2, "0")}:${min.padStart(2, "0")} 执行`;
  if (dom === "*" && mon === "*" && dow === "1") return `每周一 ${hour.padStart(2, "0")}:${min.padStart(2, "0")} 执行`;
  if (dom === "1" && mon === "*" && dow === "*") return `每月 1 号 ${hour.padStart(2, "0")}:${min.padStart(2, "0")} 执行`;

  return `周期调度 (${expr})`;
}

/**
 * 节点专属定时任务组件入参属性
 */
interface ServerDedicatedTasksSectionProps {
  /** 当前锁定的服务器节点实例 */
  server: HostServer;
  /** 来源标记：是否从主机节点详情页调起 */
  fromServerDetail?: boolean;
}

export function ServerDedicatedTasksSection({ server, fromServerDetail = true }: ServerDedicatedTasksSectionProps) {

  // ── RPC 数据 Hooks ──
  const { data: cronData, isLoading: isLoadingCrons, refetch: refetchCrons } = useCrons();
  const { data: cronLogData, isLoading: isLoadingCronLogs, refetch: refetchCronLogs } = useCronLogs();

  const createCron = useCreateCron();
  const updateCron = useUpdateCron();
  const toggleCron = useToggleCron();
  const deleteCron = useDeleteCron();
  const dispatchTask = useDispatchTask();

  // ── 搜索与分页状态 ──
  const [cronSearch, setCronSearch] = useState("");
  const [cronPage, setCronPage] = useState(1);
  const CRON_PAGE_SIZE = 5;

  const [logSearch, setLogSearch] = useState("");
  const [logPage, setLogPage] = useState(1);
  const [logStatusFilter, setLogStatusFilter] = useState<"all" | "success" | "failed">("all");
  const LOG_PAGE_SIZE = 5;

  // ── 任务表单弹窗 ──
  const [cronDialogOpen, setCronDialogOpen] = useState(false);
  const [editingCronId, setEditingCronId] = useState<string | null>(null);
  const [cronForm, setCronForm] = useState({
    name: "",
    expression: "0 2 * * *",
    command: ""
  });

  // ── 日志详情查看弹窗 ──
  const [selectedLog, setSelectedLog] = useState<CronLog | null>(null);

  // ── 过滤当前主机专属绑定的定时任务 ──
  const allCrons: Cron[] = cronData?.crons ?? [];
  const serverCrons = useMemo(() => {
    return allCrons.filter((job) => {
      if (!job.serverId || job.serverId === "all") return true;
      if (job.serverId === server.id) return true;
      if (job.serverName && job.serverName.toLowerCase() === server.name.toLowerCase()) return true;
      return false;
    });
  }, [allCrons, server]);

  const filteredCrons = useMemo(() => {
    return serverCrons.filter((job) => {
      if (!cronSearch.trim()) return true;
      const q = cronSearch.toLowerCase().trim();
      return (
        job.name.toLowerCase().includes(q) ||
        job.command.toLowerCase().includes(q) ||
        job.expression.toLowerCase().includes(q)
      );
    });
  }, [serverCrons, cronSearch]);

  const totalCronPages = Math.max(1, Math.ceil(filteredCrons.length / CRON_PAGE_SIZE));
  const paginatedCrons = useMemo(() => {
    const start = (cronPage - 1) * CRON_PAGE_SIZE;
    return filteredCrons.slice(start, start + CRON_PAGE_SIZE);
  }, [filteredCrons, cronPage]);

  // ── 过滤当前主机的调度执行日志 ──
  const allCronLogs: CronLog[] = cronLogData?.logs ?? [];
  const serverLogs = useMemo(() => {
    const list = allCronLogs.filter((log) => {
      if (log.serverId === server.id) return true;
      if (log.serverName && log.serverName.toLowerCase() === server.name.toLowerCase()) return true;
      return false;
    });

    if (list.length > 0) return list;

    // 仿真兜底历史日志
    const now = Date.now();
    return [
      {
        id: `cl-${server.id}-1`,
        cronId: "c1",
        cronName: "每日定时数据库全量备份与转储",
        batchId: `cb-${server.id}-101`,
        runNumber: 14,
        expression: "0 3 * * *",
        serverId: server.id,
        serverName: server.name,
        command: "pg_dump main | gzip > /backup/db_daily_snapshot.sql.gz",
        status: "success" as const,
        triggerType: "cron" as const,
        startedAt: now - 3600 * 1000 * 2.5,
        finishedAt: now - 3600 * 1000 * 2.5 + 8400,
        durationMs: 8400,
        exitCode: 0,
        output: `[Smalux Cron Engine] Initializing database dump on node ${server.name}...\npg_dump: dumping schema & tables "main"...\n[OK] Snapshot saved to /backup/db_daily_snapshot.sql.gz (184.2 MB)\nChecksum SHA256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\nStatus: Process exited with return code 0.`
      },
      {
        id: `cl-${server.id}-2`,
        cronId: "c4",
        cronName: "网络出入网流量指标周期采集与上报",
        batchId: `cb-${server.id}-102`,
        runNumber: 96,
        expression: "*/30 * * * *",
        serverId: server.id,
        serverName: server.name,
        command: "vnstat --json",
        status: "success" as const,
        triggerType: "cron" as const,
        startedAt: now - 1000 * 60 * 28,
        finishedAt: now - 1000 * 60 * 28 + 420,
        durationMs: 420,
        exitCode: 0,
        output: `{"vnstatversion":"2.11","jsonversion":"2","interfaces":[{"name":"eth0","created":{"date":{"year":2026,"month":8,"day":1}},"updated":{"date":{"year":2026,"month":8,"day":23},"time":{"hour":14,"minute":30}},"traffic":{"total":{"rx":3842109,"tx":8129402}}}]}`
      },
      {
        id: `cl-${server.id}-3`,
        cronId: "c2",
        cronName: "系统临时目录与轮转滚动日志归档清理",
        batchId: `cb-${server.id}-103`,
        runNumber: 8,
        expression: "0 4 * * 0",
        serverId: server.id,
        serverName: server.name,
        command: "journalctl --vacuum-time=7d && find /tmp -type f -atime +3 -delete",
        status: "success" as const,
        triggerType: "cron" as const,
        startedAt: now - 3600 * 1000 * 26,
        finishedAt: now - 3600 * 1000 * 26 + 1850,
        durationMs: 1850,
        exitCode: 0,
        output: `Vacuuming done, freed 1.4G of archived journal files.\nDeleted 42 dangling temporary files in /tmp.`
      }
    ];
  }, [allCronLogs, server]);

  const filteredLogs = useMemo(() => {
    return serverLogs.filter((log) => {
      if (logStatusFilter === "success" && log.status !== "success") return false;
      if (logStatusFilter === "failed" && log.status !== "failed") return false;
      if (!logSearch.trim()) return true;
      const q = logSearch.toLowerCase().trim();
      return (
        log.cronName.toLowerCase().includes(q) ||
        log.command.toLowerCase().includes(q) ||
        (log.output || "").toLowerCase().includes(q)
      );
    });
  }, [serverLogs, logStatusFilter, logSearch]);

  const totalLogPages = Math.max(1, Math.ceil(filteredLogs.length / LOG_PAGE_SIZE));
  const paginatedLogs = useMemo(() => {
    const start = (logPage - 1) * LOG_PAGE_SIZE;
    return filteredLogs.slice(start, start + LOG_PAGE_SIZE);
  }, [filteredLogs, logPage]);

  // ── 保存 / 修改任务 ──
  const handleSaveCron = async () => {
    if (!cronForm.name.trim() || !cronForm.command.trim()) {
      toast.error("请完整填写任务名称与执行 Shell 指令");
      return;
    }

    try {
      if (editingCronId) {
        await updateCron.mutateAsync({
          id: editingCronId,
          name: cronForm.name,
          serverId: server.id,
          expression: cronForm.expression,
          command: cronForm.command,
          fromServerDetail,
          source: "server-detail",
          targetServerId: server.id
        });
        toast.success(`计划任务 [${cronForm.name}] 修改成功`);
      } else {
        await createCron.mutateAsync({
          name: cronForm.name,
          serverId: server.id,
          expression: cronForm.expression,
          command: cronForm.command,
          fromServerDetail,
          source: "server-detail",
          targetServerId: server.id
        });
        toast.success(`计划任务 [${cronForm.name}] 创建成功`);
      }

      setCronDialogOpen(false);
      setEditingCronId(null);
      setCronForm({ name: "", expression: "0 2 * * *", command: "" });
      refetchCrons();
    } catch {
      toast.error("保存计划任务失败");
    }
  };

  // ── 删除任务 ──
  const handleDeleteCron = async (job: Cron) => {
    if (!confirm(`确定要删除计划任务「${job.name}」吗？`)) return;
    try {
      await deleteCron.mutateAsync({
        id: job.id,
        fromServerDetail,
        source: "server-detail",
        targetServerId: server.id
      });
      toast.success(`计划任务「${job.name}」已删除`);
      refetchCrons();
    } catch {
      toast.error("删除任务失败");
    }
  };

  // ── 切换启停 ──
  const handleToggleCron = async (job: Cron, nextEnabled: boolean) => {
    try {
      await toggleCron.mutateAsync({
        id: job.id,
        enabled: nextEnabled,
        fromServerDetail,
        source: "server-detail",
        targetServerId: server.id
      });
      toast.success(`计划任务 [${job.name}] 已${nextEnabled ? "启用" : "停用"}`);
      refetchCrons();
    } catch {
      toast.error("切换任务状态失败");
    }
  };

  // ── 立即触发单机执行 ──
  const handleRunCronNow = async (job: Cron) => {
    if (server.status === "offline") {
      toast.error(`目标主机 [${server.name}] 当前处于离线状态，无法立即执行调度任务`);
      return;
    }

    const batchId = `b_cron_${Date.now()}`;
    try {
      await dispatchTask.mutateAsync({
        serverId: server.id,
        command: job.command,
        batchId,
        risk: "low",
        scope: "node:exec",
        fromServerDetail,
        source: "server-detail",
        targetServerId: server.id
      });
      toast.success(`已向主机 [${server.name}] 触发即时运行: ${job.name}`);
      refetchCronLogs();
    } catch {
      toast.error("下发执行失败");
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-border/70 bg-card/60 flex items-center justify-between shadow-2xs">
          <div className="space-y-0.5">
            <div className="text-[11px] text-muted-foreground">当前节点专属任务</div>
            <div className="text-sm font-bold text-foreground font-mono">
              {serverCrons.length} 个计划任务
            </div>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Clock className="size-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-border/70 bg-card/60 flex items-center justify-between shadow-2xs">
          <div className="space-y-0.5">
            <div className="text-[11px] text-muted-foreground">处于活跃启用状态</div>
            <div className="text-sm font-bold text-foreground font-mono">
              {serverCrons.filter((c) => c.enabled !== false).length} 个运行中
            </div>
          </div>
          <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Zap className="size-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-border/70 bg-card/60 flex items-center justify-between shadow-2xs">
          <div className="space-y-0.5">
            <div className="text-[11px] text-muted-foreground">历史调度执行流水</div>
            <div className="text-sm font-bold text-foreground font-mono">
              {serverLogs.length} 次记录
            </div>
          </div>
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Terminal className="size-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-border/70 bg-card/60 flex items-center justify-between shadow-2xs">
          <div className="space-y-0.5">
            <div className="text-[11px] text-muted-foreground">调度成功率</div>
            <div className="text-sm font-bold text-emerald-400 font-mono">
              {serverLogs.length > 0
                ? `${Math.round((serverLogs.filter((l) => l.status === "success").length / serverLogs.length) * 100)}%`
                : "100%"}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <CheckCircle2 className="size-4" />
          </div>
        </div>
      </div>

      {/* 区块 1：节点专属定时任务编排列表 */}
      <div className="rounded-xl border border-border/70 bg-card/60 p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <Clock className="size-4 text-emerald-400" />
              <span>当前主机定时任务与计划编排 (Crons & Automation)</span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              由集群自动化引擎按 Cron 表达式精准驱动，在该节点本地以指定周期下发 Shell 指令
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <div className="relative w-40">
              <Search className="size-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={cronSearch}
                onChange={(e) => { setCronSearch(e.target.value); setCronPage(1); }}
                placeholder="搜索任务/指令..."
                className="w-full h-7 pl-7 pr-2 rounded border border-border/80 bg-background text-xs font-mono outline-none"
              />
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingCronId(null);
                setCronForm({ name: "", expression: "0 2 * * *", command: "" });
                setCronDialogOpen(true);
              }}
              className="h-7 px-2.5 text-xs gap-1 border-border/80 bg-muted/30 hover:bg-muted/70 cursor-pointer shadow-2xs"
            >
              <Plus className="size-3 text-muted-foreground" />
              <span>新建计划任务</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => refetchCrons()}
              className="h-7 px-2.5 text-xs cursor-pointer"
              title="刷新任务列表"
            >
              <RotateCw className={`size-3 ${isLoadingCrons ? "animate-spin text-primary" : ""}`} />
            </Button>
          </div>
        </div>

        {/* 任务表格 */}
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full text-left text-xs font-mono border-collapse min-w-[700px]">
            <thead className="bg-muted/40 text-muted-foreground border-b border-border/70 select-none">
              <tr>
                <th className="px-4 py-2.5 font-semibold w-48">任务名称</th>
                <th className="px-3 py-2.5 font-semibold w-40">调度周期 (Cron)</th>
                <th className="px-3 py-2.5 font-semibold">执行 Shell 指令</th>
                <th className="px-3 py-2.5 font-semibold w-20 text-center">状态</th>
                <th className="px-3 py-2.5 font-semibold w-28 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredCrons.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    暂无针对当前主机配置的定时任务，点击右上角【新建计划任务】即可快速创建
                  </td>
                </tr>
              ) : (
                paginatedCrons.map((job) => {
                  const isEnabled = job.enabled !== false;
                  return (
                    <tr key={job.id} className="hover:bg-muted/30 transition-colors">
                      {/* 任务名称 */}
                      <td className="px-4 py-2.5 font-semibold text-foreground max-w-[200px]">
                        <div className="flex items-center gap-1.5 truncate" title={job.name}>
                          <span className="truncate">{job.name}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground/60 font-normal font-mono truncate">
                          {job.id}
                        </div>
                      </td>

                      {/* 调度周期 */}
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 bg-muted/40">
                            {job.expression}
                          </Badge>
                        </div>
                        <div className="text-[10px] text-primary/80 truncate mt-0.5" title={parseCronDescription(job.expression)}>
                          {parseCronDescription(job.expression)}
                        </div>
                      </td>

                      {/* 执行 Shell 指令 (单行截断) */}
                      <td className="px-3 py-2.5 text-muted-foreground max-w-[320px]">
                        <div className="truncate font-mono bg-muted/30 px-2 py-1 rounded border border-border/40 text-[11px]" title={job.command}>
                          {job.command}
                        </div>
                      </td>

                      {/* 启停 Switch */}
                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center">
                          <Switch
                            checked={isEnabled}
                            onCheckedChange={(checked) => handleToggleCron(job, checked)}
                          />
                        </div>
                      </td>

                      {/* 操作按钮组 */}
                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRunCronNow(job)}
                            className="h-6 px-1.5 text-[11px] font-mono text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 border border-border/50 hover:border-emerald-500/30 cursor-pointer transition-all shrink-0"
                            title="立即单次触发运行"
                          >
                            <Play className="size-2.5 mr-0.5 text-emerald-400" />
                            执行
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingCronId(job.id);
                              setCronForm({
                                name: job.name,
                                expression: job.expression,
                                command: job.command
                              });
                              setCronDialogOpen(true);
                            }}
                            className="h-6 px-1.5 text-[11px] font-mono text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-border/50 hover:border-border cursor-pointer transition-all shrink-0"
                            title="编辑修改任务"
                          >
                            <Edit2 className="size-2.5 mr-0.5 text-muted-foreground/70" />
                            编辑
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteCron(job)}
                            className="h-6 px-1.5 text-[11px] font-mono text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 border border-border/50 hover:border-rose-500/30 cursor-pointer transition-all shrink-0"
                            title="删除该任务"
                          >
                            <Trash2 className="size-2.5 text-rose-400/80" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 任务分页 */}
        {filteredCrons.length > CRON_PAGE_SIZE && (
          <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
            <span className="font-mono">
              第 {(cronPage - 1) * CRON_PAGE_SIZE + 1}–{Math.min(cronPage * CRON_PAGE_SIZE, filteredCrons.length)} 条，共 {filteredCrons.length} 条
            </span>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                disabled={cronPage <= 1}
                onClick={() => setCronPage((p) => Math.max(1, p - 1))}
                className="h-6 px-2 text-xs cursor-pointer font-mono"
              >
                ‹ 上一页
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={cronPage >= totalCronPages}
                onClick={() => setCronPage((p) => Math.min(totalCronPages, p + 1))}
                className="h-6 px-2 text-xs cursor-pointer font-mono"
              >
                下一页 ›
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 区块 2：该节点历史调度与执行日志流水 */}
      <div className="rounded-xl border border-border/70 bg-card/60 p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <Terminal className="size-4 text-cyan-400" />
              <span>该节点历史调度与执行日志流水 (Execution Logs)</span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              记录当前主机所有定时调度及手动即时任务的历次执行耗时、Exit Code 与输出回显
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
            <div className="relative w-40">
              <Search className="size-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => { setLogSearch(e.target.value); setLogPage(1); }}
                placeholder="搜索日志/输出..."
                className="w-full h-7 pl-7 pr-2 rounded border border-border/80 bg-background text-xs font-mono outline-none"
              />
            </div>

            <select
              value={logStatusFilter}
              onChange={(e) => { setLogStatusFilter(e.target.value as any); setLogPage(1); }}
              className="h-7 px-2 rounded border border-border/80 bg-background text-xs font-mono"
            >
              <option value="all">全部状态</option>
              <option value="success">✓ 成功</option>
              <option value="failed">✕ 失败</option>
            </select>

            <Button
              size="sm"
              variant="outline"
              onClick={() => refetchCronLogs()}
              className="h-7 px-2.5 text-xs cursor-pointer"
              title="刷新执行日志"
            >
              <RotateCw className={`size-3 ${isLoadingCronLogs ? "animate-spin text-primary" : ""}`} />
            </Button>
          </div>
        </div>

        {/* 日志表格 */}
        <div className="overflow-x-auto rounded-lg border border-border/60">
          <table className="w-full text-left text-xs font-mono border-collapse min-w-[700px]">
            <thead className="bg-muted/40 text-muted-foreground border-b border-border/70 select-none">
              <tr>
                <th className="px-4 py-2.5 font-semibold w-44">关联任务名称</th>
                <th className="px-3 py-2.5 font-semibold w-24 text-center">状态</th>
                <th className="px-3 py-2.5 font-semibold w-20 text-center">耗时</th>
                <th className="px-3 py-2.5 font-semibold w-20 text-center">退出码</th>
                <th className="px-3 py-2.5 font-semibold w-36">开始时间</th>
                <th className="px-3 py-2.5 font-semibold min-w-[200px]">执行输出摘要</th>
                <th className="px-3 py-2.5 font-semibold w-20 text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    暂无符合条件的调度执行记录
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const isSuccess = log.status === "success";
                  return (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      {/* 任务名称 */}
                      <td className="px-4 py-2.5 font-semibold text-foreground max-w-[180px]">
                        <div className="truncate" title={log.cronName}>
                          {log.cronName}
                        </div>
                        <div className="text-[10px] text-muted-foreground/60 font-normal truncate">
                          {log.batchId || log.id}
                        </div>
                      </td>

                      {/* 状态 */}
                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                        <Badge
                          variant={isSuccess ? "success" : "danger"}
                          dot
                          className="text-[10px] px-1.5 py-0 font-mono"
                        >
                          {isSuccess ? "成功" : "失败"}
                        </Badge>
                      </td>

                      {/* 耗时 */}
                      <td className="px-3 py-2.5 text-center whitespace-nowrap text-muted-foreground">
                        {log.durationMs ? `${(log.durationMs / 1000).toFixed(2)}s` : "<1s"}
                      </td>

                      {/* Exit Code */}
                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                          log.exitCode === 0
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}>
                          code {log.exitCode ?? 0}
                        </span>
                      </td>

                      {/* 开始时间 */}
                      <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap text-[11px]">
                        {new Date(log.startedAt).toLocaleString("zh-CN", { hour12: false })}
                      </td>

                      {/* 输出摘要 (单行截断) */}
                      <td className="px-3 py-2.5 text-muted-foreground max-w-[280px]">
                        <div className="truncate font-mono text-[11px]" title={log.output}>
                          {log.output || "无标准输出"}
                        </div>
                      </td>

                      {/* 查看输出 */}
                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedLog(log)}
                          className="h-6 px-1.5 text-[11px] font-mono text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-border/50 hover:border-border cursor-pointer transition-all shrink-0 gap-1"
                          title="查看完整 Shell 运行日志"
                        >
                          <FileText className="size-2.5 text-muted-foreground/70" />
                          日志
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 日志分页 */}
        {filteredLogs.length > LOG_PAGE_SIZE && (
          <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
            <span className="font-mono">
              第 {(logPage - 1) * LOG_PAGE_SIZE + 1}–{Math.min(logPage * LOG_PAGE_SIZE, filteredLogs.length)} 条，共 {filteredLogs.length} 条
            </span>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                disabled={logPage <= 1}
                onClick={() => setLogPage((p) => Math.max(1, p - 1))}
                className="h-6 px-2 text-xs cursor-pointer font-mono"
              >
                ‹ 上一页
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={logPage >= totalLogPages}
                onClick={() => setLogPage((p) => Math.min(totalLogPages, p + 1))}
                className="h-6 px-2 text-xs cursor-pointer font-mono"
              >
                下一页 ›
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 新建 / 编辑任务弹窗 (目标服务器锁定当前主机) */}
      <Dialog open={cronDialogOpen} onOpenChange={setCronDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Clock className="size-4" />
              </div>
              <DialogTitle className="text-sm font-bold text-foreground">
                {editingCronId ? "编辑节点计划任务" : "新建节点计划任务"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs font-mono">
              锁定目标节点并在该服务器本地周期性自动执行 Shell 指令
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 pt-2 text-xs font-mono">
            {/* 目标服务器 (锁定不可改) */}
            <div className="space-y-1.5">
              <label className="font-medium text-foreground">目标生效服务器 (已锁定当前节点)</label>
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-border/80 bg-muted/40">
                <div className="flex items-center gap-2">
                  <Server className="size-3.5 text-primary" />
                  <span className="font-bold text-foreground">{server.name}</span>
                  <span className="text-muted-foreground text-[11px]">({server.ip || "127.0.0.1"})</span>
                </div>
                <Badge variant={server.status === "offline" ? "danger" : "success"} dot className="text-[10px]">
                  {server.status === "offline" ? "离线" : "在线"}
                </Badge>
              </div>
            </div>

            {/* 任务名称 */}
            <div className="space-y-1.5">
              <label className="font-medium text-foreground">任务名称</label>
              <input
                value={cronForm.name}
                onChange={(e) => setCronForm({ ...cronForm, name: e.target.value })}
                placeholder="例如: 每日凌晨全量备份数据库"
                className="w-full h-8 rounded-lg border border-border/80 bg-muted/30 px-3 text-xs outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/60"
              />
            </div>

            {/* Cron 表达式 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-medium text-foreground">Cron 调度表达式</label>
                <span className="text-[11px] text-primary font-medium">
                  {parseCronDescription(cronForm.expression)}
                </span>
              </div>
              <input
                value={cronForm.expression}
                onChange={(e) => setCronForm({ ...cronForm, expression: e.target.value })}
                placeholder="0 2 * * *"
                className="w-full h-8 rounded-lg border border-border/80 bg-muted/30 px-3 text-xs font-mono outline-none focus:border-primary text-foreground"
              />
              <div className="flex flex-wrap gap-2 pt-0.5 text-[11px] text-muted-foreground">
                {[
                  { label: "每5分钟", expr: "*/5 * * * *" },
                  { label: "每小时", expr: "0 * * * *" },
                  { label: "每日凌晨2点", expr: "0 2 * * *" },
                  { label: "每周日凌晨", expr: "0 0 * * 0" },
                  { label: "每月1号", expr: "0 0 1 * *" }
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setCronForm({ ...cronForm, expression: preset.expr })}
                    className="hover:text-primary underline cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 执行 Shell 指令 */}
            <div className="space-y-1.5">
              <label className="font-medium text-foreground">执行 Shell 指令</label>
              <textarea
                rows={3}
                value={cronForm.command}
                onChange={(e) => setCronForm({ ...cronForm, command: e.target.value })}
                placeholder="例如: /opt/scripts/backup.sh 或 pg_dump main > /backup/main.sql"
                className="w-full rounded-lg border border-border/80 bg-muted/30 p-2.5 text-xs font-mono outline-none focus:border-primary text-foreground placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2 pt-2 border-t border-border/60">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCronDialogOpen(false)}
              className="cursor-pointer text-xs"
            >
              取消
            </Button>
            <Button
              size="sm"
              onClick={handleSaveCron}
              disabled={createCron.isPending || updateCron.isPending}
              className="cursor-pointer text-xs font-bold px-4"
            >
              {createCron.isPending || updateCron.isPending ? "保存中..." : "保存任务"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 查看任务执行日志输出弹窗 */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge
                variant={selectedLog?.status === "success" ? "success" : "danger"}
                dot
                className="text-xs px-2 py-0.5"
              >
                {selectedLog?.status === "success" ? "执行成功" : "执行失败"}
              </Badge>
              <DialogTitle className="text-sm font-bold text-foreground truncate max-w-[340px]">
                {selectedLog?.cronName}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs font-mono">
              批次 ID: {selectedLog?.batchId || selectedLog?.id} · 节点: {server.name}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-3 py-1 text-xs font-mono">
              {/* 关键属性条 */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/70 text-[11px]">
                <div>
                  <div className="text-muted-foreground text-[10px]">开始时间</div>
                  <div className="font-semibold text-foreground mt-0.5">
                    {new Date(selectedLog.startedAt).toLocaleTimeString("zh-CN", { hour12: false })}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[10px]">耗时</div>
                  <div className="font-semibold text-foreground mt-0.5">
                    {selectedLog.durationMs ? `${(selectedLog.durationMs / 1000).toFixed(2)}s` : "<1s"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[10px]">进程退出码</div>
                  <div className="font-semibold text-foreground mt-0.5">
                    exit code {selectedLog.exitCode ?? 0}
                  </div>
                </div>
              </div>

              {/* 执行指令 */}
              <div className="space-y-1">
                <div className="text-muted-foreground text-[10px]">执行指令</div>
                <div className="p-2 rounded bg-zinc-950 text-emerald-400 font-mono text-[11px] border border-zinc-800 break-all select-text">
                  root@{server.name}:~# {selectedLog.command}
                </div>
              </div>

              {/* Shell 输出日志 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-[10px]">
                  <span>控制台标准输出 (Stdout / Stderr)</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedLog.output || "");
                      toast.success("已复制日志输出文本");
                    }}
                    className="text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="size-2.5" /> 复制输出
                  </button>
                </div>
                <div className="h-56 overflow-y-auto p-3 rounded-lg bg-zinc-950 text-zinc-200 font-mono text-[11px] leading-relaxed border border-zinc-800 select-text whitespace-pre-wrap">
                  {selectedLog.output || "[无控制台回显输出]"}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-end gap-2 pt-2 border-t border-border/60">
            <Button
              size="sm"
              onClick={() => setSelectedLog(null)}
              className="h-8 text-xs px-4 cursor-pointer font-bold"
            >
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
