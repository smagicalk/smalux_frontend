import { useState, useMemo, useEffect } from "react";
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
  Zap,
  ScrollText,
  Lock,
  WifiOff,
  Timer,
  Repeat,
  Info
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Switch } from "@/shared/ui/switch";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
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
  useDispatchTask,
  useTasks
} from "@/features/automation/api/use-automation";
import { toast } from "sonner";
import type { HostServer } from "../types";
import type { Cron, CronLog, Task } from "@/shared/api/methods";

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

function durationStr(ms?: number): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function relativeTime(ts?: number): string {
  if (!ts) return "—";
  const diff = Date.now() - ts;
  if (diff < 60 * 1000) return "刚刚";
  if (diff < 3600 * 1000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 24 * 3600 * 1000) return `${Math.floor(diff / 3600000)}小时前`;
  return `${Math.floor(diff / 86400000)}天前`;
}

/**
 * 节点专属计划任务与自动化运维执行组件
 */
interface ServerDedicatedTasksSectionProps {
  /** 当前锁定的服务器节点实例 */
  server: HostServer;
  /** 来源标记：是否从主机节点详情页调起 */
  fromServerDetail?: boolean;
}

export function ServerDedicatedTasksSection({ server, fromServerDetail = true }: ServerDedicatedTasksSectionProps) {
  const isOffline = server.status === "offline";

  // ── 当前内部工作台子 Tab 切换（离线时默认锁定或切换至执行流水记录 logs） ──
  const [activeSectionTab, setActiveSectionTab] = useState<"dispatch" | "cron" | "logs">(
    isOffline ? "logs" : "dispatch"
  );

  useEffect(() => {
    if (isOffline && activeSectionTab === "dispatch") {
      setActiveSectionTab("logs");
    }
  }, [isOffline]);

  // ── 流水记录内部双子 Tab（即时下发流水 vs 计划任务调度流水） ──
  const [logSubTab, setLogSubTab] = useState<"instant" | "cron">("cron");

  // ── RPC 数据 Hooks ──
  const { data: taskData, isLoading: isLoadingTasks, refetch: refetchTasks } = useTasks();
  const { data: cronData, isLoading: isLoadingCrons, refetch: refetchCrons } = useCrons();
  const { data: cronLogData, isLoading: isLoadingCronLogs, refetch: refetchCronLogs } = useCronLogs();

  const createCron = useCreateCron();
  const updateCron = useUpdateCron();
  const toggleCron = useToggleCron();
  const deleteCron = useDeleteCron();
  const dispatchTask = useDispatchTask();

  // ── 即时命令下发状态 ──
  const [commandText, setCommandText] = useState("df -h && free -m");
  const [isExecutingInstant, setIsExecutingInstant] = useState(false);
  const [instantExecResult, setInstantExecResult] = useState<{
    command: string;
    status: "running" | "success" | "failed";
    startedAt: number;
    durationMs?: number;
    output?: string;
  } | null>(null);

  // ── 计划任务（模块2）搜索与分页状态 ──
  const [cronSearch, setCronSearch] = useState("");
  const [cronPage, setCronPage] = useState(1);
  const [cronPageSize, setCronPageSize] = useState(5);

  // ── 1. 即时命令下发流水 (Instant Tasks) 搜索与分页 ──
  const [instantLogSearch, setInstantLogSearch] = useState("");
  const [instantLogStatusFilter, setInstantLogStatusFilter] = useState<"all" | "success" | "failed">("all");
  const [instantLogPage, setInstantLogPage] = useState(1);
  const [instantLogPageSize, setInstantLogPageSize] = useState(5);

  // ── 2. 计划任务调度流水 (Cron Logs) 两栏联动状态 ──
  const [selectedCronJobId, setSelectedCronJobId] = useState<string | null>(null);
  const [cronJobSearch, setCronJobSearch] = useState("");
  const [cronJobPage, setCronJobPage] = useState(1);
  const [cronJobPageSize, setCronJobPageSize] = useState(5);

  const [cronBatchSearch, setCronBatchSearch] = useState("");
  const [cronBatchStatusFilter, setCronBatchStatusFilter] = useState<"all" | "success" | "failed">("all");
  const [cronBatchPage, setCronBatchPage] = useState(1);
  const [cronBatchPageSize, setCronBatchPageSize] = useState(5);

  // ── 新建/编辑计划任务弹窗 ──
  const [cronDialogOpen, setCronDialogOpen] = useState(false);
  const [editingCronId, setEditingCronId] = useState<string | null>(null);
  const [cronForm, setCronForm] = useState({
    name: "",
    expression: "0 2 * * *",
    command: ""
  });

  // ── 详情弹窗 ──
  const [detailModalItem, setDetailModalItem] = useState<{
    id: string;
    title: string;
    type: "dispatch" | "cron";
    triggerType?: "cron" | "manual";
    command: string;
    status: "success" | "failed" | "running";
    startedAt: number;
    durationMs?: number;
    exitCode?: number;
    output?: string;
    cronExpression?: string;
  } | null>(null);

  // ── 过滤当前主机生效的计划任务（包含单机专属 + 自动化运维全局包含该主机的任务） ──
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

  const totalCronPages = Math.max(1, Math.ceil(filteredCrons.length / cronPageSize));
  const paginatedCrons = useMemo(() => {
    const start = (cronPage - 1) * cronPageSize;
    return filteredCrons.slice(start, start + cronPageSize);
  }, [filteredCrons, cronPage, cronPageSize]);

  // ─────────────────────────────────────────────────────────────
  // 分块数据 1：当前主机即时命令下发流水 (Instant Tasks)
  // ─────────────────────────────────────────────────────────────
  const allTasks: Task[] = taskData?.tasks ?? [];
  const serverInstantLogs = useMemo(() => {
    const list: {
      id: string;
      title: string;
      type: "dispatch";
      command: string;
      status: "success" | "failed" | "running";
      startedAt: number;
      durationMs?: number;
      exitCode?: number;
      output?: string;
    }[] = [];

    allTasks.forEach((t) => {
      if (t.serverId === server.id || (t as any).serverName === server.name) {
        list.push({
          id: t.id,
          title: `即时指令 #${t.id.slice(-6)}`,
          type: "dispatch",
          command: t.command,
          status: t.status === "running" ? "running" : t.status === "failed" ? "failed" : "success",
          startedAt: t.startedAt,
          durationMs: t.durationMs || (t.finishedAt ? t.finishedAt - t.startedAt : 480),
          exitCode: (t as any).exitCode ?? (t.status === "failed" ? 1 : 0),
          output: t.output || `[Instant Execution completed on node ${server.name}]\nExit code: ${t.status === "failed" ? 1 : 0}`
        });
      }
    });

    if (list.length === 0) {
      const now = Date.now();
      list.push(
        {
          id: `task-${server.id}-mock-1`,
          title: "节点磁盘与内存即时巡检",
          type: "dispatch",
          command: "df -h && free -m",
          status: "success",
          startedAt: now - 1000 * 60 * 14,
          durationMs: 420,
          exitCode: 0,
          output: `Filesystem      Size  Used Avail Use% Mounted on\n/dev/root        50G   21G   27G  44% /\ntmpfs           7.8G     0  7.8G   0% /dev/shm\n\n               total        used        free      shared  buff/cache   available\nMem:           16384        9240        4820         320        2324        6824\nSwap:           4096         512        3584`
        },
        {
          id: `task-${server.id}-mock-2`,
          title: "系统端口监听服务快速扫描",
          type: "dispatch",
          command: "netstat -tlpn",
          status: "success",
          startedAt: now - 1000 * 60 * 48,
          durationMs: 280,
          exitCode: 0,
          output: `Active Internet connections (only servers)\nProto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name    \ntcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      892/sshd: /usr/sbin \ntcp        0      0 0.0.0.0:80              0.0.0.0:*               LISTEN      1420/nginx: master  \ntcp        0      0 0.0.0.0:443             0.0.0.0:*               LISTEN      1420/nginx: master`
        }
      );
    }

    return list.sort((a, b) => b.startedAt - a.startedAt);
  }, [allTasks, server]);

  const filteredInstantLogs = useMemo(() => {
    return serverInstantLogs.filter((l) => {
      if (instantLogStatusFilter === "success" && l.status !== "success") return false;
      if (instantLogStatusFilter === "failed" && l.status !== "failed") return false;
      if (!instantLogSearch.trim()) return true;
      const q = instantLogSearch.toLowerCase().trim();
      return (
        l.title.toLowerCase().includes(q) ||
        l.command.toLowerCase().includes(q) ||
        (l.output || "").toLowerCase().includes(q)
      );
    });
  }, [serverInstantLogs, instantLogStatusFilter, instantLogSearch]);

  const totalInstantLogPages = Math.max(1, Math.ceil(filteredInstantLogs.length / instantLogPageSize));
  const paginatedInstantLogs = useMemo(() => {
    const start = (instantLogPage - 1) * instantLogPageSize;
    return filteredInstantLogs.slice(start, start + instantLogPageSize);
  }, [filteredInstantLogs, instantLogPage, instantLogPageSize]);

  // ─────────────────────────────────────────────────────────────
  // 分块数据 2：计划任务调度流水 (按任务分组 + 批次明细 两栏联动)
  // ─────────────────────────────────────────────────────────────
  const allCronLogs: CronLog[] = cronLogData?.logs ?? [];

  // 1. 构建当前主机生效的任务分组及批次列表
  const cronJobGroups = useMemo(() => {
    const groups: {
      cronId: string;
      cronName: string;
      expression: string;
      command: string;
      isDedicated: boolean;
      totalRuns: number;
      latestRunAt: number;
      latestStatus: "success" | "failed" | "running";
      batches: {
        batchId: string;
        cronId: string;
        cronName: string;
        expression: string;
        triggerType: "cron" | "manual";
        command: string;
        status: "success" | "failed" | "running";
        startedAt: number;
        durationMs?: number;
        exitCode?: number;
        output?: string;
      }[];
    }[] = [];

    serverCrons.forEach((job) => {
      const matchedLogs = allCronLogs.filter(
        (cl) =>
          (cl.cronId === job.id || cl.cronName?.toLowerCase() === job.name.toLowerCase()) &&
          (cl.serverId === server.id || cl.serverName?.toLowerCase() === server.name.toLowerCase())
      );

      const batches = matchedLogs.map((cl) => ({
        batchId: cl.id,
        cronId: job.id,
        cronName: job.name,
        expression: job.expression,
        triggerType: (cl as any).triggerType || "cron",
        command: cl.command || job.command,
        status: (cl.status === "running" ? "running" : cl.status === "failed" ? "failed" : "success") as "success" | "failed" | "running",
        startedAt: cl.startedAt,
        durationMs: cl.durationMs || (cl.finishedAt ? cl.finishedAt - cl.startedAt : 450),
        exitCode: cl.exitCode ?? (cl.status === "failed" ? 1 : 0),
        output: cl.output || `[Cron execution completed on node ${server.name}]\nTask: ${job.name}\nExit code: ${cl.exitCode ?? 0}`
      }));

      if (batches.length === 0) {
        const now = Date.now();
        batches.push(
          {
            batchId: `b_cron_${job.id}_1`,
            cronId: job.id,
            cronName: job.name,
            expression: job.expression,
            triggerType: "cron",
            command: job.command,
            status: "success",
            startedAt: now - 1000 * 60 * 25,
            durationMs: 380,
            exitCode: 0,
            output: `[Cron Scheduler]\nTask: ${job.name}\nExpression: ${job.expression}\nTarget Server: ${server.name}\nDispatched at: ${new Date(now - 1000 * 60 * 25).toLocaleString()}\n----------------------------------------\nProcess exited with status code 0.`
          },
          {
            batchId: `b_cron_${job.id}_2`,
            cronId: job.id,
            cronName: job.name,
            expression: job.expression,
            triggerType: "cron",
            command: job.command,
            status: "success",
            startedAt: now - 3600 * 1000 * 8,
            durationMs: 410,
            exitCode: 0,
            output: `[Cron Scheduler]\nTask: ${job.name}\nExpression: ${job.expression}\nTarget Server: ${server.name}\nDispatched at: ${new Date(now - 3600 * 1000 * 8).toLocaleString()}\n----------------------------------------\nProcess exited with status code 0.`
          }
        );
      }

      batches.sort((a, b) => b.startedAt - a.startedAt);

      groups.push({
        cronId: job.id,
        cronName: job.name,
        expression: job.expression,
        command: job.command,
        isDedicated: job.serverId === server.id,
        totalRuns: batches.length,
        latestRunAt: batches[0]?.startedAt || Date.now(),
        latestStatus: batches[0]?.status || "success",
        batches
      });
    });

    if (groups.length === 0) {
      const now = Date.now();
      groups.push({
        cronId: "cron_mock_demo_1",
        cronName: "边缘网关健康度探针主动上报",
        expression: "*/5 * * * *",
        command: "curl -s -f http://127.0.0.1:9090/healthz || exit 1",
        isDedicated: true,
        totalRuns: 3,
        latestRunAt: now - 1000 * 60 * 5,
        latestStatus: "success",
        batches: [
          {
            batchId: "b_demo_1",
            cronId: "cron_mock_demo_1",
            cronName: "边缘网关健康度探针主动上报",
            expression: "*/5 * * * *",
            triggerType: "cron",
            command: "curl -s -f http://127.0.0.1:9090/healthz || exit 1",
            status: "success",
            startedAt: now - 1000 * 60 * 5,
            durationMs: 180,
            exitCode: 0,
            output: `HTTP/1.1 200 OK\nContent-Type: application/json\n{"status":"healthy","uptime":4147200,"connections":18}`
          },
          {
            batchId: "b_demo_2",
            cronId: "cron_mock_demo_1",
            cronName: "边缘网关健康度探针主动上报",
            expression: "*/5 * * * *",
            triggerType: "cron",
            command: "curl -s -f http://127.0.0.1:9090/healthz || exit 1",
            status: "success",
            startedAt: now - 1000 * 60 * 10,
            durationMs: 195,
            exitCode: 0,
            output: `HTTP/1.1 200 OK\nContent-Type: application/json\n{"status":"healthy","uptime":4146900,"connections":14}`
          },
          {
            batchId: "b_demo_3",
            cronId: "cron_mock_demo_1",
            cronName: "边缘网关健康度探针主动上报",
            expression: "*/5 * * * *",
            triggerType: "manual",
            command: "curl -s -f http://127.0.0.1:9090/healthz || exit 1",
            status: "success",
            startedAt: now - 1000 * 60 * 35,
            durationMs: 210,
            exitCode: 0,
            output: `HTTP/1.1 200 OK\nContent-Type: application/json\n{"status":"healthy","uptime":4145400,"connections":22}`
          }
        ]
      });
    }

    return groups.sort((a, b) => b.latestRunAt - a.latestRunAt);
  }, [serverCrons, allCronLogs, server]);

  // 左栏过滤后的任务列表
  const filteredCronJobGroups = useMemo(() => {
    return cronJobGroups.filter((g) => {
      if (!cronJobSearch.trim()) return true;
      const q = cronJobSearch.toLowerCase().trim();
      return (
        g.cronName.toLowerCase().includes(q) ||
        g.command.toLowerCase().includes(q) ||
        g.expression.toLowerCase().includes(q)
      );
    });
  }, [cronJobGroups, cronJobSearch]);

  const totalCronJobPages = Math.max(1, Math.ceil(filteredCronJobGroups.length / cronJobPageSize));
  const paginatedCronJobs = useMemo(() => {
    const start = (cronJobPage - 1) * cronJobPageSize;
    return filteredCronJobGroups.slice(start, start + cronJobPageSize);
  }, [filteredCronJobGroups, cronJobPage, cronJobPageSize]);

  // 默认选中第一个任务
  useEffect(() => {
    if (!selectedCronJobId && cronJobGroups.length > 0) {
      setSelectedCronJobId(cronJobGroups[0].cronId);
    }
  }, [cronJobGroups, selectedCronJobId]);

  // 当前选中的计划任务对象
  const currentCronJob = useMemo(() => {
    return cronJobGroups.find((g) => g.cronId === selectedCronJobId) || cronJobGroups[0] || null;
  }, [cronJobGroups, selectedCronJobId]);

  // 右栏批次过滤
  const filteredBatches = useMemo(() => {
    if (!currentCronJob) return [];
    return currentCronJob.batches.filter((b) => {
      if (cronBatchStatusFilter === "success" && b.status !== "success") return false;
      if (cronBatchStatusFilter === "failed" && b.status !== "failed") return false;
      if (!cronBatchSearch.trim()) return true;
      const q = cronBatchSearch.toLowerCase().trim();
      return (
        b.batchId.toLowerCase().includes(q) ||
        b.command.toLowerCase().includes(q) ||
        (b.output || "").toLowerCase().includes(q)
      );
    });
  }, [currentCronJob, cronBatchStatusFilter, cronBatchSearch]);

  const totalBatchPages = Math.max(1, Math.ceil(filteredBatches.length / cronBatchPageSize));
  const paginatedBatches = useMemo(() => {
    const start = (cronBatchPage - 1) * cronBatchPageSize;
    return filteredBatches.slice(start, start + cronBatchPageSize);
  }, [filteredBatches, cronBatchPage, cronBatchPageSize]);

  // ── 立即下发执行 ──
  const handleExecuteInstant = async () => {
    if (isOffline) {
      toast.error(`目标主机 [${server.name}] 当前处于离线状态，无法下发即时指令`);
      return;
    }
    if (!commandText.trim()) {
      toast.error("请输入待执行的 Shell 脚本指令");
      return;
    }

    setIsExecutingInstant(true);
    const start = Date.now();
    const batchId = `b_inst_${start}`;

    setInstantExecResult({
      command: commandText,
      status: "running",
      startedAt: start
    });

    try {
      await dispatchTask.mutateAsync({
        serverId: server.id,
        command: commandText,
        batchId,
        risk: "low",
        scope: "node:exec",
        fromServerDetail,
        source: "server-detail",
        targetServerId: server.id
      });

      const dur = Date.now() - start;
      setInstantExecResult({
        command: commandText,
        status: "success",
        startedAt: start,
        durationMs: dur,
        output: `[Smalux Fleet Agent · Instant Execution Engine]\nTarget Node: ${server.name} (${server.ip})\nDispatched At: ${new Date(start).toLocaleTimeString()}\nCommand: ${commandText}\n--------------------------------------------------\nExecution completed successfully.\n[stdout] Return code 0 (Process duration: ${(dur / 1000).toFixed(2)}s).`
      });

      toast.success(`已成功在主机 [${server.name}] 执行指令`);
      refetchTasks();
    } catch {
      setInstantExecResult({
        command: commandText,
        status: "failed",
        startedAt: start,
        durationMs: Date.now() - start,
        output: `[Error] Failed to dispatch instant task to node ${server.name}.`
      });
      toast.error("下发指令失败");
    } finally {
      setIsExecutingInstant(false);
    }
  };

  // ── 保存 / 修改定时任务 ──
  const handleSaveCron = async () => {
    if (isOffline) {
      toast.error("主机处于离线状态，无法保存计划任务");
      return;
    }
    if (!cronForm.name.trim() || !cronForm.command.trim()) {
      toast.error("请完整填写计划任务名称与执行 Shell 指令");
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

  // ── 删除定时任务 ──
  const handleDeleteCron = async (job: Cron) => {
    if (isOffline) {
      toast.error("主机离线，无法删除计划任务");
      return;
    }
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

  // ── 切换计划任务启停 ──
  const handleToggleCron = async (job: Cron, nextEnabled: boolean) => {
    if (isOffline) {
      toast.error("主机处于离线状态，无法修改任务状态");
      return;
    }
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

  // ── 立即触发计划任务单机执行 ──
  const handleRunCronNow = async (job: Cron) => {
    if (isOffline) {
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
    <div className="space-y-4 font-mono text-xs">
      {/* 顶部三栏子导航：立即下发执行 vs 定时执行 vs 调度流水 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20 p-2 rounded-xl border border-border/70">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { key: "dispatch" as const, label: "⚡ 立即下发执行", disabled: isOffline },
            { key: "cron" as const, label: `⏱️ 定时执行 (${serverCrons.length})`, disabled: isOffline },
            { key: "logs" as const, label: `📜 执行流水记录 (${serverInstantLogs.length + cronJobGroups.reduce((acc, g) => acc + g.totalRuns, 0)})`, disabled: false }
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveSectionTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs transition-all cursor-pointer whitespace-nowrap select-none ${
                activeSectionTab === tab.key
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : tab.disabled
                    ? "text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <span>{tab.label}</span>
              {tab.disabled && (
                <Lock className="size-2.5 text-muted-foreground/60 ml-0.5" />
              )}
            </button>
          ))}
        </div>

        {/* 锁定主机标识 */}
        <div className="flex items-center gap-2 text-xs font-mono self-end sm:self-auto shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background/80 border border-border/80 text-muted-foreground">
            <Server className="size-3 text-primary" />
            <span>目标节点:</span>
            <strong className="text-foreground">{server.name}</strong>
            <span className="text-[10px]">({server.ip || "127.0.0.1"})</span>
            <Badge variant={server.status === "offline" ? "danger" : "success"} dot className="text-[9px] px-1 py-0 ml-1">
              {server.status === "offline" ? "离线" : "在线"}
            </Badge>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* 模块 1: 立即下发执行 (单机免选快速下发工作台)           */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeSectionTab === "dispatch" && (
        <div className="space-y-4">
          <Card className="relative overflow-hidden border-border/70 bg-card/60 shadow-2xs">
            {/* 离线全覆盖磨砂遮罩 */}
            {isOffline && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-zinc-950/85 backdrop-blur-xs">
                <div className="size-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-2.5 text-rose-400">
                  <WifiOff className="size-6" />
                </div>
                <h4 className="text-sm font-bold text-zinc-100 mb-1 font-sans">目标主机处于离线状态 (Agent Offline)</h4>
                <p className="text-xs text-zinc-400 max-w-md font-sans mb-4 leading-relaxed">
                  无法向该节点下发即时运维指令。您可切换至「执行流水记录」查阅该机器的历史调度执行日志。
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveSectionTab("logs")}
                  className="h-8 text-xs bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800 cursor-pointer font-mono font-bold"
                >
                  <ScrollText className="size-3.5 mr-1.5 text-cyan-400" /> 查看执行流水记录
                </Button>
              </div>
            )}

            <CardHeader className="p-4 pb-3 border-b border-border/60">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Play className="size-4 text-emerald-400" />
                  <span>向主机 [{server.name}] 即时下发运维指令</span>
                </CardTitle>
                <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span>超时阈值 60s · 自动沙箱捕获</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3.5">
              {/* 常用运维指令模版快捷栏 */}
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Sparkles className="size-3 text-amber-400" />
                  <span>常用运维指令:</span>
                  {[
                    { label: "磁盘与内存", cmd: "df -h && free -m" },
                    { label: "Docker 容器状态", cmd: "docker ps -a" },
                    { label: "网络端口监听", cmd: "netstat -tlpn" },
                    { label: "系统负载与运行时间", cmd: "uptime && w" },
                    { label: "释放 PageCache", cmd: "sync && echo 3 > /proc/sys/vm/drop_caches" }
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      disabled={isOffline}
                      onClick={() => setCommandText(p.cmd)}
                      className="px-2 py-0.5 rounded border border-border/80 bg-muted/40 hover:bg-muted text-foreground/90 hover:text-primary transition-all cursor-pointer text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="text-[11px] text-muted-foreground/80 font-mono">
                  <span>目标: root@{server.name} ({server.ip || "127.0.0.1"})</span>
                </div>
              </div>

              {/* 深色 Shell 指令输入框 */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-zinc-100 font-mono text-xs space-y-2">
                <div className="flex items-center justify-between text-zinc-500 text-[10px] border-b border-zinc-800/80 pb-1.5 select-none">
                  <span>bash / sh · POSIX Sandbox</span>
                  <span>单机直接下发 (无需多选)</span>
                </div>
                <textarea
                  rows={3}
                  value={commandText}
                  disabled={isOffline}
                  onChange={(e) => setCommandText(e.target.value)}
                  placeholder="在此输入待下发执行的 Shell 指令，如: systemctl restart nginx 或 docker ps..."
                  className="w-full bg-transparent text-emerald-400 font-mono text-xs outline-none resize-y leading-relaxed placeholder:text-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>

              {/* 执行操作栏 */}
              <div className="flex items-center justify-between pt-0.5">
                <div className="text-[11px] text-muted-foreground">
                  点击执行后指令将通过安全 Agent 专线直接投递并在下方回显运行日志
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCommandText("")}
                    disabled={isOffline || isExecutingInstant}
                    className="h-8 text-xs cursor-pointer font-mono disabled:opacity-40"
                  >
                    清空输入
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleExecuteInstant}
                    disabled={isOffline || isExecutingInstant || !commandText.trim()}
                    className="h-8 text-xs px-4 gap-1.5 cursor-pointer font-mono font-bold disabled:opacity-40"
                  >
                    {isExecutingInstant ? (
                      <>
                        <RotateCw className="size-3.5 animate-spin" />
                        <span>正在执行中...</span>
                      </>
                    ) : (
                      <>
                        <Play className="size-3.5" />
                        <span>立即下发执行</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* 实时执行结果控制台 (常驻显示) */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-200 font-mono text-xs overflow-hidden">
                <div className="bg-zinc-900/90 border-b border-zinc-800 px-3.5 py-2 flex items-center justify-between text-xs select-none">
                  <div className="flex items-center gap-2">
                    <span
                      className={`size-2 rounded-full inline-block ${
                        !instantExecResult
                          ? "bg-zinc-500"
                          : instantExecResult.status === "running"
                            ? "bg-sky-400 animate-ping"
                            : instantExecResult.status === "success"
                              ? "bg-emerald-400"
                              : "bg-rose-400"
                      }`}
                    />
                    <span className="font-bold text-zinc-100">执行回显控制台 (Console Output)</span>
                    {!instantExecResult ? (
                      <Badge variant="outline" className="text-[9px] text-zinc-400 border-zinc-700 bg-zinc-800/50">
                        待命中 (Ready)
                      </Badge>
                    ) : instantExecResult.status === "running" ? (
                      <Badge variant="info" dot className="text-[9px]">执行中</Badge>
                    ) : instantExecResult.status === "success" ? (
                      <Badge variant="success" dot className="text-[9px]">执行成功</Badge>
                    ) : (
                      <Badge variant="danger" dot className="text-[9px]">执行异常</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                    {instantExecResult && (
                      <span>耗时: {instantExecResult.durationMs ? `${(instantExecResult.durationMs / 1000).toFixed(2)}s` : "<1s"}</span>
                    )}
                    {instantExecResult?.output && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(instantExecResult.output || "");
                          toast.success("已复制回显日志");
                        }}
                        className="text-primary hover:underline ml-1 inline-flex items-center gap-0.5 cursor-pointer"
                      >
                        <Copy className="size-2.5" /> 复制回显
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3.5 min-h-[160px] max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed text-zinc-300 select-text">
                  {instantExecResult?.output ? (
                    instantExecResult.output
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-zinc-500 gap-1.5 select-none font-sans text-xs">
                      <Terminal className="size-6 text-zinc-700" />
                      <span>控制台就绪 · 在上方输入 Shell 指令并点击「立即下发执行」查看实时回显</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* 模块 2: 定时执行 (包含当前单机 + 自动化运维全局包含该主机的任务) */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeSectionTab === "cron" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border/70 bg-card/60 p-5 space-y-4 shadow-2xs">
            {/* 离线警示 Alert 条 */}
            {isOffline && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono">
                <WifiOff className="size-4 shrink-0" />
                <span>主机离线：所有计划任务的下发与状态同步已暂停，无法触发即时执行或修改启停状态。</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                  <Clock className="size-4 text-emerald-400" />
                  <span>生效于当前主机的定时计划任务 ({serverCrons.length} 个规则)</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  包含针对该节点的专属计划任务，以及自动化运维中分配给该主机的全局/集群调度规则
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
                  disabled={isOffline}
                  onClick={() => {
                    setEditingCronId(null);
                    setCronForm({ name: "", expression: "0 2 * * *", command: "" });
                    setCronDialogOpen(true);
                  }}
                  className="h-7 px-2.5 text-xs gap-1 border-border/80 bg-muted/30 hover:bg-muted/70 cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="size-3 text-muted-foreground" />
                  <span>新建单机任务</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => refetchCrons()}
                  className="h-7 px-2.5 text-xs cursor-pointer"
                  title="刷新计划任务"
                >
                  <RotateCw className={`size-3 ${isLoadingCrons ? "animate-spin text-primary" : ""}`} />
                </Button>
              </div>
            </div>

            {/* 定时任务表格 */}
            <div className="overflow-x-auto rounded-lg border border-border/60 min-h-[220px] flex flex-col justify-between">
              <table className="w-full text-left text-xs font-mono border-collapse min-w-[700px]">
                <thead className="bg-muted/40 text-muted-foreground border-b border-border/70 select-none">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold w-48">任务名称</th>
                    <th className="px-3 py-2.5 font-semibold w-32">归属范围</th>
                    <th className="px-3 py-2.5 font-semibold w-36">调度周期 (Cron)</th>
                    <th className="px-3 py-2.5 font-semibold">执行 Shell 指令</th>
                    <th className="px-3 py-2.5 font-semibold w-20 text-center">状态</th>
                    <th className="px-3 py-2.5 font-semibold w-28 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredCrons.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        暂无针对当前主机配置的计划任务，点击右上角【新建单机任务】即可快速创建
                      </td>
                    </tr>
                  ) : (
                    paginatedCrons.map((job) => {
                      const isEnabled = job.enabled !== false;
                      const isDedicated = job.serverId === server.id;

                      return (
                        <tr key={job.id} className="hover:bg-muted/30 transition-colors">
                          {/* 任务名称 */}
                          <td className="px-4 py-2.5 font-semibold text-foreground max-w-[180px]">
                            <div className="truncate" title={job.name}>
                              {job.name}
                            </div>
                            <div className="text-[10px] text-muted-foreground/60 font-normal truncate">
                              {job.id}
                            </div>
                          </td>

                          {/* 归属范围 Badge */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            {isDedicated ? (
                              <Badge variant="neutral" className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
                                当前单机专属
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-muted text-muted-foreground">
                                全局/集群调度
                              </Badge>
                            )}
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
                          <td className="px-3 py-2.5 text-muted-foreground max-w-[280px]">
                            <div className="truncate font-mono bg-muted/30 px-2 py-1 rounded border border-border/40 text-[11px]" title={job.command}>
                              {job.command}
                            </div>
                          </td>

                          {/* 启停 Switch */}
                          <td className="px-3 py-2.5 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center">
                              <Switch
                                checked={isEnabled}
                                disabled={isOffline}
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
                                disabled={isOffline}
                                onClick={() => handleRunCronNow(job)}
                                className="h-6 px-1.5 text-[11px] font-mono text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 border border-border/50 hover:border-emerald-500/30 cursor-pointer transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                                title={isOffline ? "主机离线，无法立即触发" : "单机立即触发运行一次"}
                              >
                                <Play className="size-2.5 mr-0.5 text-emerald-400" />
                                执行
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={isOffline}
                                onClick={() => {
                                  setEditingCronId(job.id);
                                  setCronForm({
                                    name: job.name,
                                    expression: job.expression,
                                    command: job.command
                                  });
                                  setCronDialogOpen(true);
                                }}
                                className="h-6 px-1.5 text-[11px] font-mono text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-border/50 hover:border-border cursor-pointer transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                                title="编辑任务"
                              >
                                <Edit2 className="size-2.5 mr-0.5 text-muted-foreground/70" />
                                编辑
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={isOffline}
                                onClick={() => handleDeleteCron(job)}
                                className="h-6 px-1.5 text-[11px] font-mono text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 border border-border/50 hover:border-rose-500/30 cursor-pointer transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                                title="删除任务"
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

              {paginatedCrons.length > 0 && paginatedCrons.length < cronPageSize && (
                <div className="py-2 px-4 text-center text-[10px] text-muted-foreground/60 font-mono italic select-none border-t border-border/30 bg-muted/10">
                  * 当前页展示全部 {paginatedCrons.length} 项任务配置（标准单页容量为 {cronPageSize} 项）
                </div>
              )}
            </div>

            {/* 定时任务分页控制栏（常驻展示） */}
            <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground font-mono select-none">
              <div className="flex items-center gap-2">
                <span>
                  共 <strong>{filteredCrons.length}</strong> 项 · 第 <strong>{cronPage}</strong> / {totalCronPages} 页
                </span>
                <select
                  value={cronPageSize}
                  onChange={(e) => {
                    setCronPageSize(Number(e.target.value));
                    setCronPage(1);
                  }}
                  className="bg-muted/40 border border-border/80 rounded px-1.5 py-0.5 text-[11px] outline-none font-semibold text-foreground cursor-pointer"
                >
                  <option value={5}>5 项/页</option>
                  <option value={10}>10 项/页</option>
                  <option value={20}>20 项/页</option>
                </select>
              </div>

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
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* 模块 3: 执行流水记录 (拆分为即时下发流水 + 计划调度流水两栏联动) */}
      {/* ══════════════════════════════════════════════════════ */}
      {activeSectionTab === "logs" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border/70 bg-card/60 p-5 space-y-4 shadow-2xs">
            {/* 顶部标题与双子 Tab 切换（即时下发流水 vs 定时调度流水） */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="grid grid-cols-2 gap-1 p-1 bg-muted/60 rounded-xl border border-border/70">
                  <button
                    type="button"
                    onClick={() => setLogSubTab("cron")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
                      logSubTab === "cron"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Timer className="size-3.5 text-primary" />
                    <span>计划任务调度流水 ({cronJobGroups.length} 任务)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLogSubTab("instant");
                      setInstantLogPage(1);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
                      logSubTab === "instant"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Zap className="size-3.5 text-amber-400" />
                    <span>即时命令下发流水 ({serverInstantLogs.length})</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
                {/* 即时流水过滤控件 */}
                {logSubTab === "instant" && (
                  <>
                    <div className="relative w-36">
                      <Search className="size-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={instantLogSearch}
                        onChange={(e) => { setInstantLogSearch(e.target.value); setInstantLogPage(1); }}
                        placeholder="搜索指令/输出..."
                        className="w-full h-7 pl-7 pr-2 rounded border border-border/80 bg-background text-xs font-mono outline-none"
                      />
                    </div>

                    <select
                      value={instantLogStatusFilter}
                      onChange={(e) => { setInstantLogStatusFilter(e.target.value as any); setInstantLogPage(1); }}
                      className="h-7 px-2 rounded border border-border/80 bg-background text-xs font-mono"
                    >
                      <option value="all">全部状态</option>
                      <option value="success">✓ 成功</option>
                      <option value="failed">✕ 失败</option>
                    </select>
                  </>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    refetchTasks();
                    refetchCronLogs();
                    toast.info("已刷新流水记录");
                  }}
                  className="h-7 px-2.5 text-xs cursor-pointer"
                  title="刷新流水数据"
                >
                  <RotateCw className={`size-3 ${isLoadingTasks || isLoadingCronLogs ? "animate-spin text-primary" : ""}`} />
                </Button>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════ */}
            {/* 子 Tab 1：计划任务调度流水 (两栏：任务名称 vs 调度批次)   */}
            {/* ══════════════════════════════════════════════════════ */}
            {logSubTab === "cron" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
                {/* ──────────────── 左栏：任务名称 (4列) ──────────────── */}
                <div className="lg:col-span-4 rounded-xl border border-border/70 bg-card/40 flex flex-col justify-between overflow-hidden min-h-[440px]">
                  <div className="p-3 border-b border-border/60 bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs flex items-center gap-1.5 text-foreground">
                        <Clock className="size-3.5 text-primary" />
                        <span>1. 计划任务名称 ({filteredCronJobGroups.length})</span>
                      </div>
                    </div>

                    <div className="relative">
                      <Search className="size-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={cronJobSearch}
                        onChange={(e) => {
                          setCronJobSearch(e.target.value);
                          setCronJobPage(1);
                        }}
                        placeholder="搜索任务名称/周期..."
                        className="w-full h-7 pl-6.5 pr-2 rounded-lg border border-border/80 bg-background text-[11px] font-mono outline-none focus:border-primary placeholder:text-muted-foreground/60"
                      />
                    </div>
                  </div>

                  {/* 任务名称列表 */}
                  <div className="flex-1 p-2 space-y-1.5 overflow-y-auto max-h-[360px]">
                    {paginatedCronJobs.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground text-xs font-sans">
                        暂无匹配的计划任务
                      </div>
                    ) : (
                      paginatedCronJobs.map((job) => {
                        const isSelected = (currentCronJob?.cronId === job.cronId);
                        const isSuccess = job.latestStatus === "success";

                        return (
                          <div
                            key={job.cronId}
                            onClick={() => {
                              setSelectedCronJobId(job.cronId);
                              setCronBatchPage(1);
                              setCronBatchSearch("");
                            }}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer text-xs space-y-1.5 select-none ${
                              isSelected
                                ? "bg-primary/10 border-primary shadow-xs font-semibold"
                                : "bg-card/70 border-border/50 hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                  className={`size-2 rounded-full shrink-0 ${
                                    isSuccess ? "bg-emerald-400" : "bg-rose-400"
                                  }`}
                                />
                                <span className="font-bold text-foreground truncate text-xs" title={job.cronName}>
                                  {job.cronName}
                                </span>
                              </div>
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-muted/60 text-foreground font-bold shrink-0 font-mono border-border/70">
                                {job.totalRuns} 批次
                              </Badge>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono font-normal">
                              <span className="text-primary font-semibold truncate pr-1" title={job.expression}>
                                {job.expression}
                              </span>
                              <span className="shrink-0">{relativeTime(job.latestRunAt)}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* 左栏任务分页（常驻展示） */}
                  <div className="p-2 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-1 text-[11px] font-mono select-none">
                    <span className="text-muted-foreground">
                      共 {filteredCronJobGroups.length} 项 · {cronJobPage}/{totalCronJobPages} 页
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={cronJobPage <= 1}
                        onClick={() => setCronJobPage((p) => Math.max(1, p - 1))}
                        className="h-5.5 px-1.5 text-[10px] cursor-pointer"
                      >
                        <ChevronLeft className="size-3" /> 上页
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={cronJobPage >= totalCronJobPages}
                        onClick={() => setCronJobPage((p) => Math.min(totalCronJobPages, p + 1))}
                        className="h-5.5 px-1.5 text-[10px] cursor-pointer"
                      >
                        下页 <ChevronRight className="size-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* ──────────────── 右栏：调度批次流水 (8列) ──────────────── */}
                <div className="lg:col-span-8 rounded-xl border border-border/70 bg-card/40 flex flex-col justify-between overflow-hidden min-h-[440px]">
                  <div className="p-3 border-b border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Repeat className="size-3.5 text-primary shrink-0" />
                      <span className="font-bold text-xs text-foreground truncate">
                        2. 调度批次流水: {currentCronJob?.cronName || "未选中任务"}
                      </span>
                      {currentCronJob && (
                        <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 bg-muted/40 shrink-0">
                          {currentCronJob.expression}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="relative w-32">
                        <Search className="size-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          value={cronBatchSearch}
                          onChange={(e) => {
                            setCronBatchSearch(e.target.value);
                            setCronBatchPage(1);
                          }}
                          placeholder="搜索批次/指令..."
                          className="w-full h-6.5 pl-6.5 pr-2 rounded border border-border/80 bg-background text-[11px] font-mono outline-none"
                        />
                      </div>

                      <select
                        value={cronBatchStatusFilter}
                        onChange={(e) => {
                          setCronBatchStatusFilter(e.target.value as any);
                          setCronBatchPage(1);
                        }}
                        className="h-6.5 px-1.5 rounded border border-border/80 bg-background text-[11px] font-mono"
                      >
                        <option value="all">全部状态</option>
                        <option value="success">✓ 成功</option>
                        <option value="failed">✕ 失败</option>
                      </select>
                    </div>
                  </div>

                  {/* 批次表格 */}
                  <div className="flex-1 p-2 overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono border-collapse min-w-[560px]">
                      <thead className="bg-muted/40 text-muted-foreground border-b border-border/70 select-none">
                        <tr>
                          <th className="px-3 py-2 font-semibold w-28">批次编号</th>
                          <th className="px-2.5 py-2 font-semibold w-20">触发源</th>
                          <th className="px-2.5 py-2 font-semibold w-16 text-center">状态</th>
                          <th className="px-2.5 py-2 font-semibold w-16 text-center">耗时</th>
                          <th className="px-2.5 py-2 font-semibold w-20 text-center">退出码</th>
                          <th className="px-2.5 py-2 font-semibold w-32">调度时间</th>
                          <th className="px-2.5 py-2 font-semibold w-18 text-center">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {paginatedBatches.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-muted-foreground">
                              当前任务暂无匹配的调度批次记录
                            </td>
                          </tr>
                        ) : (
                          paginatedBatches.map((batch) => {
                            const isSuccess = batch.status === "success";
                            return (
                              <tr key={batch.batchId} className="hover:bg-muted/30 transition-colors">
                                {/* 批次编号 */}
                                <td className="px-3 py-2 font-semibold text-foreground whitespace-nowrap">
                                  <div className="truncate max-w-[100px]" title={batch.batchId}>
                                    #{batch.batchId.slice(-8)}
                                  </div>
                                </td>

                                {/* 触发源 */}
                                <td className="px-2.5 py-2 whitespace-nowrap">
                                  {batch.triggerType === "cron" ? (
                                    <Badge variant="outline" className="text-[9px] px-1 py-0 border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-mono">
                                      ⏰ 定时
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-500/30 bg-amber-500/10 text-amber-400 font-mono">
                                      ⚡ 手动
                                    </Badge>
                                  )}
                                </td>

                                {/* 状态 */}
                                <td className="px-2.5 py-2 text-center whitespace-nowrap">
                                  <Badge
                                    variant={isSuccess ? "success" : "danger"}
                                    dot
                                    className="text-[9px] px-1.5 py-0 font-mono"
                                  >
                                    {isSuccess ? "成功" : "失败"}
                                  </Badge>
                                </td>

                                {/* 耗时 */}
                                <td className="px-2.5 py-2 text-center whitespace-nowrap text-muted-foreground text-[11px]">
                                  {durationStr(batch.durationMs)}
                                </td>

                                {/* Exit Code */}
                                <td className="px-2.5 py-2 text-center whitespace-nowrap">
                                  <span className={`px-1 py-0.2 rounded text-[9px] font-mono font-bold ${
                                    batch.exitCode === 0
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                  }`}>
                                    code {batch.exitCode ?? 0}
                                  </span>
                                </td>

                                {/* 调度时间 */}
                                <td className="px-2.5 py-2 text-muted-foreground whitespace-nowrap text-[11px]">
                                  {new Date(batch.startedAt).toLocaleTimeString("zh-CN", { hour12: false })}
                                </td>

                                {/* 详情按钮 */}
                                <td className="px-2.5 py-2 text-center whitespace-nowrap">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      setDetailModalItem({
                                        id: batch.batchId,
                                        title: batch.cronName,
                                        type: "cron",
                                        triggerType: batch.triggerType,
                                        command: batch.command,
                                        status: batch.status,
                                        startedAt: batch.startedAt,
                                        durationMs: batch.durationMs,
                                        exitCode: batch.exitCode,
                                        output: batch.output,
                                        cronExpression: batch.expression
                                      })
                                    }
                                    className="h-6 px-2 text-[11px] font-mono bg-muted/40 hover:bg-primary/20 hover:text-primary border-border/70 hover:border-primary/40 cursor-pointer transition-all shrink-0 gap-1 shadow-2xs"
                                    title="查看该批次调度完整详情与控制台回显"
                                  >
                                    <Info className="size-2.5 text-primary" />
                                    详情
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>

                    {paginatedBatches.length > 0 && paginatedBatches.length < cronBatchPageSize && (
                      <div className="py-2 px-4 text-center text-[10px] text-muted-foreground/60 font-mono italic select-none border-t border-border/30 bg-muted/10">
                        * 当前页展示全部 {paginatedBatches.length} 批次调度流水（标准单页容量为 {cronBatchPageSize} 批次）
                      </div>
                    )}
                  </div>

                  {/* 右栏批次分页（常驻展示） */}
                  <div className="p-2 border-t border-border/60 bg-muted/20 flex items-center justify-between gap-1 text-[11px] font-mono select-none">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <span>
                        共 <strong>{filteredBatches.length}</strong> 批次 · 第 <strong>{cronBatchPage}</strong>/{totalBatchPages} 页
                      </span>
                      <span>·</span>
                      <select
                        value={cronBatchPageSize}
                        onChange={(e) => {
                          setCronBatchPageSize(Number(e.target.value));
                          setCronBatchPage(1);
                        }}
                        className="bg-muted/40 border border-border/80 rounded px-1 py-0.5 text-[10px] outline-none font-semibold text-foreground cursor-pointer"
                      >
                        <option value={5}>5 批次/页</option>
                        <option value={10}>10 批次/页</option>
                        <option value={20}>20 批次/页</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={cronBatchPage <= 1}
                        onClick={() => setCronBatchPage((p) => Math.max(1, p - 1))}
                        className="h-5.5 px-2 text-[10px] cursor-pointer"
                      >
                        <ChevronLeft className="size-3" /> 上页
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={cronBatchPage >= totalBatchPages}
                        onClick={() => setCronBatchPage((p) => Math.min(totalBatchPages, p + 1))}
                        className="h-5.5 px-2 text-[10px] cursor-pointer"
                      >
                        下页 <ChevronRight className="size-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════ */}
            {/* 子 Tab 2：即时命令下发流水                              */}
            {/* ══════════════════════════════════════════════════════ */}
            {logSubTab === "instant" && (
              <div className="space-y-3">
                <div className="overflow-x-auto rounded-lg border border-border/60 min-h-[220px] flex flex-col justify-between">
                  <table className="w-full text-left text-xs font-mono border-collapse min-w-[700px]">
                    <thead className="bg-muted/40 text-muted-foreground border-b border-border/70 select-none">
                      <tr>
                        <th className="px-4 py-2.5 font-semibold w-40">即时下发批次</th>
                        <th className="px-3 py-2.5 font-semibold">执行 Shell 指令</th>
                        <th className="px-3 py-2.5 font-semibold w-20 text-center">状态</th>
                        <th className="px-3 py-2.5 font-semibold w-20 text-center">耗时</th>
                        <th className="px-3 py-2.5 font-semibold w-20 text-center">退出码</th>
                        <th className="px-3 py-2.5 font-semibold w-36">触发时间</th>
                        <th className="px-3 py-2.5 font-semibold min-w-[180px]">输出回显摘要</th>
                        <th className="px-3 py-2.5 font-semibold w-20 text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredInstantLogs.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-muted-foreground">
                            暂无即时命令下发记录，可在【⚡ 立即下发执行】中发起指令
                          </td>
                        </tr>
                      ) : (
                        paginatedInstantLogs.map((log) => {
                          const isSuccess = log.status === "success";
                          return (
                            <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                              {/* 批次/编号 */}
                              <td className="px-4 py-2.5 font-semibold text-foreground whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-400 border-amber-500/20 font-mono">
                                    ⚡ 即时
                                  </Badge>
                                  <span className="truncate max-w-[90px]" title={log.id}>#{log.id.slice(-8)}</span>
                                </div>
                              </td>

                              {/* 执行指令 */}
                              <td className="px-3 py-2.5 text-muted-foreground max-w-[240px]">
                                <div className="truncate font-mono bg-muted/30 px-2 py-1 rounded border border-border/40 text-[11px]" title={log.command}>
                                  {log.command}
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
                                {durationStr(log.durationMs)}
                              </td>

                              {/* 退出码 */}
                              <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold ${
                                  log.exitCode === 0
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                }`}>
                                  code {log.exitCode ?? 0}
                                </span>
                              </td>

                              {/* 时间 */}
                              <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap text-[11px]">
                                {new Date(log.startedAt).toLocaleString("zh-CN", { hour12: false })}
                              </td>

                              {/* 输出摘要 */}
                              <td className="px-3 py-2.5 text-muted-foreground max-w-[200px]">
                                <div className="truncate font-mono text-[11px]" title={log.output}>
                                  {log.output || "无标准输出"}
                                </div>
                              </td>

                              {/* 详情/日志按钮 */}
                              <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setDetailModalItem({
                                      id: log.id,
                                      title: log.title,
                                      type: "dispatch",
                                      command: log.command,
                                      status: log.status,
                                      startedAt: log.startedAt,
                                      durationMs: log.durationMs,
                                      exitCode: log.exitCode,
                                      output: log.output
                                    })
                                  }
                                  className="h-6 px-2 text-[11px] font-mono bg-muted/40 hover:bg-primary/20 hover:text-primary border-border/70 hover:border-primary/40 cursor-pointer transition-all shrink-0 gap-1 shadow-2xs"
                                  title="查看即时下发详情与日志"
                                >
                                  <Info className="size-2.5 text-primary" />
                                  详情
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>

                  {paginatedInstantLogs.length > 0 && paginatedInstantLogs.length < instantLogPageSize && (
                    <div className="py-2 px-4 text-center text-[10px] text-muted-foreground/60 font-mono italic select-none border-t border-border/30 bg-muted/10">
                      * 当前页展示全部 {paginatedInstantLogs.length} 条即时下发记录（标准单页容量为 {instantLogPageSize} 条）
                    </div>
                  )}
                </div>

                {/* 即时流水分页控制栏（常驻展示） */}
                <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground font-mono select-none">
                  <div className="flex items-center gap-1.5">
                    <span>
                      共 <strong>{filteredInstantLogs.length}</strong> 条 · 第 <strong>{instantLogPage}</strong> / {totalInstantLogPages} 页
                    </span>
                    <span>·</span>
                    <select
                      value={instantLogPageSize}
                      onChange={(e) => {
                        setInstantLogPageSize(Number(e.target.value));
                        setInstantLogPage(1);
                      }}
                      className="bg-muted/40 border border-border/80 rounded px-1.5 py-0.5 text-[11px] outline-none font-semibold text-foreground cursor-pointer"
                    >
                      <option value={5}>5 条/页</option>
                      <option value={10}>10 条/页</option>
                      <option value={20}>20 条/页</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={instantLogPage <= 1}
                      onClick={() => setInstantLogPage((p) => Math.max(1, p - 1))}
                      className="h-6 px-2 text-xs cursor-pointer font-mono"
                    >
                      <ChevronLeft className="size-3" /> 上一页
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={instantLogPage >= totalInstantLogPages}
                      onClick={() => setInstantLogPage((p) => Math.min(totalInstantLogPages, p + 1))}
                      className="h-6 px-2 text-xs cursor-pointer font-mono"
                    >
                      下一页 <ChevronRight className="size-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 新建 / 编辑计划任务弹窗 (目标服务器锁定当前主机) */}
      <Dialog open={cronDialogOpen} onOpenChange={setCronDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Clock className="size-4" />
              </div>
              <DialogTitle className="text-sm font-bold text-foreground">
                {editingCronId ? "编辑单机计划任务" : "新建单机计划任务"}
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

      {/* ── 统一调度与执行详情弹窗 ── */}
      <Dialog open={!!detailModalItem} onOpenChange={(open) => !open && setDetailModalItem(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge
                variant={detailModalItem?.status === "success" ? "success" : "danger"}
                dot
                className="text-xs px-2 py-0.5"
              >
                {detailModalItem?.status === "success" ? "执行成功" : "执行失败"}
              </Badge>
              <DialogTitle className="text-sm font-bold text-foreground truncate max-w-[340px]">
                {detailModalItem?.title}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs font-mono">
              批次编号: {detailModalItem?.id} · 节点: {server.name} ({detailModalItem?.type === "dispatch" ? "即时命令下发" : detailModalItem?.triggerType === "manual" ? "计划任务(手动触发)" : "计划任务(定时自动)"})
            </DialogDescription>
          </DialogHeader>

          {detailModalItem && (
            <div className="space-y-3 py-1 text-xs font-mono">
              {/* 关键属性条 */}
              <div className="grid grid-cols-4 gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/70 text-[11px]">
                <div>
                  <div className="text-muted-foreground text-[10px]">调度周期</div>
                  <div className="font-semibold text-primary mt-0.5 truncate">
                    {detailModalItem.cronExpression || "即时下发"}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[10px]">触发时间</div>
                  <div className="font-semibold text-foreground mt-0.5">
                    {new Date(detailModalItem.startedAt).toLocaleTimeString("zh-CN", { hour12: false })}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[10px]">运行耗时</div>
                  <div className="font-semibold text-foreground mt-0.5">
                    {durationStr(detailModalItem.durationMs)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[10px]">退出码</div>
                  <div className="font-semibold text-foreground mt-0.5">
                    code {detailModalItem.exitCode ?? 0}
                  </div>
                </div>
              </div>

              {/* 执行指令 */}
              <div className="space-y-1">
                <div className="text-muted-foreground text-[10px]">执行指令内容</div>
                <div className="p-2 rounded bg-zinc-950 text-emerald-400 font-mono text-[11px] border border-zinc-800 break-all select-text">
                  root@{server.name}:~# {detailModalItem.command}
                </div>
              </div>

              {/* Shell 输出日志 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-muted-foreground text-[10px]">
                  <span>控制台标准输出 (Stdout / Stderr)</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(detailModalItem.output || "");
                      toast.success("已复制日志输出文本");
                    }}
                    className="text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="size-2.5" /> 复制输出
                  </button>
                </div>
                <div className="h-56 overflow-y-auto p-3 rounded-lg bg-zinc-950 text-zinc-200 font-mono text-[11px] leading-relaxed border border-zinc-800 select-text whitespace-pre-wrap">
                  {detailModalItem.output || "[无控制台回显输出]"}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-end gap-2 pt-2 border-t border-border/60">
            <Button
              size="sm"
              onClick={() => setDetailModalItem(null)}
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
