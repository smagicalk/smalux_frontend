import { useState, useMemo, useEffect } from "react";
import {
  Terminal,
  Clock,
  ScrollText,
  Play,
  Plus,
  Copy,
  ChevronRight,
  Search,
  Server,
  Check,
  X,
  Trash2,
  RefreshCw,
  Edit2,
  History,
  Code2,
  ExternalLink,
  Activity,
  Sparkles,
  SlidersHorizontal,
  Variable,
  Layers,
  Calendar,
  Shield,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Filter,
  Repeat,
  Zap,
  Timer
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Switch } from "@/shared/ui/switch";
import { PageHeader } from "@/shared/ui/page-header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { toast } from "sonner";
import {
  useTasks,
  useTaskVariables,
  useDispatchTask,
  useCrons,
  useCronLogs,
  useCreateCron,
  useUpdateCron,
  useToggleCron,
  useDeleteCron
} from "../api/use-automation";
import { useInfrastructureData } from "@/features/infrastructure/api/use-infrastructure-api";
import { ScriptLibraryWidget } from "@/shared/components/script-library";
import type { Task, Cron, CronLog, TaskVariable } from "@/shared/api/methods";

// ─────────────────────────────────────────────────────────────
// 辅助计算与格式化工具函数
// ─────────────────────────────────────────────────────────────

function relativeTime(ts?: number): string {
  if (!ts) return "—";
  const diff = Date.now() - ts;
  if (diff < 60_000) return "刚刚";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} 小时前`;
  return `${Math.floor(diff / 86_400_000)} 天前`;
}

function durationStr(ms?: number): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function statusBadge(status: string) {
  switch (status) {
    case "success":
      return <Badge variant="success" dot>成功</Badge>;
    case "running":
      return <Badge variant="info" dot>执行中</Badge>;
    case "failed":
      return <Badge variant="danger" dot>失败</Badge>;
    case "timeout":
      return <Badge variant="danger" dot>超时</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}

function batchStatusBadge(batch: TaskBatchGroup) {
  if (batch.status === "running") {
    return <Badge variant="info" dot>执行中 ({batch.tasks.filter((t) => t.status === "success").length}/{batch.totalNodes})</Badge>;
  }
  if (batch.status === "success") {
    return <Badge variant="success" dot>{batch.totalNodes > 1 ? `全部成功 (${batch.totalNodes}台)` : "执行成功"}</Badge>;
  }
  if (batch.status === "partial") {
    return <Badge variant="warning" dot>部分成功 ({batch.successNodes}/{batch.totalNodes})</Badge>;
  }
  return <Badge variant="danger" dot>{batch.totalNodes > 1 ? `全部失败 (${batch.totalNodes}台)` : "执行失败"}</Badge>;
}

function parseCronDescription(expr: string): string {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return "自定义表达式";

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

// ─────────────────────────────────────────────────────────────
// 动态运维变量默认兜底定义
// ─────────────────────────────────────────────────────────────

export interface DynamicVariable {
  key: string;
  category: "host" | "time" | "env";
  label: string;
  desc: string;
  example: string;
}

export const DYNAMIC_VARIABLES: DynamicVariable[] = [
  // ── 主机网络与元数据 ──
  { key: "{{SERVER_IPV4}}", category: "host", label: "主机 IPv4 地址", desc: "自动注入当前调度目标节点的公网或主内网 IPv4", example: "185.199.108.153" },
  { key: "{{SERVER_IPV6}}", category: "host", label: "主机 IPv6 地址", desc: "自动注入当前调度目标节点的 IPv6 地址", example: "2400:cb00:2048:1::c629:d7a2" },
  { key: "{{SERVER_NAME}}", category: "host", label: "主机 Hostname", desc: "自动注入当前节点的标准主机名称", example: "edge-hkg-01" },
  { key: "{{SERVER_ID}}", category: "host", label: "主机唯一识别 ID", desc: "系统全局分配的节点唯一标识符", example: "srv-hkg-01" },
  { key: "{{SERVER_REGION}}", category: "host", label: "主机所属地域/机房", desc: "节点所在的地理区域或数据中心代码", example: "Hong Kong (HKG)" },
  { key: "{{SERVER_GROUP}}", category: "host", label: "业务分组名称", desc: "节点所属的业务拓扑集群或逻辑分组", example: "网关集群" },
  { key: "{{SERVER_PORT}}", category: "host", label: "Agent 通信端口", desc: "目标主机上 Agent 服务监听的远程端口", example: "22" },
  { key: "{{TRAFFIC_USED}}", category: "host", label: "当月已用流量", desc: "目标主机当前计费周期的公网出入流量累计", example: "3.42 TB" },
  { key: "{{TRAFFIC_TOTAL}}", category: "host", label: "当月总流量配额", desc: "目标主机的每月月度流量总配额上限", example: "10.00 TB" },
  { key: "{{TRAFFIC_USAGE_PERCENT}}", category: "host", label: "流量使用率百分比", desc: "已用流量与总配额的实时百分比", example: "34.2%" },

  // ── 时间戳与格式化日期 ──
  { key: "{{TIMESTAMP}}", category: "time", label: "Unix 时间戳 (秒)", desc: "当前任务执行开始时的 10 位标准秒级时间戳", example: "1724428800" },
  { key: "{{TIMESTAMP_MS}}", category: "time", label: "毫秒时间戳 (ms)", desc: "高精度 13 位毫秒级 Unix 时间戳", example: "1724428800123" },
  { key: "{{DATE}}", category: "time", label: "当前日期 (YYYY-MM-DD)", desc: "以 ISO 格式输出的当天标准公历日期", example: "2026-08-23" },
  { key: "{{TIME}}", category: "time", label: "当前时间 (HH:mm:ss)", desc: "当前执行时分秒标准时间戳", example: "14:30:00" },
  { key: "{{DATETIME}}", category: "time", label: "紧凑日期时间", desc: "适合作为日志/备份文件后缀的年月日时间串", example: "20260823_143000" },

  // ── 运行环境与上下文 ──
  { key: "{{EXEC_USER}}", category: "env", label: "执行操作人", desc: "发起本次运维下发的当前登录管理员工号/角色", example: "root / admin" },
  { key: "{{TEMP_DIR}}", category: "env", label: "安全临时执行目录", desc: "远程节点上为本次任务开辟的沙箱临时目录", example: "/tmp/smalux_job" },
  { key: "{{LOG_FILE}}", category: "env", label: "任务专用日志文件", desc: "自动生成的单次指令独立日志输出路径", example: "/var/log/smalux_task.log" },
  { key: "{{AGENT_VERSION}}", category: "env", label: "Agent 客户端版本", desc: "目标主机上当前运行的 Smalux Fleet 守护版本", example: "v2.4.0" },
  { key: "{{RANDOM_ID}}", category: "env", label: "随机任务 Hash (8位)", desc: "为防止多节点命名冲突生成的随机十六进制串", example: "9f4a8b2c" }
];

// ─────────────────────────────────────────────────────────────
// 每次下发执行的批次分组类型定义
// ─────────────────────────────────────────────────────────────

export interface TaskBatchGroup {
  id: string;
  batchId?: string;
  command: string;
  startedAt: number;
  totalNodes: number;
  successNodes: number;
  failedNodes: number;
  runningNodes: number;
  tasks: Task[];
  status: "success" | "running" | "failed" | "partial";
}

export interface CronBatchLogGroup {
  batchId: string;
  runNumber?: number;
  cronId: string;
  cronName: string;
  expression: string;
  command: string;
  triggerType: "cron" | "manual";
  startedAt: number;
  totalNodes: number;
  successNodes: number;
  failedNodes: number;
  runningNodes: number;
  status: "success" | "failed" | "partial" | "running";
  logs: CronLog[];
}

export interface CronJobLogGroup {
  cronId: string;
  cronName: string;
  expression: string;
  command: string;
  totalRuns: number;
  successRuns: number;
  failedRuns: number;
  latestRunAt: number;
  batches: CronBatchLogGroup[];
}

// ─────────────────────────────────────────────────────────────
// 自动化运维主页面组件
// ─────────────────────────────────────────────────────────────

export function AutomationPage() {
  const [activeTab, setActiveTab] = useState<"dispatch" | "cron" | "logs">("dispatch");
  const [logSubTab, setLogSubTab] = useState<"adhoc" | "cron">("adhoc");

  // RPC 数据与 Hooks
  const { data: taskData, isLoading: isLoadingTasks, refetch: refetchTasks } = useTasks();
  const { data: varData, isLoading: isLoadingVars } = useTaskVariables();
  const { data: cronData, isLoading: isLoadingCrons, refetch: refetchCrons } = useCrons();
  const { data: cronLogData, isLoading: isLoadingCronLogs, refetch: refetchCronLogs } = useCronLogs();

  const dispatchTask = useDispatchTask();
  const createCron = useCreateCron();
  const updateCron = useUpdateCron();
  const toggleCron = useToggleCron();
  const deleteCron = useDeleteCron();

  // 可调度服务器列表
  const { servers } = useInfrastructureData({ limit: 100 });

  const onlineServers = useMemo(() => {
    return servers.filter((s) => s.status !== "offline");
  }, [servers]);

  const tasks: Task[] = taskData?.tasks ?? [];
  const dynamicVariables: TaskVariable[] = useMemo(() => varData?.variables ?? DYNAMIC_VARIABLES, [varData]);
  const crons: Cron[] = cronData?.crons ?? [];
  const cronLogs: CronLog[] = cronLogData?.logs ?? [];

  // ── 即时命令下发状态 ──
  const [commandText, setCommandText] = useState("df -h && free -m");
  const [serverSelectorOpen, setServerSelectorOpen] = useState(false);
  const [selectedServerIds, setSelectedServerIds] = useState<string[]>([]);
  const [serverSearchQuery, setServerSearchQuery] = useState("");

  // ── 动态变量选择器模态框状态 ──
  const [variableModalOpen, setVariableModalOpen] = useState(false);
  const [variableSearchQuery, setVariableSearchQuery] = useState("");
  const [variableCategory, setVariableCategory] = useState<"all" | "host" | "time" | "env">("all");

  // ── 实时下发执行控制台状态 ──
  const [activeBatchResult, setActiveBatchResult] = useState<{
    batchId: string;
    command: string;
    dispatchedAt: number;
    serverIds: string[];
    activeServerId: string;
  } | null>(null);

  // 历史下发命令本地记忆（最近 8 条）
  const [commandHistory, setCommandHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("smalux_cmd_history");
      return saved ? JSON.parse(saved) : ["df -h && free -m", "systemctl status smalux-agent", "docker ps -a"];
    } catch {
      return ["df -h && free -m"];
    }
  });

  // ── 定时计划任务状态 ──
  const [cronDialogOpen, setCronDialogOpen] = useState(false);
  const [editingCronId, setEditingCronId] = useState<string | null>(null);
  const [cronForm, setCronForm] = useState({ name: "", expression: "0 2 * * *", command: "", serverId: "" });
  const [cronSearchQuery, setCronSearchQuery] = useState("");
  const [cronFilterStatus, setCronFilterStatus] = useState<"all" | "enabled" | "disabled">("all");

  // ── 即时下发记录筛选与选中的 Batch / 机器 ──
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [logStatusFilter, setLogStatusFilter] = useState<string>("all");
  const [autoRefreshLogs, setAutoRefreshLogs] = useState(true);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);
  const [selectedNodeIdInBatch, setSelectedNodeIdInBatch] = useState<string | null>(null);
  const [nodeStatusFilter, setNodeStatusFilter] = useState<"all" | "failed" | "success" | "running">("all");
  const [nodeSearchQuery, setNodeSearchQuery] = useState("");

  // ── 计划调度记录（任务名称 -> 批次/机器 -> 终端 三栏）状态 ──
  const [cronLogSearchQuery, setCronLogSearchQuery] = useState("");
  const [cronLogTriggerFilter, setCronLogTriggerFilter] = useState<string>("all");
  const [cronLogStatusFilter, setCronLogStatusFilter] = useState<string>("all");
  const [selectedCronJobId, setSelectedCronJobId] = useState<string | null>(null);
  const [cronDetailViewMode, setCronDetailViewMode] = useState<"batch" | "node">("batch");
  const [cronDetailSearch, setCronDetailSearch] = useState("");
  const [selectedCronBatchId, setSelectedCronBatchId] = useState<string | null>(null);
  const [expandedCronBatchId, setExpandedCronBatchId] = useState<string | null>(null);
  const [expandedCronNodeSummaryId, setExpandedCronNodeSummaryId] = useState<string | null>(null);
  const [selectedCronNodeId, setSelectedCronNodeId] = useState<string | null>(null);
  const [cronNodeStatusFilter, setCronNodeStatusFilter] = useState<"all" | "failed" | "success" | "running">("all");
  const [cronNodeSearchQuery, setCronNodeSearchQuery] = useState("");

  // 自动轮询刷新任务日志（每 4 秒）
  useEffect(() => {
    if (!autoRefreshLogs) return;
    const timer = setInterval(() => {
      refetchTasks();
      refetchCronLogs();
    }, 4000);
    return () => clearInterval(timer);
  }, [autoRefreshLogs, refetchTasks, refetchCronLogs]);

  // 过滤后的变量列表
  const filteredVariables = useMemo(() => {
    return dynamicVariables.filter((item) => {
      const matchCat =
        variableCategory === "all" || item.category === variableCategory;
      const q = variableSearchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        item.key.toLowerCase().includes(q) ||
        item.label.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        item.example.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [dynamicVariables, variableCategory, variableSearchQuery]);

  // ─────────────────────────────────────────────────────────────
  // 即时下发记录：聚合成「每次执行算一次分组 (TaskBatchGroup)」
  // ─────────────────────────────────────────────────────────────
  const batchGroups = useMemo<TaskBatchGroup[]>(() => {
    const map = new Map<string, Task[]>();

    for (const t of tasks) {
      const key = t.batchId || `${t.command}_${Math.floor((t.startedAt || 0) / 5000)}`;
      const list = map.get(key) || [];
      list.push(t);
      map.set(key, list);
    }

    const groups: TaskBatchGroup[] = [];
    map.forEach((list, key) => {
      const first = list[0];
      const totalNodes = list.length;
      const successNodes = list.filter((t) => t.status === "success").length;
      const failedNodes = list.filter((t) => t.status === "failed" || t.status === "timeout").length;
      const runningNodes = list.filter((t) => t.status === "running" || t.status === "pending").length;

      let status: TaskBatchGroup["status"] = "success";
      if (runningNodes > 0) {
        status = "running";
      } else if (failedNodes === totalNodes) {
        status = "failed";
      } else if (failedNodes > 0) {
        status = "partial";
      }

      groups.push({
        id: key,
        batchId: first.batchId,
        command: first.command,
        startedAt: first.startedAt || Date.now(),
        totalNodes,
        successNodes,
        failedNodes,
        runningNodes,
        tasks: list,
        status
      });
    });

    return groups.sort((a, b) => b.startedAt - a.startedAt);
  }, [tasks]);

  const filteredBatchGroups = useMemo(() => {
    return batchGroups.filter((g) => {
      const matchSearch =
        !logSearchQuery ||
        g.command.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
        g.id.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
        g.tasks.some((t) => t.serverName.toLowerCase().includes(logSearchQuery.toLowerCase()) || t.serverId.toLowerCase().includes(logSearchQuery.toLowerCase()));

      let matchStatus = true;
      if (logStatusFilter === "success") matchStatus = g.status === "success";
      if (logStatusFilter === "running") matchStatus = g.status === "running";
      if (logStatusFilter === "failed") matchStatus = g.status === "failed" || g.status === "partial";

      return matchSearch && matchStatus;
    });
  }, [batchGroups, logSearchQuery, logStatusFilter]);

  const currentBatch = useMemo<TaskBatchGroup | null>(() => {
    if (selectedBatchId) {
      const found = batchGroups.find((g) => g.id === selectedBatchId);
      if (found) return found;
    }
    return filteredBatchGroups[0] || batchGroups[0] || null;
  }, [batchGroups, filteredBatchGroups, selectedBatchId]);

  const filteredBatchTasks = useMemo(() => {
    if (!currentBatch) return [];
    return currentBatch.tasks.filter((t) => {
      let matchStatus = true;
      if (nodeStatusFilter === "failed") {
        matchStatus = t.status === "failed" || t.status === "timeout";
      } else if (nodeStatusFilter === "success") {
        matchStatus = t.status === "success";
      } else if (nodeStatusFilter === "running") {
        matchStatus = t.status === "running" || t.status === "pending";
      }

      const q = nodeSearchQuery.trim().toLowerCase();
      const matchQuery = !q || t.serverName.toLowerCase().includes(q) || t.serverId.toLowerCase().includes(q);

      return matchStatus && matchQuery;
    });
  }, [currentBatch, nodeStatusFilter, nodeSearchQuery]);

  const currentBatchActiveTask = useMemo<Task | null>(() => {
    if (!currentBatch) return null;
    if (selectedNodeIdInBatch) {
      const foundInFiltered = filteredBatchTasks.find((t) => t.serverId === selectedNodeIdInBatch);
      if (foundInFiltered) return foundInFiltered;
    }
    return filteredBatchTasks[0] || currentBatch.tasks[0] || null;
  }, [currentBatch, selectedNodeIdInBatch, filteredBatchTasks]);

  // ─────────────────────────────────────────────────────────────
  // 计划调度记录：按「任务名称 -> 批次(第几次下发) -> 机器记录」三层聚合
  // ─────────────────────────────────────────────────────────────
  const cronJobGroups = useMemo<CronJobLogGroup[]>(() => {
    const jobMap = new Map<string, Map<string, CronLog[]>>();

    for (const log of cronLogs) {
      const jMap = jobMap.get(log.cronId) || new Map<string, CronLog[]>();
      const batchKey = log.batchId || `cb_${log.cronId}_${Math.floor(log.startedAt / 5000)}`;
      const list = jMap.get(batchKey) || [];
      list.push(log);
      jMap.set(batchKey, list);
      jobMap.set(log.cronId, jMap);
    }

    const groups: CronJobLogGroup[] = [];

    jobMap.forEach((batchMap, cronId) => {
      const batches: CronBatchLogGroup[] = [];

      batchMap.forEach((logs, batchKey) => {
        const first = logs[0];
        const totalNodes = logs.length;
        const successNodes = logs.filter((l) => l.status === "success").length;
        const failedNodes = logs.filter((l) => l.status === "failed" || l.status === "timeout").length;
        const runningNodes = logs.filter((l) => l.status === "running" || l.status === "pending").length;

        let status: CronBatchLogGroup["status"] = "success";
        if (runningNodes > 0) status = "running";
        else if (failedNodes === totalNodes) status = "failed";
        else if (failedNodes > 0) status = "partial";

        batches.push({
          batchId: batchKey,
          runNumber: first.runNumber,
          cronId: first.cronId,
          cronName: first.cronName,
          expression: first.expression,
          command: first.command,
          triggerType: first.triggerType,
          startedAt: first.startedAt,
          totalNodes,
          successNodes,
          failedNodes,
          runningNodes,
          status,
          logs
        });
      });

      batches.sort((a, b) => b.startedAt - a.startedAt);

      if (batches.length > 0) {
        const firstBatch = batches[0];
        const successRuns = batches.filter((b) => b.status === "success").length;
        const failedRuns = batches.filter((b) => b.status === "failed" || b.status === "partial").length;

        groups.push({
          cronId,
          cronName: firstBatch.cronName,
          expression: firstBatch.expression,
          command: firstBatch.command,
          totalRuns: batches.length,
          successRuns,
          failedRuns,
          latestRunAt: firstBatch.startedAt,
          batches
        });
      }
    });

    return groups.sort((a, b) => b.latestRunAt - a.latestRunAt);
  }, [cronLogs]);

  // 过滤后的 Cron Job Groups
  const filteredCronJobGroups = useMemo(() => {
    return cronJobGroups.map((job) => {
      const filteredBatches = job.batches.filter((b) => {
        const matchTrigger = cronLogTriggerFilter === "all" || b.triggerType === cronLogTriggerFilter;
        let matchStatus = true;
        if (cronLogStatusFilter === "success") matchStatus = b.status === "success";
        if (cronLogStatusFilter === "failed") matchStatus = b.status === "failed" || b.status === "partial";
        if (cronLogStatusFilter === "running") matchStatus = b.status === "running";

        const q = cronLogSearchQuery.trim().toLowerCase();
        const matchSearch =
          !q ||
          b.cronName.toLowerCase().includes(q) ||
          b.command.toLowerCase().includes(q) ||
          b.logs.some((l) => l.serverName.toLowerCase().includes(q) || l.serverId.toLowerCase().includes(q));

        return matchTrigger && matchStatus && matchSearch;
      });

      return {
        ...job,
        batches: filteredBatches
      };
    }).filter((job) => {
      if (cronLogSearchQuery || cronLogTriggerFilter !== "all" || cronLogStatusFilter !== "all") {
        return job.batches.length > 0;
      }
      return true;
    });
  }, [cronJobGroups, cronLogTriggerFilter, cronLogStatusFilter, cronLogSearchQuery]);

  // 当前选中的 Cron Job
  const currentCronJob = useMemo<CronJobLogGroup | null>(() => {
    if (selectedCronJobId) {
      const found = filteredCronJobGroups.find((j) => j.cronId === selectedCronJobId);
      if (found) return found;
    }
    return filteredCronJobGroups[0] || null;
  }, [filteredCronJobGroups, selectedCronJobId]);

  // ── 针对当前 Job 下按「机器维度 (By Node)」聚合历次调度记录 ──
  const currentCronJobNodes = useMemo(() => {
    if (!currentCronJob) return [];
    const map = new Map<string, {
      serverId: string;
      serverName: string;
      totalRuns: number;
      successRuns: number;
      failedRuns: number;
      latestStatus: "success" | "failed" | "running";
      latestRunAt: number;
      runs: {
        batchId: string;
        runNumber?: number;
        triggerType: "cron" | "manual";
        startedAt: number;
        durationMs: number;
        exitCode: number;
        status: "success" | "failed" | "running";
        output?: string;
        log: CronLog;
      }[];
    }>();

    for (const batch of currentCronJob.batches) {
      for (const log of batch.logs) {
        const item = map.get(log.serverId) || {
          serverId: log.serverId,
          serverName: log.serverName,
          totalRuns: 0,
          successRuns: 0,
          failedRuns: 0,
          latestStatus: "success",
          latestRunAt: log.startedAt,
          runs: []
        };

        item.totalRuns += 1;
        if (log.status === "success") item.successRuns += 1;
        else if (log.status === "failed" || log.status === "timeout") item.failedRuns += 1;

        if (item.runs.length === 0) {
          item.latestStatus = log.status as any;
          item.latestRunAt = log.startedAt;
        }

        item.runs.push({
          batchId: batch.batchId,
          runNumber: batch.runNumber,
          triggerType: batch.triggerType,
          startedAt: log.startedAt,
          durationMs: log.durationMs || 0,
          exitCode: log.exitCode ?? 0,
          status: log.status as any,
          output: log.output,
          log
        });

        map.set(log.serverId, item);
      }
    }

    return Array.from(map.values()).sort((a, b) => b.latestRunAt - a.latestRunAt);
  }, [currentCronJob]);

  // 当前选中的批次 (在当前选中的 Job 之下)
  const currentCronBatch = useMemo<CronBatchLogGroup | null>(() => {
    if (!currentCronJob || currentCronJob.batches.length === 0) return null;
    if (selectedCronBatchId) {
      const found = currentCronJob.batches.find((b) => b.batchId === selectedCronBatchId);
      if (found) return found;
    }
    return currentCronJob.batches[0] || null;
  }, [currentCronJob, selectedCronBatchId]);

  // 当前选中批次下过滤的节点任务
  const filteredCronBatchLogs = useMemo(() => {
    if (!currentCronBatch) return [];
    return currentCronBatch.logs.filter((l) => {
      let matchStatus = true;
      if (cronNodeStatusFilter === "failed") {
        matchStatus = l.status === "failed" || l.status === "timeout";
      } else if (cronNodeStatusFilter === "success") {
        matchStatus = l.status === "success";
      } else if (cronNodeStatusFilter === "running") {
        matchStatus = l.status === "running";
      }

      const q = cronNodeSearchQuery.trim().toLowerCase();
      const matchQuery = !q || l.serverName.toLowerCase().includes(q) || l.serverId.toLowerCase().includes(q);

      return matchStatus && matchQuery;
    });
  }, [currentCronBatch, cronNodeStatusFilter, cronNodeSearchQuery]);

  // 当前激活节点执行记录
  const currentCronNodeLog = useMemo<CronLog | null>(() => {
    if (!currentCronBatch || currentCronBatch.logs.length === 0) return null;
    if (selectedCronNodeId) {
      const found = currentCronBatch.logs.find((l) => l.serverId === selectedCronNodeId);
      if (found) return found;
    }
    return currentCronBatch.logs[0] || null;
  }, [currentCronBatch, selectedCronNodeId]);

  // 目标选择器过滤后的主机列表
  const filteredServers = useMemo(() => {
    if (!serverSearchQuery.trim()) return servers;
    const q = serverSearchQuery.toLowerCase();
    return servers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.ip.includes(q) ||
        (s.group || "").toLowerCase().includes(q)
    );
  }, [servers, serverSearchQuery]);

  const selectedLabel = useMemo(() => {
    if (selectedServerIds.length === 0) return "点击选择目标主机范围...";
    if (selectedServerIds.length === onlineServers.length && onlineServers.length > 0) {
      return `全网在线主机 (${onlineServers.length} 台)`;
    }
    if (selectedServerIds.length <= 2) {
      return selectedServerIds
        .map((id) => servers.find((s) => s.id === id)?.name || id)
        .join(", ");
    }
    return `已选 ${selectedServerIds.length} 台在线主机`;
  }, [selectedServerIds, servers, onlineServers]);

  const toggleServer = (id: string) => {
    const s = servers.find((item) => item.id === id);
    if (s && s.status === "offline") {
      toast.warning(`主机 [${s.name || id}] 当前已离线，无法调度执行运维指令`);
      return;
    }

    setSelectedServerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllOnlineServers = () => {
    setSelectedServerIds(onlineServers.map((s) => s.id));
    toast.info(`已勾选全部 ${onlineServers.length} 台在线可用主机`);
  };

  const deselectAllServers = () => {
    setSelectedServerIds([]);
  };

  const insertVariable = (variableKey: string) => {
    setCommandText((prev) => `${prev} ${variableKey}`);
    toast.info(`已插入变量 ${variableKey}`);
  };

  const pushToHistory = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;
    setCommandHistory((prev) => {
      const filtered = prev.filter((c) => c !== trimmed);
      const next = [trimmed, ...filtered].slice(0, 8);
      try {
        localStorage.setItem("smalux_cmd_history", JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleDispatch = () => {
    if (!commandText.trim()) {
      toast.error("请输入要下发的 Shell 指令");
      return;
    }
    if (selectedServerIds.length === 0) {
      toast.error("请至少勾选一台在线目标主机");
      return;
    }

    const validServerIds = selectedServerIds.filter((id) => {
      const s = servers.find((item) => item.id === id);
      return s && s.status !== "offline";
    });

    if (validServerIds.length === 0) {
      toast.error("所选节点均处于离线状态，无法下发");
      return;
    }

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const datetimeStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    const batchId = `b_${Date.now()}`;

    for (const serverId of validServerIds) {
      const server = servers.find((s) => s.id === serverId);

      let finalCommand = commandText;
      if (server) {
        finalCommand = finalCommand
          .replaceAll("{{SERVER_IPV4}}", server.ip)
          .replaceAll("{{SERVER_IPV6}}", server.ipv6 || "2400:cb00:2048:1::1")
          .replaceAll("{{SERVER_NAME}}", server.name)
          .replaceAll("{{SERVER_ID}}", server.id)
          .replaceAll("{{SERVER_REGION}}", server.region || "default")
          .replaceAll("{{SERVER_GROUP}}", server.group || "default")
          .replaceAll("{{SERVER_PORT}}", "22")
          .replaceAll("{{TRAFFIC_USED}}", "3.42 TB")
          .replaceAll("{{TRAFFIC_TOTAL}}", "10.00 TB")
          .replaceAll("{{TRAFFIC_USAGE_PERCENT}}", "34.2%")
          .replaceAll("{{TIMESTAMP}}", Math.floor(Date.now() / 1000).toString())
          .replaceAll("{{TIMESTAMP_MS}}", Date.now().toString())
          .replaceAll("{{DATE}}", dateStr)
          .replaceAll("{{TIME}}", timeStr)
          .replaceAll("{{DATETIME}}", datetimeStr)
          .replaceAll("{{EXEC_USER}}", "admin")
          .replaceAll("{{TEMP_DIR}}", "/tmp/smalux_job")
          .replaceAll("{{LOG_FILE}}", `/tmp/smalux_${Date.now()}.log`)
          .replaceAll("{{AGENT_VERSION}}", "v2.4.0")
          .replaceAll("{{RANDOM_ID}}", Math.random().toString(36).substring(2, 10));
      }

      dispatchTask.mutate({
        serverId,
        command: finalCommand,
        batchId,
        risk: "low",
        scope: "node:exec"
      });
    }

    pushToHistory(commandText);

    setActiveBatchResult({
      batchId,
      command: commandText,
      dispatchedAt: Date.now(),
      serverIds: validServerIds,
      activeServerId: validServerIds[0]
    });

    toast.success(`指令已下发至 ${validServerIds.length} 台主机，实时回显已生成！`);
    refetchTasks();
    setTimeout(() => refetchTasks(), 250);
  };

  const handleSaveCron = () => {
    if (!cronForm.name.trim() || !cronForm.command.trim() || !cronForm.serverId) {
      toast.error("请完整填写任务名称、目标主机及执行脚本指令");
      return;
    }

    if (editingCronId) {
      updateCron.mutate({
        id: editingCronId,
        name: cronForm.name,
        serverId: cronForm.serverId,
        expression: cronForm.expression,
        command: cronForm.command
      });
      toast.success(`计划任务 [${cronForm.name}] 已成功修改`);
    } else {
      createCron.mutate({
        name: cronForm.name,
        serverId: cronForm.serverId,
        expression: cronForm.expression,
        command: cronForm.command
      });
      toast.success(`计划任务 [${cronForm.name}] 创建成功`);
    }

    setCronDialogOpen(false);
    setEditingCronId(null);
    setCronForm({ name: "", expression: "0 2 * * *", command: "", serverId: "" });
  };

  const handleOpenEditCron = (job: Cron) => {
    setEditingCronId(job.id);
    setCronForm({
      name: job.name,
      expression: job.expression,
      command: job.command,
      serverId: job.serverId
    });
    setCronDialogOpen(true);
  };

  const handleRunCronNow = (job: Cron) => {
    const target = servers.find((s) => s.id === job.serverId);
    if (target && target.status === "offline") {
      toast.error(`目标主机 [${job.serverName}] 当前处于离线状态，无法立即执行调度任务`);
      return;
    }

    const batchId = `b_cron_${Date.now()}`;

    dispatchTask.mutate({
      serverId: job.serverId,
      command: job.command,
      batchId,
      risk: "low",
      scope: "node:exec"
    });

    setActiveBatchResult({
      batchId,
      command: job.command,
      dispatchedAt: Date.now(),
      serverIds: [job.serverId],
      activeServerId: job.serverId
    });

    toast.success(`已向主机 [${job.serverName}] 触发任务: ${job.name}`);
    refetchTasks();
    refetchCronLogs();
    setTimeout(() => {
      refetchTasks();
      refetchCronLogs();
    }, 250);
  };

  const filteredCrons = useMemo(() => {
    return crons.filter((c) => {
      const matchSearch =
        !cronSearchQuery ||
        c.name.toLowerCase().includes(cronSearchQuery.toLowerCase()) ||
        c.command.toLowerCase().includes(cronSearchQuery.toLowerCase()) ||
        c.serverName.toLowerCase().includes(cronSearchQuery.toLowerCase());
      const matchStatus =
        cronFilterStatus === "all" ||
        (cronFilterStatus === "enabled" ? c.enabled : !c.enabled);
      return matchSearch && matchStatus;
    });
  }, [crons, cronSearchQuery, cronFilterStatus]);

  const activeConsoleServerTasks = useMemo(() => {
    if (!activeBatchResult) return [];
    return activeBatchResult.serverIds.map((sid) => {
      const server = servers.find((s) => s.id === sid);
      const task = tasks.find((t) => t.serverId === sid && (t.batchId === activeBatchResult.batchId || t.command.startsWith(activeBatchResult.command.slice(0, 15))));
      return {
        serverId: sid,
        serverName: server?.name || sid,
        serverIp: server?.ip || "—",
        task: task || null
      };
    });
  }, [activeBatchResult, servers, tasks]);

  const activeConsoleSelectedTask = useMemo(() => {
    if (!activeBatchResult) return null;
    const found = activeConsoleServerTasks.find((item) => item.serverId === activeBatchResult.activeServerId);
    return found?.task || null;
  }, [activeBatchResult, activeConsoleServerTasks]);

  return (
    <div className="flex flex-col min-h-full relative">
      <PageHeader
        title="自动化运维"
        subtitle="远程批量命令执行、实时终端回显、计划任务调度与脚本库"
        action={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-mono px-2.5 py-1">
              <Server className="size-3.5 mr-1 text-emerald-400" />
              {onlineServers.length} / {servers.length} 台在线可调度
            </Badge>
            <Button size="sm" onClick={() => setActiveTab("dispatch")} className="cursor-pointer">
              <Play className="size-3.5 mr-1" /> 快速下发
            </Button>
          </div>
        }
      />

      <div className="flex-1 space-y-5 p-6 pb-16">
        {/* 顶部主导航 Tab 栏（三大核心板块：即时下发、计划任务、历史流水） */}
        <div className="flex items-center justify-between border-b border-border/80 pb-3 flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {([
              { key: "dispatch" as const, icon: Terminal, label: "远程命令下发" },
              { key: "cron" as const, icon: Clock, label: `计划任务 (${crons.length})` },
              { key: "logs" as const, icon: ScrollText, label: `执行流水记录 (${batchGroups.length + cronLogs.length})` }
            ] as const).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <tab.icon className="size-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <label className="flex items-center gap-1.5 text-muted-foreground cursor-pointer select-none">
              <Switch checked={autoRefreshLogs} onCheckedChange={setAutoRefreshLogs} />
              <span>自动轮询 (4s)</span>
            </label>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2.5 cursor-pointer"
              onClick={() => {
                refetchTasks();
                refetchCrons();
                refetchCronLogs();
                toast.info("已刷新全部数据");
              }}
            >
              <RefreshCw className="size-3 mr-1" /> 刷新
            </Button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════ */}
        {/* Tab 1: 远程命令执行（开阔高密工作台 + 常驻终端控制台）  */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === "dispatch" && (
          <div className="space-y-5">
            {/* 主工作台编辑器卡片 */}
            <Card className="flex flex-col justify-between shadow-xs">
              <CardHeader className="pb-3 border-b border-border/60">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Terminal className="size-4 text-primary" />
                    即时下发运维指令
                  </CardTitle>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-mono">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    <span>执行超时 60s</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                {/* 紧凑动态变量工具栏 */}
                <div className="flex items-center justify-between gap-3 flex-wrap text-xs">
                  {/* 目标主机选择 */}
                  <button
                    type="button"
                    onClick={() => setServerSelectorOpen(true)}
                    className="flex items-center gap-2 rounded-lg border border-border/80 bg-muted/30 px-3 py-1.5 hover:bg-muted/60 hover:border-primary/40 transition-all cursor-pointer text-left shrink-0"
                  >
                    <Server className="size-3.5 text-primary" />
                    <span className="font-semibold text-foreground max-w-[240px] truncate">
                      {selectedLabel}
                    </span>
                    <ChevronRight className="size-3.5 text-muted-foreground" />
                  </button>

                  {/* 变量注入工具组 */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-muted-foreground mr-0.5">注入变量:</span>

                    <button
                      type="button"
                      onClick={() => insertVariable("{{SERVER_IPV4}}")}
                      title="目标主机 IPv4 地址"
                      className="rounded-md border border-primary/30 bg-primary/5 px-2 py-1 text-[10px] font-mono text-primary hover:bg-primary/15 cursor-pointer font-medium"
                    >
                      + IPv4
                    </button>
                    <button
                      type="button"
                      onClick={() => insertVariable("{{SERVER_IPV6}}")}
                      title="目标主机 IPv6 地址"
                      className="rounded-md border border-primary/30 bg-primary/5 px-2 py-1 text-[10px] font-mono text-primary hover:bg-primary/15 cursor-pointer font-medium"
                    >
                      + IPv6
                    </button>
                    <button
                      type="button"
                      onClick={() => insertVariable("{{SERVER_NAME}}")}
                      title="目标主机 Hostname"
                      className="rounded-md border border-primary/30 bg-primary/5 px-2 py-1 text-[10px] font-mono text-primary hover:bg-primary/15 cursor-pointer font-medium"
                    >
                      + 主机名
                    </button>
                    <button
                      type="button"
                      onClick={() => insertVariable("{{DATETIME}}")}
                      title="紧凑时间戳 YYYYMMDD_HHmmss"
                      className="rounded-md border border-primary/30 bg-primary/5 px-2 py-1 text-[10px] font-mono text-primary hover:bg-primary/15 cursor-pointer font-medium"
                    >
                      + 日期时间
                    </button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setVariableModalOpen(true)}
                      className="h-6.5 text-[11px] px-2.5 gap-1.5 cursor-pointer bg-muted/40 hover:bg-muted font-medium border-border/80"
                    >
                      <Variable className="size-3 text-primary" />
                      更多变量 ({dynamicVariables.length}) ▾
                    </Button>
                  </div>
                </div>

                {/* 饱满专业的深色 IDE 终端编辑器 */}
                <div className="relative rounded-lg border border-border/80 bg-zinc-950 p-3.5 font-mono text-xs text-zinc-100 shadow-inner flex-1 flex flex-col min-h-[240px]">
                  <div className="flex items-center justify-between text-emerald-400 mb-2 select-none font-bold text-[11px] border-b border-zinc-900 pb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-emerald-500" />
                      <span>#!/usr/bin/env bash</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCommandText("");
                        toast.info("已清空编辑器");
                      }}
                      className="text-zinc-500 hover:text-zinc-300 cursor-pointer text-[10px] font-normal"
                    >
                      清空
                    </button>
                  </div>
                  <textarea
                    rows={8}
                    value={commandText}
                    onChange={(e) => setCommandText(e.target.value)}
                    placeholder="在此输入 Shell 脚本指令，支持多行脚本与复杂管道命令...（可插入动态变量或点击右下角气泡展开脚本库）"
                    className="w-full flex-1 resize-none bg-transparent text-xs text-zinc-100 placeholder:text-zinc-600 outline-none leading-relaxed font-mono"
                  />
                </div>

                {/* 历史命令快速填入 */}
                {commandHistory.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 text-[10px] text-muted-foreground">
                    <span className="shrink-0 flex items-center gap-1 font-medium">
                      <History className="size-3" /> 常用历史:
                    </span>
                    {commandHistory.slice(0, 4).map((cmd, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setCommandText(cmd);
                          toast.info("已填入历史命令");
                        }}
                        className="max-w-[220px] truncate rounded bg-muted/40 px-2 py-0.5 font-mono text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer border border-border/40 shrink-0"
                      >
                        {cmd}
                      </button>
                    ))}
                  </div>
                )}

                {/* 底部下发主控条 */}
                <div className="flex items-center justify-between pt-2.5 border-t border-border/60">
                  <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    <span>就绪目标: <strong className="text-foreground">{selectedServerIds.length}</strong> 台在线主机</span>
                  </div>
                  <Button
                    onClick={handleDispatch}
                    disabled={dispatchTask.isPending || selectedServerIds.length === 0}
                    className="gap-1.5 cursor-pointer h-8.5 text-xs font-semibold px-5"
                  >
                    {dispatchTask.isPending ? (
                      <><RefreshCw className="size-3.5 animate-spin" /> 下发调度中...</>
                    ) : (
                      <><Play className="size-3.5" /> 立即下发执行 ({selectedServerIds.length} 台)</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* ══════════════════════════════════════════════════════ */}
            {/* 常驻实时执行控制台（未执行前展示待命终端，执行后展示结果） */}
            {/* ══════════════════════════════════════════════════════ */}
            <Card className="border-border/80 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/20 border-b border-border/60 pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                      <Terminal className="size-4 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-mono font-bold">
                          实时执行回显控制台
                        </CardTitle>
                        {activeBatchResult ? (
                          <Badge variant="success" dot className="text-[10px]">
                            已生成回显
                          </Badge>
                        ) : (
                          <Badge variant="neutral" dot className="text-[10px] text-emerald-400 border-emerald-500/20 bg-emerald-500/10">
                            集群就绪 · 待命中
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs font-mono mt-0.5">
                        {activeBatchResult ? (
                          <>指令: <span className="text-foreground font-semibold">{activeBatchResult.command}</span> · 调度时间: {new Date(activeBatchResult.dispatchedAt).toLocaleTimeString()}</>
                        ) : (
                          <>在上方输入指令并点击 [立即下发执行]，实时标准输出 (Stdout) 将在此处流式捕获</>
                        )}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeBatchResult ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs cursor-pointer"
                          onClick={() => {
                            setSelectedBatchId(activeBatchResult.batchId);
                            setActiveTab("logs");
                            setLogSubTab("adhoc");
                          }}
                        >
                          <ExternalLink className="size-3 mr-1" /> 查看历史即时记录
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                          onClick={() => setActiveBatchResult(null)}
                        >
                          重置控制台
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                        onClick={() => {
                          setActiveTab("logs");
                          setLogSubTab("adhoc");
                        }}
                      >
                        <History className="size-3 mr-1" /> 历史记录 ({batchGroups.length}次)
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border/60 min-h-[280px]">
                  {/* 左侧：节点状态列表 */}
                  <div className="p-3 space-y-1.5 bg-muted/10 md:col-span-1 max-h-[340px] overflow-y-auto">
                    <div className="text-[11px] font-semibold text-muted-foreground mb-2 flex items-center justify-between">
                      <span>
                        {activeBatchResult
                          ? `执行机器 (${activeConsoleServerTasks.length}台)`
                          : `就绪目标 (${selectedServerIds.length}台)`}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {activeBatchResult ? "捕获完成" : "等待下发"}
                      </span>
                    </div>

                    {activeBatchResult ? (
                      activeConsoleServerTasks.map((item) => {
                        const isCurrentActive = activeBatchResult.activeServerId === item.serverId;
                        const task = item.task;

                        return (
                          <div
                            key={item.serverId}
                            onClick={() =>
                              setActiveBatchResult((prev) =>
                                prev ? { ...prev, activeServerId: item.serverId } : null
                              )
                            }
                            className={`p-2 rounded-lg border transition-all cursor-pointer text-xs ${
                              isCurrentActive
                                ? "bg-primary/10 border-primary shadow-xs"
                                : "bg-card/60 border-border/40 hover:bg-muted/40"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-semibold truncate">{item.serverName}</span>
                              {task ? statusBadge(task.status) : <Badge variant="neutral" dot>排队中</Badge>}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-1 flex items-center justify-between font-mono">
                              <span>{item.serverIp}</span>
                              <span>{task?.durationMs ? `${task.durationMs}ms` : "—"}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : selectedServerIds.length > 0 ? (
                      selectedServerIds.map((id) => {
                        const server = servers.find((s) => s.id === id);
                        return (
                          <div
                            key={id}
                            className="p-2 rounded-lg border border-border/40 bg-card/60 text-xs font-mono space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-foreground truncate">{server?.name || id}</span>
                              <span className="size-1.5 rounded-full bg-emerald-400" />
                            </div>
                            <div className="text-[10px] text-muted-foreground flex items-center justify-between">
                              <span>{server?.ip || "—"}</span>
                              <span className="text-zinc-500">待命</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-1.5 px-2">
                        <Server className="size-5 text-zinc-600 mb-1" />
                        <span className="font-medium text-foreground">尚未选择目标主机</span>
                        <span className="text-[11px]">请在上方点击选择待下发的目标节点</span>
                      </div>
                    )}
                  </div>

                  {/* 右侧：深色终端执行回显与待命屏 */}
                  <div className="p-4 md:col-span-3 bg-zinc-950 text-zinc-200 font-mono text-xs flex flex-col justify-between overflow-hidden">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-[11px] text-zinc-400">
                      <div className="flex items-center gap-2">
                        <span className={`size-2 rounded-full ${activeBatchResult ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"}`} />
                        <span>
                          {activeBatchResult ? (
                            <>终端回显: <strong className="text-zinc-100">{servers.find((s) => s.id === activeBatchResult.activeServerId)?.name || activeBatchResult.activeServerId}</strong></>
                          ) : (
                            <>控制台状态: <span className="text-emerald-400 font-semibold">STANDBY (待命就绪)</span></>
                          )}
                        </span>
                        {activeConsoleSelectedTask && (
                          <span className="text-zinc-500">
                            (耗时: {durationStr(activeConsoleSelectedTask.durationMs)} · 退出码: {activeConsoleSelectedTask.exitCode ?? 0})
                          </span>
                        )}
                      </div>

                      {activeBatchResult && (
                        <button
                          type="button"
                          onClick={() => {
                            const output = activeConsoleSelectedTask?.output || activeBatchResult.command;
                            navigator.clipboard.writeText(output);
                            toast.success("输出回显已复制到剪贴板");
                          }}
                          className="hover:text-zinc-100 flex items-center gap-1 cursor-pointer text-[11px]"
                        >
                          <Copy className="size-3" /> 复制回显
                        </button>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-56 whitespace-pre-wrap leading-relaxed select-text pr-2 text-zinc-300">
                      {activeBatchResult ? (
                        activeConsoleSelectedTask?.output ? (
                          activeConsoleSelectedTask.output
                        ) : (
                          <div className="py-8 text-center text-zinc-500 flex flex-col items-center gap-2">
                            <RefreshCw className="size-4 animate-spin text-primary" />
                            <span>正在等待远程 Agent 守护进程返回执行回显数据...</span>
                          </div>
                        )
                      ) : (
                        <div className="py-6 font-mono text-[11px] leading-relaxed text-zinc-400 space-y-1 select-none">
                          <div className="text-emerald-400 font-bold">
                            [smalux@fleet ~]# Smalux Automation Dispatch Console v2.4.0
                          </div>
                          <div className="text-zinc-500">
                            [system] Cluster RPC communication channel: <span className="text-emerald-400">CONNECTED</span>
                          </div>
                          <div className="text-zinc-500">
                            [system] Ready to accept remote POSIX Shell commands with dynamic variable injection.
                          </div>
                          <div className="text-zinc-600 pt-2">
                            &gt; Select target nodes above and click <span className="text-zinc-300 font-semibold">[立即下发执行]</span> to stream output here...
                          </div>
                          <div className="text-emerald-500 animate-pulse pt-1">_</div>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 mt-2 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500">
                      <span>终端模式: POSIX Shell (UTF-8)</span>
                      <span>Smalux Fleet Agent Engine v2.4</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* Tab 2: 分布式计划任务 (Cron Jobs 配置与管理)           */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === "cron" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="size-4 text-primary" />
                  分布式计划任务
                </CardTitle>
                <CardDescription>
                  基于 Agent 守护进程的周期性计划任务，支持标准 Cron 表达式与节点独立调度
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <input
                    value={cronSearchQuery}
                    onChange={(e) => setCronSearchQuery(e.target.value)}
                    placeholder="搜索任务名称/指令..."
                    className="h-8 w-44 rounded-lg border border-border/80 bg-muted/40 pl-8 pr-3 text-xs outline-none focus:border-primary text-foreground"
                  />
                </div>
                <select
                  value={cronFilterStatus}
                  onChange={(e) => setCronFilterStatus(e.target.value as any)}
                  className="h-8 rounded-lg border border-border/80 bg-muted/40 px-2 text-xs outline-none focus:border-primary text-foreground cursor-pointer"
                >
                  <option value="all">全部状态</option>
                  <option value="enabled">仅已启用</option>
                  <option value="disabled">仅已暂停</option>
                </select>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingCronId(null);
                    setCronForm({ name: "", expression: "0 2 * * *", command: "", serverId: "" });
                    setCronDialogOpen(true);
                  }}
                  className="cursor-pointer"
                >
                  <Plus className="size-3.5 mr-1" /> 新建计划任务
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {isLoadingCrons ? (
                <div className="text-center text-xs text-muted-foreground py-12 flex flex-col items-center gap-2">
                  <RefreshCw className="size-4 animate-spin text-primary" />
                  <span>正在加载计划任务列表...</span>
                </div>
              ) : filteredCrons.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-12">
                  {cronSearchQuery ? "未匹配到相关计划任务" : "暂无配置的计划任务，点击右上角新建"}
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {filteredCrons.map((job) => (
                    <div
                      key={job.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-3 hover:bg-muted/10 px-2 rounded-lg transition-colors"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-foreground">{job.name}</span>
                          <span className="rounded bg-muted/80 px-2 py-0.5 text-[10px] font-mono text-primary font-bold border border-border/60">
                            {job.expression}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            ({parseCronDescription(job.expression)})
                          </span>
                          {job.lastStatus && statusBadge(job.lastStatus)}
                        </div>

                        <div className="text-[11px] font-mono text-muted-foreground truncate">
                          指令: <span className="text-zinc-300 font-semibold">{job.command}</span> · 目标主机: <span className="text-zinc-300">{job.serverName}</span>
                        </div>

                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                          <span>上次执行: {relativeTime(job.lastRunAt)}</span>
                          {job.nextRunAt && (
                            <span>下次预计: {new Date(job.nextRunAt).toLocaleTimeString()}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
                          <span>{job.enabled ? "运行中" : "已暂停"}</span>
                          <Switch
                            checked={job.enabled}
                            onCheckedChange={(enabled) => {
                              toggleCron.mutate({ id: job.id, enabled });
                              toast.info(`已${enabled ? "启用" : "暂停"}计划任务 [${job.name}]`);
                            }}
                          />
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2.5 cursor-pointer"
                          onClick={() => handleRunCronNow(job)}
                        >
                          <Play className="size-3 mr-1 text-emerald-400" /> 立即运行
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-primary cursor-pointer"
                          onClick={() => handleOpenEditCron(job)}
                          title="编辑任务"
                        >
                          <Edit2 className="size-3.5" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-500 cursor-pointer"
                          onClick={() => {
                            deleteCron.mutate(job.id);
                            toast.success(`已删除计划任务: ${job.name}`);
                          }}
                          title="删除任务"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* Tab 3: 执行流水记录（内含即时下发与计划调度两套二级Tab）*/}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === "logs" && (
          <div className="space-y-4">
            {/* 二级 Pill Tabs 切换器 */}
            <div className="flex items-center justify-between flex-wrap gap-3 pb-0.5">
              <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/60">
                <button
                  type="button"
                  onClick={() => setLogSubTab("adhoc")}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    logSubTab === "adhoc"
                      ? "bg-background text-foreground shadow-2xs border border-border/60 font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  <ScrollText className="size-3.5 text-primary" />
                  <span>即时下发记录 ({batchGroups.length} 次)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLogSubTab("cron")}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    logSubTab === "cron"
                      ? "bg-background text-foreground shadow-2xs border border-border/60 font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  <Timer className="size-3.5 text-primary" />
                  <span>计划调度记录 ({cronLogs.length} 条)</span>
                </button>
              </div>

              <div className="text-xs text-muted-foreground font-mono">
                {logSubTab === "adhoc" ? "按每次下发批次聚合与机器手风琴归类" : "按定时/手动触发源流式审计"}
              </div>
            </div>

            {logSubTab === "adhoc" && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4 pb-3">
                  <div>
                    <CardTitle className="text-base">即时下发执行记录 ({filteredBatchGroups.length} 次)</CardTitle>
                    <CardDescription>每次下发算一次独立分组，左侧手风琴折叠展开各执行机器，右侧查看独立终端回显</CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                      <input
                        value={logSearchQuery}
                        onChange={(e) => setLogSearchQuery(e.target.value)}
                        placeholder="搜索命令 / 主机名 / 批次..."
                        className="h-8 w-48 rounded-lg border border-border/80 bg-muted/40 pl-8 pr-3 text-xs outline-none focus:border-primary text-foreground"
                      />
                    </div>

                    <select
                      value={logStatusFilter}
                      onChange={(e) => setLogStatusFilter(e.target.value)}
                      className="h-8 rounded-lg border border-border/80 bg-muted/40 px-2 text-xs outline-none focus:border-primary text-foreground cursor-pointer"
                    >
                      <option value="all">全部执行状态</option>
                      <option value="success">全部成功</option>
                      <option value="running">执行中</option>
                      <option value="failed">存在异常/失败</option>
                    </select>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  {isLoadingTasks ? (
                    <div className="text-center text-xs text-muted-foreground py-16 flex flex-col items-center gap-2">
                      <RefreshCw className="size-4 animate-spin text-primary" />
                      <span>正在加载执行记录...</span>
                    </div>
                  ) : filteredBatchGroups.length === 0 ? (
                    <div className="text-center text-xs text-muted-foreground py-16">
                      {logSearchQuery ? "未匹配到相关执行批次" : "暂无历史即时执行记录"}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border/60 min-h-[500px]">
                      {/* 左侧：执行批次列表 + 手风琴展开层级机器选择 (5列) */}
                      <div className="lg:col-span-5 divide-y divide-border/60 max-h-[600px] overflow-y-auto p-2.5 space-y-2">
                        {filteredBatchGroups.map((group, index) => {
                          const isSelected = currentBatch?.id === group.id;
                          const isExpanded = expandedBatchId !== null ? expandedBatchId === group.id : (index === 0);

                          return (
                            <div
                              key={group.id}
                              className={`rounded-xl border transition-all text-xs ${
                                isSelected
                                  ? "bg-primary/5 border-primary/60 shadow-xs"
                                  : "bg-card/60 border-border/40 hover:bg-muted/40"
                              }`}
                            >
                              {/* 批次头部卡片触发区（手风琴头部） */}
                              <div
                                onClick={() => {
                                  if (isExpanded) {
                                    setExpandedBatchId("__closed__");
                                  } else {
                                    setExpandedBatchId(group.id);
                                    setSelectedBatchId(group.id);
                                    const failedNode = group.tasks.find((t) => t.status === "failed" || t.status === "timeout");
                                    setSelectedNodeIdInBatch(failedNode ? failedNode.serverId : (group.tasks[0]?.serverId || null));
                                    setNodeStatusFilter("all");
                                    setNodeSearchQuery("");
                                  }
                                }}
                                className="p-3 cursor-pointer select-none space-y-1.5 hover:bg-muted/20 transition-colors rounded-xl"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  {batchStatusBadge(group)}
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] text-muted-foreground font-mono">
                                      {relativeTime(group.startedAt)}
                                    </span>
                                    <ChevronRight
                                      className={`size-3.5 transition-transform duration-200 ${
                                        isExpanded ? "rotate-90 text-primary" : "text-muted-foreground"
                                      }`}
                                    />
                                  </div>
                                </div>

                                <div className="font-mono text-xs font-semibold text-foreground truncate">
                                  {group.command}
                                </div>

                                {/* 紧凑统计摘要 */}
                                <div className="pt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                                  <div className="flex items-center gap-1.5 font-mono">
                                    {group.successNodes > 0 && (
                                      <span className="text-emerald-400">
                                        {group.successNodes} 成功
                                      </span>
                                    )}
                                    {group.failedNodes > 0 && (
                                      <span className="text-rose-400">
                                        · {group.failedNodes} 失败
                                      </span>
                                    )}
                                    {group.runningNodes > 0 && (
                                      <span className="text-sky-400">
                                        · {group.runningNodes} 运行中
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-zinc-500 font-sans">
                                    共 {group.totalNodes} 台机器 {isExpanded ? "(已展开)" : "(点击展开)"}
                                  </span>
                                </div>
                              </div>

                              {/* 手风琴展开内容：机器状态筛选与机器列表 */}
                              {isExpanded && (
                                <div className="p-2.5 pt-0 border-t border-border/40 space-y-2 bg-muted/15 rounded-b-xl">
                                  {/* 状态快速分类切换 (全部 / 失败 / 成功) */}
                                  <div className="flex items-center justify-between pt-2 flex-wrap gap-1.5">
                                    <div className="flex items-center gap-1">
                                      {[
                                        { key: "all" as const, label: "全部", count: group.totalNodes },
                                        { key: "failed" as const, label: "异常", count: group.failedNodes, isDanger: true },
                                        { key: "success" as const, label: "成功", count: group.successNodes },
                                        { key: "running" as const, label: "运行中", count: group.runningNodes }
                                      ].map((tab) => {
                                        if (tab.count === 0 && tab.key !== "all") return null;
                                        const isActive = nodeStatusFilter === tab.key;

                                        return (
                                          <button
                                            key={tab.key}
                                            type="button"
                                            onClick={() => setNodeStatusFilter(tab.key)}
                                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
                                              isActive
                                                ? tab.isDanger && tab.count > 0
                                                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold"
                                                  : "bg-primary text-primary-foreground font-bold shadow-2xs"
                                                : "text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted"
                                            }`}
                                          >
                                            {tab.label} ({tab.count})
                                          </button>
                                        );
                                      })}
                                    </div>

                                    {/* 机器数量多时提供微型过滤输入框 */}
                                    {group.totalNodes > 3 && (
                                      <div className="relative">
                                        <Search className="absolute left-1.5 top-1/2 -translate-y-1/2 size-2.5 text-muted-foreground" />
                                        <input
                                          type="text"
                                          value={nodeSearchQuery}
                                          onChange={(e) => setNodeSearchQuery(e.target.value)}
                                          placeholder="过滤主机..."
                                          className="h-5.5 w-24 rounded bg-background border border-border/80 pl-5 pr-1.5 text-[10px] text-foreground outline-none focus:border-primary"
                                        />
                                      </div>
                                    )}
                                  </div>

                                  {/* 执行机器竖向列表 */}
                                  <div className="space-y-1 max-h-[220px] overflow-y-auto pr-0.5">
                                    {filteredBatchTasks.length === 0 ? (
                                      <div className="py-3 text-center text-[10px] text-muted-foreground italic">
                                        该状态下无匹配机器
                                      </div>
                                    ) : (
                                      filteredBatchTasks.map((t) => {
                                        const isNodeActive = currentBatchActiveTask?.serverId === t.serverId;

                                        return (
                                          <div
                                            key={t.id}
                                            onClick={() => setSelectedNodeIdInBatch(t.serverId)}
                                            className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer text-[11px] font-mono ${
                                              isNodeActive
                                                ? "bg-primary/15 border-primary text-foreground shadow-2xs font-semibold"
                                                : "bg-card/70 border-border/40 hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                                            }`}
                                          >
                                            <div className="flex items-center gap-2 min-w-0">
                                              <span
                                                className={`size-1.5 rounded-full shrink-0 ${
                                                  t.status === "success"
                                                    ? "bg-emerald-400"
                                                    : t.status === "running"
                                                      ? "bg-sky-400 animate-pulse"
                                                      : "bg-rose-400"
                                                }`}
                                              />
                                              <span className="truncate">{t.serverName}</span>
                                            </div>

                                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground shrink-0">
                                              <span>{t.durationMs ? `${t.durationMs}ms` : "—"}</span>
                                              {isNodeActive && (
                                                <ChevronRight className="size-3 text-primary" />
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* 右侧：纯粹沉浸式深色终端输出结果 (7列) */}
                      <div className="lg:col-span-7 p-4 bg-zinc-950 text-zinc-200 font-mono text-xs flex flex-col justify-between max-h-[600px] overflow-hidden">
                        {currentBatch && currentBatchActiveTask ? (
                          <>
                            {/* 顶部执行状态栏 */}
                            <div className="pb-3 border-b border-zinc-800 flex items-center justify-between flex-wrap gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Terminal className="size-4 text-emerald-400" />
                                  <span className="font-bold text-zinc-100 text-sm">{currentBatchActiveTask.serverName}</span>
                                  <span className="text-[11px] text-zinc-400 font-normal">({currentBatchActiveTask.serverId})</span>
                                  {statusBadge(currentBatchActiveTask.status)}
                                </div>
                                <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-3">
                                  <span>指令: <strong className="text-zinc-200">{currentBatch.command}</strong></span>
                                  <span>·</span>
                                  <span>耗时: {durationStr(currentBatchActiveTask.durationMs)}</span>
                                  <span>·</span>
                                  <span>退出码: {currentBatchActiveTask.exitCode ?? 0}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800 cursor-pointer"
                                  onClick={() => {
                                    setCommandText(currentBatch.command);
                                    setSelectedServerIds([currentBatchActiveTask.serverId]);
                                    setActiveTab("dispatch");
                                    toast.info(`已填入指令并选中目标主机 [${currentBatchActiveTask.serverName}]`);
                                  }}
                                >
                                  再次下发该节点
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800 cursor-pointer"
                                  onClick={() => {
                                    if (currentBatchActiveTask.output) {
                                      navigator.clipboard.writeText(currentBatchActiveTask.output);
                                      toast.success(`已复制 [${currentBatchActiveTask.serverName}] 的输出回显`);
                                    }
                                  }}
                                >
                                  <Copy className="size-3 mr-1" /> 复制回显
                                </Button>
                              </div>
                            </div>

                            {/* 满屏标准终端命令运行输出 (Stdout Terminal) */}
                            <div className="flex-1 my-3 p-4 rounded-lg bg-black/80 border border-zinc-800 overflow-y-auto leading-relaxed whitespace-pre-wrap select-text text-zinc-300 shadow-inner font-mono text-xs max-h-[440px]">
                              {currentBatchActiveTask.output ? (
                                currentBatchActiveTask.output
                              ) : (
                                <span className="text-zinc-500 italic">该机器无输出回显内容</span>
                              )}
                            </div>

                            {/* 底部微型信息栏 */}
                            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
                              <span>调度发起: {new Date(currentBatchActiveTask.startedAt || currentBatch.startedAt).toLocaleString()}</span>
                              <span>模式: POSIX Shell (UTF-8) · Smalux Fleet Agent</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-32 text-zinc-500 flex flex-col items-center gap-2">
                            <Terminal className="size-8 text-zinc-700" />
                            <span>请在左侧选择执行批次与目标机器以查看运行结果</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {logSubTab === "cron" && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4 pb-3">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Timer className="size-4 text-primary" />
                      计划任务调度流水记录 ({cronJobGroups.length} 个任务 · {cronLogs.length} 条记录)
                    </CardTitle>
                    <CardDescription>
                      三栏联动视图：<strong>任务名称 ➔ 调度批次(第几次下发) ➔ 机器执行记录与终端</strong>
                    </CardDescription>
                  </div>

                  {/* 顶部搜索与触发源过滤 */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                      <input
                        value={cronLogSearchQuery}
                        onChange={(e) => setCronLogSearchQuery(e.target.value)}
                        placeholder="搜索任务名 / 主机 / 命令..."
                        className="h-8 w-48 rounded-lg border border-border/80 bg-muted/40 pl-8 pr-3 text-xs outline-none focus:border-primary text-foreground"
                      />
                    </div>

                    <select
                      value={cronLogTriggerFilter}
                      onChange={(e) => setCronLogTriggerFilter(e.target.value)}
                      className="h-8 rounded-lg border border-border/80 bg-muted/40 px-2 text-xs outline-none focus:border-primary text-foreground cursor-pointer"
                    >
                      <option value="all">全部触发源</option>
                      <option value="cron">⏰ 定时自动触发</option>
                      <option value="manual">⚡ 手动立即执行</option>
                    </select>

                    <select
                      value={cronLogStatusFilter}
                      onChange={(e) => setCronLogStatusFilter(e.target.value)}
                      className="h-8 rounded-lg border border-border/80 bg-muted/40 px-2 text-xs outline-none focus:border-primary text-foreground cursor-pointer"
                    >
                      <option value="all">全部批次状态</option>
                      <option value="success">全部成功</option>
                      <option value="failed">存在异常/失败</option>
                      <option value="running">执行中</option>
                    </select>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  {isLoadingCronLogs ? (
                    <div className="text-center text-xs text-muted-foreground py-16 flex flex-col items-center gap-2">
                      <RefreshCw className="size-4 animate-spin text-primary" />
                      <span>正在加载计划任务执行流水...</span>
                    </div>
                  ) : filteredCronJobGroups.length === 0 ? (
                    <div className="text-center text-xs text-muted-foreground py-16">
                      {cronLogSearchQuery ? "未匹配到相关计划任务调度记录" : "暂无计划任务调度历史记录"}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border/60 min-h-[580px]">
                      {/* ══════════════════════════════════════════════════════ */}
                      {/* 栏 1：计划任务列表 (等宽侧栏 - 3列)                   */}
                      {/* ══════════════════════════════════════════════════════ */}
                      <div className="lg:col-span-3 divide-y divide-border/60 max-h-[640px] overflow-y-auto p-2.5 space-y-2 bg-muted/5">
                        <div className="text-[11px] font-semibold text-muted-foreground px-1 pb-1 flex items-center justify-between font-mono">
                          <span>1. 任务列表 ({filteredCronJobGroups.length})</span>
                          <span>总轮次</span>
                        </div>

                        {filteredCronJobGroups.map((job) => {
                          const isJobSelected = (currentCronJob?.cronId || filteredCronJobGroups[0]?.cronId) === job.cronId;
                          const latestBatch = job.batches[0];

                          return (
                            <div
                              key={job.cronId}
                              onClick={() => {
                                setSelectedCronJobId(job.cronId);
                                if (job.batches.length > 0) {
                                  const firstB = job.batches[0];
                                  setSelectedCronBatchId(firstB.batchId);
                                  setExpandedCronBatchId(firstB.batchId);
                                  setSelectedCronNodeId(firstB.logs[0]?.serverId || null);
                                }
                              }}
                              className={`p-2.5 rounded-xl border transition-all cursor-pointer text-xs space-y-1.5 ${
                                isJobSelected
                                  ? "bg-primary/10 border-primary shadow-xs font-semibold"
                                  : "bg-card/70 border-border/50 hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span
                                    className={`size-2 rounded-full shrink-0 ${
                                      latestBatch?.status === "success"
                                        ? "bg-emerald-400"
                                        : latestBatch?.status === "running"
                                          ? "bg-sky-400 animate-pulse"
                                          : "bg-rose-400"
                                    }`}
                                  />
                                  <span className="font-bold text-foreground truncate text-xs">{job.cronName}</span>
                                </div>
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-muted/60 text-foreground font-bold shrink-0 font-mono border-border/70">
                                  {job.totalRuns} 轮
                                </Badge>
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono font-normal">
                                <span className="text-primary font-semibold truncate pr-1">{job.expression}</span>
                                <span className="shrink-0">{relativeTime(job.latestRunAt)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* ══════════════════════════════════════════════════════ */}
                      {/* 栏 2：当前任务调度明细 (等宽明细 - 3列)              */}
                      {/* ══════════════════════════════════════════════════════ */}
                      <div className="lg:col-span-3 divide-y divide-border/60 max-h-[640px] overflow-y-auto p-2.5 space-y-2">
                        {currentCronJob ? (
                          <>
                            {/* 双维度切换 Tab (批次维度 vs 机器维度) */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground px-0.5">
                                <span className="truncate">2. 「{currentCronJob.cronName}」调度明细</span>
                                <span className="font-mono text-[10px] text-primary shrink-0">{currentCronJob.expression}</span>
                              </div>

                              <div className="grid grid-cols-2 gap-1 p-0.5 bg-muted/60 rounded-lg border border-border/60">
                                <button
                                  type="button"
                                  onClick={() => setCronDetailViewMode("batch")}
                                  className={`py-1 px-1.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                    cronDetailViewMode === "batch"
                                      ? "bg-background text-foreground shadow-xs"
                                      : "text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  <Repeat className="size-3 text-primary" />
                                  <span>按批次 ({currentCronJob.batches.length})</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setCronDetailViewMode("node")}
                                  className={`py-1 px-1.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1 ${
                                    cronDetailViewMode === "node"
                                      ? "bg-background text-foreground shadow-xs"
                                      : "text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  <Server className="size-3 text-primary" />
                                  <span>按机器 ({currentCronJobNodes.length})</span>
                                </button>
                              </div>

                              {/* 专属过滤搜索栏 */}
                              <div className="relative">
                                <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-2.5 text-muted-foreground" />
                                <input
                                  type="text"
                                  value={cronDetailSearch}
                                  onChange={(e) => setCronDetailSearch(e.target.value)}
                                  placeholder={
                                    cronDetailViewMode === "batch"
                                      ? "搜索批次编号 / 状态..."
                                      : "搜索机器名称 / IP / 状态..."
                                  }
                                  className="h-6.5 w-full rounded-md border border-border/80 bg-background/80 pl-6.5 pr-2 text-[11px] text-foreground outline-none focus:border-primary placeholder:text-muted-foreground/70"
                                />
                              </div>
                            </div>

                            {/* ── 视图 1：按调度批次查看 (By Batch) ── */}
                            {cronDetailViewMode === "batch" && (
                              <div className="space-y-1.5 pt-1">
                                {currentCronJob.batches
                                  .filter((b) => {
                                    if (!cronDetailSearch.trim()) return true;
                                    const q = cronDetailSearch.toLowerCase().trim();
                                    const runStr = `#${b.runNumber || ""}`;
                                    return (
                                      runStr.includes(q) ||
                                      b.status.includes(q) ||
                                      (b.triggerType === "cron" ? "定时" : "手动").includes(q) ||
                                      b.logs.some((l) => l.serverName.toLowerCase().includes(q))
                                    );
                                  })
                                  .map((batch, index) => {
                                    const isBatchSelected = (currentCronBatch?.batchId || currentCronJob.batches[0]?.batchId) === batch.batchId;
                                    const isBatchExpanded = expandedCronBatchId !== null
                                      ? expandedCronBatchId === batch.batchId
                                      : (index === 0);

                                    return (
                                      <div
                                        key={batch.batchId}
                                        className={`rounded-xl border transition-all text-xs ${
                                          isBatchSelected
                                            ? "bg-primary/5 border-primary/60 shadow-xs"
                                            : "bg-card/60 border-border/40 hover:bg-muted/40"
                                        }`}
                                      >
                                        {/* 批次头部 */}
                                        <div
                                          onClick={() => {
                                            if (isBatchExpanded) {
                                              setExpandedCronBatchId("__batch_closed__");
                                            } else {
                                              setExpandedCronBatchId(batch.batchId);
                                              setSelectedCronBatchId(batch.batchId);
                                              const failedNode = batch.logs.find((l) => l.status === "failed" || l.status === "timeout");
                                              setSelectedCronNodeId(failedNode ? failedNode.serverId : (batch.logs[0]?.serverId || null));
                                              setCronNodeStatusFilter("all");
                                              setCronNodeSearchQuery("");
                                            }
                                          }}
                                          className="p-2.5 cursor-pointer select-none space-y-1 hover:bg-muted/20 transition-colors rounded-xl"
                                        >
                                          <div className="flex items-center justify-between gap-1">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                              <Badge variant="outline" className="text-[10px] font-mono px-1 py-0 bg-muted text-foreground font-bold border-border/70 shrink-0">
                                                #{batch.runNumber || (currentCronJob.batches.length - index)}
                                              </Badge>
                                              <span className="font-bold text-foreground text-xs truncate">
                                                {batch.triggerType === "cron" ? "⏰ 定时" : "⚡ 手动"}
                                              </span>
                                            </div>

                                            <div className="flex items-center gap-1">
                                              <span className="text-[10px] text-muted-foreground font-mono">
                                                {relativeTime(batch.startedAt)}
                                              </span>
                                              <ChevronRight
                                                className={`size-3 transition-transform duration-200 ${
                                                  isBatchExpanded ? "rotate-90 text-primary" : "text-muted-foreground"
                                                }`}
                                              />
                                            </div>
                                          </div>

                                          <div className="pt-0.5 flex items-center justify-between text-[10px] text-muted-foreground">
                                            <div className="flex items-center gap-1 font-mono">
                                              {batch.status === "success" ? (
                                                <span className="text-emerald-400 font-medium">🟢 成功</span>
                                              ) : batch.status === "partial" ? (
                                                <span className="text-rose-400 font-medium">🟡 部分异常</span>
                                              ) : (
                                                <span className="text-rose-400 font-medium">🔴 失败</span>
                                              )}
                                              <span>({batch.successNodes}/{batch.totalNodes}台)</span>
                                            </div>
                                            <span className="text-zinc-500 font-sans text-[10px]">
                                              {isBatchExpanded ? "折叠" : `${batch.totalNodes}台`}
                                            </span>
                                          </div>
                                        </div>

                                        {/* 展开内容：机器状态与机器列表 */}
                                        {isBatchExpanded && (
                                          <div className="p-2 pt-0 border-t border-border/40 space-y-1.5 bg-muted/15 rounded-b-xl">
                                            <div className="flex items-center justify-between pt-1.5 flex-wrap gap-1">
                                              <div className="flex items-center gap-1">
                                                {[
                                                  { key: "all" as const, label: "全部", count: batch.totalNodes },
                                                  { key: "failed" as const, label: "异常", count: batch.failedNodes, isDanger: true },
                                                  { key: "success" as const, label: "成功", count: batch.successNodes }
                                                ].map((tab) => {
                                                  if (tab.count === 0 && tab.key !== "all") return null;
                                                  const isActive = cronNodeStatusFilter === tab.key;

                                                  return (
                                                    <button
                                                      key={tab.key}
                                                      type="button"
                                                      onClick={() => setCronNodeStatusFilter(tab.key)}
                                                      className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-all cursor-pointer ${
                                                        isActive
                                                          ? tab.isDanger && tab.count > 0
                                                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold"
                                                            : "bg-primary text-primary-foreground font-bold shadow-2xs"
                                                          : "text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted"
                                                      }`}
                                                    >
                                                      {tab.label} ({tab.count})
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>

                                            <div className="space-y-1 max-h-[220px] overflow-y-auto pr-0.5">
                                              {filteredCronBatchLogs.map((log) => {
                                                const isNodeActive = currentCronNodeLog?.serverId === log.serverId;

                                                return (
                                                  <div
                                                    key={log.id}
                                                    onClick={() => {
                                                      setSelectedCronBatchId(batch.batchId);
                                                      setSelectedCronNodeId(log.serverId);
                                                    }}
                                                    className={`flex items-center justify-between p-1.5 rounded-md border transition-all cursor-pointer text-[10px] font-mono ${
                                                      isNodeActive
                                                        ? "bg-primary/15 border-primary text-foreground shadow-2xs font-semibold"
                                                        : "bg-card/70 border-border/40 hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                                                    }`}
                                                  >
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                      <span
                                                        className={`size-1.5 rounded-full shrink-0 ${
                                                          log.status === "success"
                                                            ? "bg-emerald-400"
                                                            : log.status === "running"
                                                              ? "bg-sky-400 animate-pulse"
                                                              : "bg-rose-400"
                                                        }`}
                                                      />
                                                      <span className="truncate">{log.serverName}</span>
                                                    </div>

                                                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground shrink-0">
                                                      <span>{durationStr(log.durationMs)}</span>
                                                      {isNodeActive && (
                                                        <ChevronRight className="size-2.5 text-primary" />
                                                      )}
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                              </div>
                            )}

                            {/* ── 视图 2：按执行机器查看 (By Node) ── */}
                            {cronDetailViewMode === "node" && (
                              <div className="space-y-1.5 pt-1">
                                {currentCronJobNodes
                                  .filter((node) => {
                                    if (!cronDetailSearch.trim()) return true;
                                    const q = cronDetailSearch.toLowerCase().trim();
                                    return (
                                      node.serverName.toLowerCase().includes(q) ||
                                      node.serverId.toLowerCase().includes(q) ||
                                      node.latestStatus.includes(q)
                                    );
                                  })
                                  .map((node) => {
                                    const isNodeSelected = currentCronNodeLog?.serverId === node.serverId;
                                    const isNodeExpanded = expandedCronNodeSummaryId !== null
                                      ? expandedCronNodeSummaryId === node.serverId
                                      : (isNodeSelected || currentCronJobNodes[0]?.serverId === node.serverId);

                                    return (
                                      <div
                                        key={node.serverId}
                                        className={`rounded-xl border transition-all text-xs ${
                                          isNodeSelected
                                            ? "bg-primary/5 border-primary/60 shadow-xs"
                                            : "bg-card/60 border-border/40 hover:bg-muted/40"
                                        }`}
                                      >
                                        {/* 机器卡片头部 */}
                                        <div
                                          onClick={() => {
                                            if (isNodeExpanded) {
                                              setExpandedCronNodeSummaryId("__node_closed__");
                                            } else {
                                              setExpandedCronNodeSummaryId(node.serverId);
                                              setSelectedCronNodeId(node.serverId);
                                              if (node.runs.length > 0) {
                                                setSelectedCronBatchId(node.runs[0].batchId);
                                              }
                                            }
                                          }}
                                          className="p-2.5 cursor-pointer select-none space-y-1 hover:bg-muted/20 transition-colors rounded-xl"
                                        >
                                          <div className="flex items-center justify-between gap-1">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                              <Server className="size-3 text-primary shrink-0" />
                                              <span className="font-bold text-foreground truncate text-xs">{node.serverName}</span>
                                            </div>

                                            <div className="flex items-center gap-1">
                                              <span className="text-[10px] text-muted-foreground font-mono">
                                                {relativeTime(node.latestRunAt)}
                                              </span>
                                              <ChevronRight
                                                className={`size-3 transition-transform duration-200 ${
                                                  isNodeExpanded ? "rotate-90 text-primary" : "text-muted-foreground"
                                                }`}
                                              />
                                            </div>
                                          </div>

                                          <div className="pt-0.5 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                                            <div className="flex items-center gap-1">
                                              {node.successRuns > 0 && (
                                                <span className="text-emerald-400 font-medium">
                                                  🟢 {node.successRuns}成功
                                                </span>
                                              )}
                                              {node.failedRuns > 0 && (
                                                <span className="text-rose-400 font-medium">
                                                  · 🔴 {node.failedRuns}异常
                                                </span>
                                              )}
                                            </div>
                                            <span className="text-zinc-500 font-sans text-[10px]">
                                              共 {node.totalRuns} 轮
                                            </span>
                                          </div>
                                        </div>

                                        {/* 展开内容：该机器的历次运行列表 */}
                                        {isNodeExpanded && (
                                          <div className="p-2 pt-0 border-t border-border/40 space-y-1 bg-muted/15 rounded-b-xl">
                                            <div className="text-[9px] font-semibold text-muted-foreground pt-1 pb-0.5">
                                              历次执行记录:
                                            </div>

                                            <div className="space-y-1 max-h-[220px] overflow-y-auto pr-0.5">
                                              {node.runs.map((r) => {
                                                const isRunActive = currentCronBatch?.batchId === r.batchId && currentCronNodeLog?.serverId === node.serverId;

                                                return (
                                                  <div
                                                    key={r.batchId}
                                                    onClick={() => {
                                                      setSelectedCronBatchId(r.batchId);
                                                      setSelectedCronNodeId(node.serverId);
                                                    }}
                                                    className={`flex items-center justify-between p-1.5 rounded-md border transition-all cursor-pointer text-[10px] font-mono ${
                                                      isRunActive
                                                        ? "bg-primary/15 border-primary text-foreground shadow-2xs font-semibold"
                                                        : "bg-card/70 border-border/40 hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                                                    }`}
                                                  >
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                      <span
                                                        className={`size-1.5 rounded-full shrink-0 ${
                                                          r.status === "success"
                                                            ? "bg-emerald-400"
                                                            : r.status === "running"
                                                              ? "bg-sky-400 animate-pulse"
                                                              : "bg-rose-400"
                                                        }`}
                                                      />
                                                      <span>#{r.runNumber || 1}</span>
                                                      <span className="text-[9px] text-muted-foreground font-sans">
                                                        ({r.triggerType === "cron" ? "定时" : "手动"})
                                                      </span>
                                                    </div>

                                                    <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground shrink-0">
                                                      <span>{durationStr(r.durationMs)}</span>
                                                      {isRunActive && (
                                                        <ChevronRight className="size-2.5 text-primary" />
                                                      )}
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="py-20 text-center text-xs text-muted-foreground">
                            请在左侧选择计划任务
                          </div>
                        )}
                      </div>

                      {/* ══════════════════════════════════════════════════════ */}
                      {/* 栏 3：沉浸式深色终端输出结果 (半屏 6列 - 50% 宽度)     */}
                      {/* ══════════════════════════════════════════════════════ */}
                      <div className="lg:col-span-6 p-4 bg-zinc-950 text-zinc-200 font-mono text-xs flex flex-col justify-between max-h-[640px] overflow-hidden">
                        {currentCronJob && currentCronBatch && currentCronNodeLog ? (
                          <>
                            {/* 顶部执行状态栏与三级面包屑 */}
                            <div className="pb-3 border-b border-zinc-800 flex items-center justify-between flex-wrap gap-2">
                              <div>
                                {/* 三级面包屑导航 */}
                                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono mb-1 flex-wrap">
                                  <span className="text-zinc-200 font-bold">{currentCronJob.cronName}</span>
                                  <span className="text-zinc-600">&gt;</span>
                                  <span className="text-emerald-400 font-semibold">
                                    第 #{currentCronBatch.runNumber || 1} 批次
                                  </span>
                                  <span className="text-zinc-600">&gt;</span>
                                  <span className="text-zinc-100 font-bold">{currentCronNodeLog.serverName}</span>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                  <Timer className="size-4 text-emerald-400" />
                                  <span className="font-bold text-zinc-100 text-sm">{currentCronNodeLog.serverName}</span>
                                  <span className="text-[11px] text-zinc-400 font-normal">({currentCronNodeLog.serverId})</span>
                                  {statusBadge(currentCronNodeLog.status)}
                                </div>
                                <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-3 flex-wrap">
                                  <span>触发: <strong className="text-zinc-200">{currentCronBatch.triggerType === "cron" ? "⏰ 定时自动" : "⚡ 手动立即"}</strong></span>
                                  <span>·</span>
                                  <span>耗时: {durationStr(currentCronNodeLog.durationMs)}</span>
                                  <span>·</span>
                                  <span>退出码: {currentCronNodeLog.exitCode ?? 0}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800 cursor-pointer"
                                  onClick={() => {
                                    const job = crons.find((c) => c.id === currentCronJob.cronId);
                                    if (job) {
                                      handleRunCronNow(job);
                                    } else {
                                      toast.info("已触发该计划任务重新执行");
                                    }
                                  }}
                                >
                                  <Play className="size-3 mr-1 text-emerald-400" /> 再次立即下发
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800 cursor-pointer"
                                  onClick={() => {
                                    if (currentCronNodeLog.output) {
                                      navigator.clipboard.writeText(currentCronNodeLog.output);
                                      toast.success(`已复制 [${currentCronNodeLog.serverName}] 的输出回显`);
                                    }
                                  }}
                                >
                                  <Copy className="size-3 mr-1" /> 复制回显
                                </Button>
                              </div>
                            </div>

                            {/* 满屏标准终端命令运行输出 (Stdout Terminal) */}
                            <div className="flex-1 my-3 p-4 rounded-lg bg-black/80 border border-zinc-800 overflow-y-auto leading-relaxed whitespace-pre-wrap select-text text-zinc-300 shadow-inner font-mono text-xs max-h-[460px]">
                              {currentCronNodeLog.output ? (
                                currentCronNodeLog.output
                              ) : (
                                <span className="text-zinc-500 italic">该机器在此批次下无输出回显内容</span>
                              )}
                            </div>

                            {/* 底部微型信息栏 */}
                            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
                              <span>调度发起: {new Date(currentCronNodeLog.startedAt || currentCronBatch.startedAt).toLocaleString()}</span>
                              <span>模式: POSIX Shell · Smalux Distributed Cron</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-32 text-zinc-500 flex flex-col items-center gap-2">
                            <Timer className="size-8 text-zinc-700" />
                            <span>请在左侧选择计划任务批次与目标机器以查看运行结果</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
        </div>
      )}

      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* 全局可复用悬浮气泡组件：运维脚本库                      */}
      {/* ══════════════════════════════════════════════════════ */}
      <ScriptLibraryWidget
        onSelectScript={(cmd, title) => {
          setCommandText(cmd);
          toast.info(`已填入脚本: ${title}`);
        }}
      />

      {/* ══════════════════════════════════════════════════════ */}
      {/* 弹窗 1: 动态变量选择器模态框 (全面分类 + 搜索 + 一键注入) */}
      {/* ══════════════════════════════════════════════════════ */}
      <Dialog open={variableModalOpen} onOpenChange={setVariableModalOpen}>
        <DialogContent className="max-w-lg max-h-[82vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Variable className="size-4 text-primary" />
              插入动态运维变量
            </DialogTitle>
            <DialogDescription className="text-xs">
              在 Shell 脚本中引用动态变量，下发时将自动替换为目标主机的实际属性或当前时间
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 flex-1 overflow-hidden flex flex-col pt-1">
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                type="text"
                value={variableSearchQuery}
                onChange={(e) => setVariableSearchQuery(e.target.value)}
                placeholder="搜索变量标识、名称或示例..."
                className="w-full h-8.5 rounded-lg border border-border/80 bg-muted/40 pl-8 pr-8 text-xs outline-none focus:border-primary text-foreground"
              />
              {variableSearchQuery && (
                <button
                  type="button"
                  onClick={() => setVariableSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* 分类标签切换 */}
            <div className="flex items-center gap-1.5 pb-1 text-[11px]">
              {[
                { key: "all", label: "全部", count: dynamicVariables.length },
                { key: "host", label: "📡 主机网络", count: dynamicVariables.filter((v) => v.category === "host").length },
                { key: "time", label: "⏰ 时间日期", count: dynamicVariables.filter((v) => v.category === "time").length },
                { key: "env", label: "🛡️ 环境上下文", count: dynamicVariables.filter((v) => v.category === "env").length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setVariableCategory(tab.key as any)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                    variableCategory === tab.key
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted"
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* 变量列表 */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 -mr-1 max-h-[380px]">
              {isLoadingVars ? (
                <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                  <RefreshCw className="size-4 animate-spin text-primary" />
                  <span>正在从服务器动态获取支持的变量字典...</span>
                </div>
              ) : filteredVariables.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">未找到相关动态变量</div>
              ) : (
                filteredVariables.map((v) => (
                  <div
                    key={v.key}
                    onClick={() => {
                      insertVariable(v.key);
                      setVariableModalOpen(false);
                    }}
                    className="p-2.5 rounded-xl border border-border/60 bg-card/60 hover:bg-primary/5 hover:border-primary/50 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                          {v.key}
                        </span>
                        <span className="text-xs font-semibold text-foreground">{v.label}</span>
                      </div>
                      <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                        点击插入 ↵
                      </span>
                    </div>

                    <div className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{v.desc}</div>

                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-mono text-zinc-400 bg-zinc-950/70 p-1.5 rounded border border-zinc-900">
                      <span className="text-zinc-500 select-none">解析示例:</span>
                      <span className="text-emerald-400 truncate">{v.example}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-border/60 text-xs">
              <span className="text-[11px] text-muted-foreground">下发执行时将自动映射为目标节点的真实属性</span>
              <Button size="sm" variant="outline" onClick={() => setVariableModalOpen(false)} className="cursor-pointer h-7 text-xs">
                关闭
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════ */}
      {/* 弹窗 2: 目标主机范围多选模态框                         */}
      {/* ══════════════════════════════════════════════════════ */}
      <Dialog open={serverSelectorOpen} onOpenChange={setServerSelectorOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Server className="size-4 text-primary" />
              选择可调度目标主机
            </DialogTitle>
            <DialogDescription>
              勾选需要下发运维脚本的目标节点（离线主机不可调度执行）
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                type="text"
                value={serverSearchQuery}
                onChange={(e) => setServerSearchQuery(e.target.value)}
                placeholder="搜索主机名、IP、分组、地域..."
                className="w-full h-8.5 rounded-lg border border-border/80 bg-muted/40 pl-8 pr-8 text-xs outline-none focus:border-primary text-foreground"
              />
              {serverSearchQuery && (
                <button
                  type="button"
                  onClick={() => setServerSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* 批量操作工具栏 */}
            <div className="flex items-center justify-between text-xs pt-1 flex-wrap gap-2">
              <span className="text-muted-foreground">
                {serverSearchQuery.trim() ? (
                  <>
                    筛选到 <strong className="text-foreground">{filteredServers.length}</strong> 台 (在线 <strong className="text-emerald-400">{filteredServers.filter((s) => s.status !== "offline").length}</strong> 台)
                  </>
                ) : (
                  <>
                    已勾选 <strong className="text-emerald-400">{selectedServerIds.length}</strong> / {onlineServers.length} 台在线节点
                  </>
                )}
              </span>

              <div className="flex items-center gap-2">
                {serverSearchQuery.trim() ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const onlineFilteredIds = filteredServers
                          .filter((s) => s.status !== "offline")
                          .map((s) => s.id);
                        if (onlineFilteredIds.length === 0) {
                          toast.warning("当前筛选结果中无在线可用主机");
                          return;
                        }
                        setSelectedServerIds((prev) => [...new Set([...prev, ...onlineFilteredIds])]);
                        toast.success(`已全选筛选出的 ${onlineFilteredIds.length} 台在线主机`);
                      }}
                      className="text-primary hover:underline cursor-pointer font-bold flex items-center gap-1"
                    >
                      <Check className="size-3" /> 全选当前筛选 ({filteredServers.filter((s) => s.status !== "offline").length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const filteredIdsSet = new Set(filteredServers.map((s) => s.id));
                        setSelectedServerIds((prev) => prev.filter((id) => !filteredIdsSet.has(id)));
                        toast.info("已取消勾选当前筛选出的主机");
                      }}
                      className="text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      清空筛选
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={selectAllOnlineServers}
                    className="text-primary hover:underline cursor-pointer font-medium"
                  >
                    全选在线 ({onlineServers.length})
                  </button>
                )}

                {selectedServerIds.length > 0 && (
                  <button
                    type="button"
                    onClick={deselectAllServers}
                    className="text-muted-foreground hover:text-rose-400 cursor-pointer ml-1"
                  >
                    清空全部 ({selectedServerIds.length})
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 -mr-1">
              {filteredServers.map((server) => {
                const isSelected = selectedServerIds.includes(server.id);
                const isOffline = server.status === "offline";

                return (
                  <div
                    key={server.id}
                    onClick={() => {
                      if (!isOffline) {
                        toggleServer(server.id);
                      }
                    }}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all text-xs ${
                      isOffline
                        ? "opacity-50 bg-muted/20 border-border/40 cursor-not-allowed select-none"
                        : isSelected
                          ? "bg-primary/10 border-primary shadow-2xs cursor-pointer"
                          : "bg-card/70 border-border/60 hover:bg-muted/30 hover:border-border cursor-pointer"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isOffline}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (!isOffline) {
                          toggleServer(server.id);
                        }
                      }}
                      className="size-3.5 accent-primary rounded cursor-pointer disabled:cursor-not-allowed"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`size-2 rounded-full ${!isOffline ? (server.status === "warning" ? "bg-amber-500" : "bg-emerald-500") : "bg-zinc-500"}`} />
                        <span className="font-semibold truncate">{server.name}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{server.id}</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                        {server.ip} · {server.group || server.region}
                      </div>
                    </div>

                    {isOffline ? (
                      <Badge variant="danger" className="text-[10px] px-1.5 shrink-0 bg-rose-500/10 text-rose-400 border-rose-500/30">
                        离线 · 不可调度
                      </Badge>
                    ) : server.status === "warning" ? (
                      <Badge variant="neutral" className="text-[10px] px-1.5 shrink-0 text-amber-400 border-amber-500/30">
                        网络波动
                      </Badge>
                    ) : (
                      <Badge variant="success" className="text-[10px] px-1.5 shrink-0">
                        在线
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
              <Button variant="outline" size="sm" onClick={() => setServerSelectorOpen(false)} className="cursor-pointer">
                取消
              </Button>
              <Button size="sm" onClick={() => setServerSelectorOpen(false)} className="cursor-pointer">
                <Check className="size-3.5 mr-1" /> 确认选择 ({selectedServerIds.length} 台)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════ */}
      {/* 弹窗 3: 新建 / 编辑计划任务模态框                     */}
      {/* ══════════════════════════════════════════════════════ */}
      <Dialog open={cronDialogOpen} onOpenChange={setCronDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              {editingCronId ? "编辑计划调度任务" : "新建计划调度任务"}
            </DialogTitle>
            <DialogDescription>
              按标准 Cron 表达式周期性自动在目标服务器上执行指定的 Shell 运维脚本
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 pt-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-medium text-foreground">任务名称</label>
              <input
                value={cronForm.name}
                onChange={(e) => setCronForm({ ...cronForm, name: e.target.value })}
                placeholder="例如: 每日凌晨全量备份数据库"
                className="w-full h-8.5 rounded-lg border border-border/80 bg-muted/40 px-3 text-xs outline-none focus:border-primary text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">目标服务器</label>
              <select
                value={cronForm.serverId}
                onChange={(e) => setCronForm({ ...cronForm, serverId: e.target.value })}
                className="w-full h-8.5 rounded-lg border border-border/80 bg-muted/40 px-3 text-xs outline-none focus:border-primary text-foreground cursor-pointer"
              >
                <option value="">请选择目标服务器</option>
                {servers.map((s) => (
                  <option key={s.id} value={s.id} disabled={s.status === "offline"}>
                    {s.name} ({s.ip} - {s.region}) {s.status === "offline" ? "[已离线-不可调度]" : "[在线]"}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-medium text-foreground">Cron 表达式 (分 时 日 月 周)</label>
                <span className="text-[11px] text-primary font-medium">
                  {parseCronDescription(cronForm.expression)}
                </span>
              </div>
              <input
                value={cronForm.expression}
                onChange={(e) => setCronForm({ ...cronForm, expression: e.target.value })}
                placeholder="0 2 * * *"
                className="w-full h-8.5 rounded-lg border border-border/80 bg-muted/40 px-3 text-xs font-mono outline-none focus:border-primary text-foreground"
              />
              <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-muted-foreground">
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

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">执行 Shell 指令</label>
              <textarea
                rows={3}
                value={cronForm.command}
                onChange={(e) => setCronForm({ ...cronForm, command: e.target.value })}
                placeholder="例如: /opt/scripts/backup.sh"
                className="w-full rounded-lg border border-border/80 bg-muted/40 p-2 text-xs font-mono outline-none focus:border-primary text-foreground"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
              <Button variant="outline" size="sm" onClick={() => setCronDialogOpen(false)} className="cursor-pointer">
                取消
              </Button>
              <Button
                size="sm"
                onClick={handleSaveCron}
                disabled={createCron.isPending || updateCron.isPending}
                className="cursor-pointer"
              >
                {createCron.isPending || updateCron.isPending ? "保存中..." : "保存任务"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 公共脚本库浮动小部件 (HTTP 驱动) */}
      <ScriptLibraryWidget
        onSelectScript={(cmd, title) => {
          setCommandText(cmd);
          toast.success(`已填入脚本 [${title}] 到命令下发框`);
        }}
      />
    </div>
  );
}
