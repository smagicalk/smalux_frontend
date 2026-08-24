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
  HelpCircle
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
  useDispatchTask,
  useCrons,
  useCreateCron,
  useUpdateCron,
  useToggleCron,
  useDeleteCron
} from "../api/use-automation";
import { useInfrastructureData } from "@/features/infrastructure/api/use-infrastructure-api";
import { ScriptLibraryWidget } from "../components/script-library-widget";
import type { Task, Cron } from "@/shared/api/methods";

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
// 完整丰富的动态运维变量库定义
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
  { key: "{{SERVER_IP}}", category: "host", label: "主机 IPv4 地址", desc: "自动注入当前调度目标节点的公网或主内网 IP", example: "185.199.108.153" },
  { key: "{{SERVER_NAME}}", category: "host", label: "主机 Hostname", desc: "自动注入当前节点的标准主机名称", example: "edge-hkg-01" },
  { key: "{{SERVER_ID}}", category: "host", label: "主机唯一识别 ID", desc: "系统全局分配的节点唯一标识符", example: "srv-hkg-01" },
  { key: "{{SERVER_REGION}}", category: "host", label: "主机所属地域/机房", desc: "节点所在的地理区域或数据中心代码", example: "Hong Kong (HKG)" },
  { key: "{{SERVER_GROUP}}", category: "host", label: "业务分组名称", desc: "节点所属的业务拓扑集群或逻辑分组", example: "网关集群" },
  { key: "{{SERVER_PORT}}", category: "host", label: "Agent 通信端口", desc: "目标主机上 Agent 服务监听的远程端口", example: "22" },

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
// 自动化运维主页面组件
// ─────────────────────────────────────────────────────────────

export function AutomationPage() {
  const [activeTab, setActiveTab] = useState<"dispatch" | "cron" | "logs">("dispatch");

  // RPC 数据与 Hooks
  const { data: taskData, isLoading: isLoadingTasks, refetch: refetchTasks } = useTasks();
  const { data: cronData, isLoading: isLoadingCrons, refetch: refetchCrons } = useCrons();
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
  const crons: Cron[] = cronData?.crons ?? [];

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

  // ── 任务日志筛选与分栏选中的 Task ──
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [logStatusFilter, setLogStatusFilter] = useState<string>("all");
  const [autoRefreshLogs, setAutoRefreshLogs] = useState(true);
  const [selectedAuditTaskId, setSelectedAuditTaskId] = useState<string | null>(null);

  // 自动轮询刷新任务日志（每 4 秒）
  useEffect(() => {
    if (!autoRefreshLogs) return;
    const timer = setInterval(() => {
      refetchTasks();
    }, 4000);
    return () => clearInterval(timer);
  }, [autoRefreshLogs, refetchTasks]);

  // 过滤后的变量列表
  const filteredVariables = useMemo(() => {
    return DYNAMIC_VARIABLES.filter((item) => {
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
  }, [variableCategory, variableSearchQuery]);

  // 过滤后的日志记录列表
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchSearch =
        !logSearchQuery ||
        t.command.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
        t.serverName.toLowerCase().includes(logSearchQuery.toLowerCase());
      const matchStatus =
        logStatusFilter === "all" || t.status === logStatusFilter;
      return matchSearch && matchStatus;
    });
  }, [tasks, logSearchQuery, logStatusFilter]);

  // 分栏视图当前选中的 Task
  const currentAuditTask = useMemo(() => {
    if (selectedAuditTaskId) {
      const found = tasks.find((t) => t.id === selectedAuditTaskId);
      if (found) return found;
    }
    return filteredTasks[0] || tasks[0] || null;
  }, [tasks, filteredTasks, selectedAuditTaskId]);

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

  // 已选目标主机的文字摘要
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

    for (const serverId of validServerIds) {
      const server = servers.find((s) => s.id === serverId);

      let finalCommand = commandText;
      if (server) {
        finalCommand = finalCommand
          .replaceAll("{{SERVER_IP}}", server.ip)
          .replaceAll("{{SERVER_NAME}}", server.name)
          .replaceAll("{{SERVER_ID}}", server.id)
          .replaceAll("{{SERVER_REGION}}", server.region || "default")
          .replaceAll("{{SERVER_GROUP}}", server.group || "default")
          .replaceAll("{{SERVER_PORT}}", "22")
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
        risk: "low",
        scope: "node:exec"
      });
    }

    pushToHistory(commandText);

    setActiveBatchResult({
      command: commandText,
      dispatchedAt: Date.now(),
      serverIds: validServerIds,
      activeServerId: validServerIds[0]
    });

    toast.success(`指令已成功下发至 ${validServerIds.length} 台主机，实时回显已生成！`);
    setTimeout(() => refetchTasks(), 200);
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

    dispatchTask.mutate({
      serverId: job.serverId,
      command: job.command,
      risk: "low",
      scope: "node:exec"
    });

    setActiveBatchResult({
      command: job.command,
      dispatchedAt: Date.now(),
      serverIds: [job.serverId],
      activeServerId: job.serverId
    });

    toast.success(`已向主机 [${job.serverName}] 触发下发任务: ${job.name}，正在捕获回显...`);
    setTimeout(() => refetchTasks(), 200);
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
      const task = tasks.find((t) => t.serverId === sid && t.command.startsWith(activeBatchResult.command.slice(0, 15)));
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
        {/* 顶部导航 */}
        <div className="flex items-center justify-between border-b border-border/80 pb-3 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            {([
              { key: "dispatch" as const, icon: Terminal, label: "远程命令与模板" },
              { key: "cron" as const, icon: Clock, label: `计划任务 (${crons.length})` },
              { key: "logs" as const, icon: ScrollText, label: `执行记录 (${tasks.length})` }
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
                toast.info("已刷新数据");
              }}
            >
              <RefreshCw className="size-3 mr-1" /> 刷新
            </Button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════ */}
        {/* Tab 1: 远程命令执行（开阔高密工作台）                  */}
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
                {/* 重新设计的紧凑动态变量工具栏 */}
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

                    {/* 2 个最常用的高频变量快速直插 */}
                    <button
                      type="button"
                      onClick={() => insertVariable("{{SERVER_IP}}")}
                      title="目标主机 IPv4 地址"
                      className="rounded-md border border-primary/30 bg-primary/5 px-2 py-1 text-[10px] font-mono text-primary hover:bg-primary/15 cursor-pointer font-medium"
                    >
                      + IP
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

                    {/* 更多变量抽屉/弹窗选择器 */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setVariableModalOpen(true)}
                      className="h-6.5 text-[11px] px-2.5 gap-1.5 cursor-pointer bg-muted/40 hover:bg-muted font-medium border-border/80"
                    >
                      <Variable className="size-3 text-primary" />
                      更多变量 ({DYNAMIC_VARIABLES.length}) ▾
                    </Button>
                  </div>
                </div>

                {/* 饱满专业的深色 IDE 终端编辑器 */}
                <div className="relative rounded-lg border border-border/80 bg-zinc-950 p-3.5 font-mono text-xs text-zinc-100 shadow-inner flex-1 flex flex-col min-h-[260px]">
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
                    rows={10}
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
            {/* 实时执行控制台（有下发结果时展开，无下发时展示最近流水）*/}
            {/* ══════════════════════════════════════════════════════ */}
            {activeBatchResult ? (
              <Card id="live-console-card" className="border-primary/40 shadow-md">
                <CardHeader className="bg-muted/20 border-b border-border/60 pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="size-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                        <Terminal className="size-4 text-emerald-400" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-mono font-bold">
                          实时执行控制台 · 回显已生成
                        </CardTitle>
                        <CardDescription className="text-xs font-mono mt-0.5">
                          指令: <span className="text-foreground font-semibold">{activeBatchResult.command}</span> · 调度时间: {new Date(activeBatchResult.dispatchedAt).toLocaleTimeString()}
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs cursor-pointer"
                        onClick={() => setActiveTab("logs")}
                      >
                        <ExternalLink className="size-3 mr-1" /> 查看完整执行记录
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 cursor-pointer"
                        onClick={() => setActiveBatchResult(null)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border/60 min-h-[260px]">
                    {/* 左侧：节点状态 */}
                    <div className="p-3 space-y-1.5 bg-muted/10 md:col-span-1 max-h-[320px] overflow-y-auto">
                      <div className="text-[11px] font-semibold text-muted-foreground mb-2 flex items-center justify-between">
                        <span>目标节点 ({activeConsoleServerTasks.length})</span>
                        <span className="text-[10px] text-emerald-400">已就绪</span>
                      </div>

                      {activeConsoleServerTasks.map((item) => {
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
                      })}
                    </div>

                    {/* 右侧：黑色终端回显 */}
                    <div className="p-4 md:col-span-3 bg-zinc-950 text-zinc-200 font-mono text-xs flex flex-col justify-between overflow-hidden">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-[11px] text-zinc-400">
                        <div className="flex items-center gap-2">
                          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>
                            终端回显: <strong className="text-zinc-100">{servers.find((s) => s.id === activeBatchResult.activeServerId)?.name || activeBatchResult.activeServerId}</strong>
                          </span>
                          {activeConsoleSelectedTask && (
                            <span className="text-zinc-500">
                              (耗时: {durationStr(activeConsoleSelectedTask.durationMs)} · 退出码: {activeConsoleSelectedTask.exitCode ?? 0})
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const output = activeConsoleSelectedTask?.output || activeBatchResult.command;
                            navigator.clipboard.writeText(output);
                            toast.success("输出回显已复制到剪贴板");
                          }}
                          className="hover:text-zinc-100 flex items-center gap-1 cursor-pointer text-[11px]"
                        >
                          <Copy className="size-3" /> 复制
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto max-h-56 whitespace-pre-wrap leading-relaxed select-text pr-2 text-zinc-300">
                        {activeConsoleSelectedTask?.output ? (
                          activeConsoleSelectedTask.output
                        ) : (
                          <div className="py-8 text-center text-zinc-500 flex flex-col items-center gap-2">
                            <RefreshCw className="size-4 animate-spin text-primary" />
                            <span>正在等待远程 Agent 守护进程返回执行回显数据...</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 mt-2 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-500">
                        <span>终端模式: POSIX Shell (UTF-8)</span>
                        <span>Smalux Fleet Agent v2.4</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="py-3 border-b border-border/60">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-semibold flex items-center gap-2">
                      <Activity className="size-3.5 text-primary" />
                      最近调度流水概览 (最近 3 条)
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("logs")}
                      className="h-6 text-[11px] cursor-pointer"
                    >
                      查看全部 {tasks.length} 条流水 <ChevronRight className="size-3 ml-0.5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0 divide-y divide-border/40">
                  {tasks.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedAuditTaskId(t.id);
                        setActiveTab("logs");
                      }}
                      className="flex items-center justify-between p-3 hover:bg-muted/30 cursor-pointer transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {statusBadge(t.status)}
                        <span className="font-mono font-medium truncate max-w-md">{t.command}</span>
                      </div>
                      <div className="flex items-center gap-4 text-muted-foreground text-[11px] font-mono shrink-0">
                        <span>{t.serverName}</span>
                        <span>{durationStr(t.durationMs)}</span>
                        <span>{relativeTime(t.startedAt)}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* Tab 2: 分布式计划任务 (Cron Jobs)                      */}
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
                  基于 Agent 守护进程的周期性计划任务，支持秒级表达式与多节点独立调度
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
        {/* Tab 3: 历史执行记录与双栏控制台                         */}
        {/* ══════════════════════════════════════════════════════ */}
        {activeTab === "logs" && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4 pb-3">
                <div>
                  <CardTitle className="text-base">历史执行记录</CardTitle>
                  <CardDescription>左侧选择任务流水，右侧即刻实时预览终端执行回显与运行详情</CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <input
                      value={logSearchQuery}
                      onChange={(e) => setLogSearchQuery(e.target.value)}
                      placeholder="搜索任务 ID / 命令..."
                      className="h-8 w-44 rounded-lg border border-border/80 bg-muted/40 pl-8 pr-3 text-xs outline-none focus:border-primary text-foreground"
                    />
                  </div>

                  <select
                    value={logStatusFilter}
                    onChange={(e) => setLogStatusFilter(e.target.value)}
                    className="h-8 rounded-lg border border-border/80 bg-muted/40 px-2 text-xs outline-none focus:border-primary text-foreground cursor-pointer"
                  >
                    <option value="all">全部状态</option>
                    <option value="success">仅成功</option>
                    <option value="running">执行中</option>
                    <option value="failed">失败/超时</option>
                  </select>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {isLoadingTasks ? (
                  <div className="text-center text-xs text-muted-foreground py-16 flex flex-col items-center gap-2">
                    <RefreshCw className="size-4 animate-spin text-primary" />
                    <span>正在加载执行记录...</span>
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground py-16">
                    {logSearchQuery ? "未匹配到相关执行记录" : "暂无历史执行记录"}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border/60 min-h-[420px]">
                    {/* 左侧：任务列表 (5列) */}
                    <div className="lg:col-span-5 divide-y divide-border/60 max-h-[500px] overflow-y-auto p-2 space-y-1">
                      {filteredTasks.map((task) => {
                        const isSelected = (currentAuditTask?.id === task.id);

                        return (
                          <div
                            key={task.id}
                            onClick={() => setSelectedAuditTaskId(task.id)}
                            className={`p-3 rounded-lg border transition-all cursor-pointer text-xs ${
                              isSelected
                                ? "bg-primary/10 border-primary shadow-xs"
                                : "bg-card/60 border-border/40 hover:bg-muted/40"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              {statusBadge(task.status)}
                              <span className="text-[11px] text-muted-foreground font-mono">
                                {relativeTime(task.startedAt)}
                              </span>
                            </div>

                            <div className="font-mono text-xs font-semibold text-foreground mt-2 truncate">
                              {task.command}
                            </div>

                            <div className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
                              <span>目标: {task.serverName}</span>
                              <span>耗时: {durationStr(task.durationMs)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* 右侧：实时选中项详情与终端输出回显 (7列) */}
                    <div className="lg:col-span-7 p-4 bg-zinc-950 text-zinc-200 font-mono text-xs flex flex-col justify-between max-h-[500px]">
                      {currentAuditTask ? (
                        <>
                          <div className="pb-3 border-b border-zinc-800 flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <Terminal className="size-4 text-emerald-400" />
                                <span className="font-bold text-zinc-100">{currentAuditTask.id}</span>
                                {statusBadge(currentAuditTask.status)}
                              </div>
                              <div className="text-[11px] text-zinc-400 mt-1">
                                目标: <span className="text-zinc-200">{currentAuditTask.serverName}</span> ({currentAuditTask.serverId}) · 耗时: {durationStr(currentAuditTask.durationMs)}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800 cursor-pointer"
                                onClick={() => {
                                  setCommandText(currentAuditTask.command);
                                  setActiveTab("dispatch");
                                  toast.info("已填入命令下发编辑器");
                                }}
                              >
                                再次下发
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800 cursor-pointer"
                                onClick={() => {
                                  navigator.clipboard.writeText(currentAuditTask.output || currentAuditTask.command);
                                  toast.success("已复制到剪贴板");
                                }}
                              >
                                <Copy className="size-3 mr-1" /> 复制回显
                              </Button>
                            </div>
                          </div>

                          <div className="flex-1 my-3 p-3.5 rounded-lg bg-black/60 border border-zinc-800 overflow-y-auto leading-relaxed whitespace-pre-wrap select-text text-zinc-300 shadow-inner">
                            {currentAuditTask.output ? (
                              currentAuditTask.output
                            ) : (
                              <span className="text-zinc-500 italic">无输出回显内容</span>
                            )}
                          </div>

                          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
                            <span>调度发起: {new Date(currentAuditTask.startedAt || Date.now()).toLocaleString()}</span>
                            <span>退出码: {currentAuditTask.exitCode ?? 0}</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-24 text-zinc-500">请在左侧选择一条记录以查看回显</div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
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
                { key: "all", label: "全部", count: DYNAMIC_VARIABLES.length },
                { key: "host", label: "📡 主机网络", count: DYNAMIC_VARIABLES.filter((v) => v.category === "host").length },
                { key: "time", label: "⏰ 时间日期", count: DYNAMIC_VARIABLES.filter((v) => v.category === "time").length },
                { key: "env", label: "🛡️ 环境上下文", count: DYNAMIC_VARIABLES.filter((v) => v.category === "env").length }
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
              {filteredVariables.length === 0 ? (
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
    </div>
  );
}
