import { useState, useEffect, useMemo } from "react";
import {
  Sliders,
  BellRing,
  ShieldAlert,
  AlertTriangle,
  Layers,
  Server,
  Cpu,
  HardDrive,
  Network,
  Radio,
  Clock,
  Sparkles,
  Check,
  Search,
  Activity,
  X,
  Globe,
  FolderTree,
  Send,
  Plus,
  RotateCw,
  Bot,
  Mail,
  Code2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { toast } from "@/shared/ui/toaster";
import { useCreateAlertRule, useUpdateAlertRule } from "../hooks/use-alerts";
import { useNotifications } from "../hooks/use-notifications";
import { useServers } from "@/features/infrastructure/hooks/use-servers";
import { ServerMatrixSelector, getServerGroupName } from "./server-matrix-selector";
import { NotificationChannelDialog } from "./notification-channel-dialog";
import type { AlertRule, AlertSeverity } from "@/shared/api/methods";

interface AlertRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRule?: AlertRule | null;
  /** 标识是否来自于主机详情页的快速编辑/创建 */
  fromServerDetail?: boolean;
  /** 锁定只能对指定主机生效（不可修改目标主机范围） */
  lockedServerId?: string;
  /** 锁定主机的显示名称 */
  lockedServerName?: string;
  /** 触发来源模块标识（如 "server-detail"） */
  source?: string;
  /** 额外透传给后端接口的 flag/payload 字段 */
  extraPayload?: Record<string, unknown>;
}

interface MetricDef {
  value: string;
  label: string;
  sublabel: string;
  category: "compute" | "disk" | "network" | "agent";
  unit: string;
  defaultThresh: number;
  defaultOp: ">" | "<" | "==" | "!=";
  min: number;
  max: number;
  step: number;
  presets: number[];
  icon: typeof Cpu;
}

const METRIC_DEFINITIONS: MetricDef[] = [
  {
    value: "host.cpu.usage",
    label: "CPU 整体使用率",
    sublabel: "host.cpu.usage · 算力计算负载",
    category: "compute",
    unit: "%",
    defaultThresh: 85,
    defaultOp: ">",
    min: 10,
    max: 100,
    step: 5,
    presets: [70, 80, 85, 90, 95],
    icon: Cpu
  },
  {
    value: "host.mem.usage",
    label: "物理内存使用率",
    sublabel: "host.mem.usage · 内存容量与 OOM 风险",
    category: "compute",
    unit: "%",
    defaultThresh: 90,
    defaultOp: ">",
    min: 10,
    max: 100,
    step: 5,
    presets: [75, 80, 85, 90, 95],
    icon: Activity
  },
  {
    value: "host.disk.usage",
    label: "磁盘空间使用占比",
    sublabel: "host.disk.usage · 存储耗尽只读风险",
    category: "disk",
    unit: "%",
    defaultThresh: 90,
    defaultOp: ">",
    min: 50,
    max: 99,
    step: 1,
    presets: [80, 85, 90, 95, 98],
    icon: HardDrive
  },
  {
    value: "host.disk.ioSpeed",
    label: "磁盘 I/O 读写速率",
    sublabel: "host.disk.ioSpeed · 吞吐激增与 I/O 瓶颈",
    category: "disk",
    unit: "MB/s",
    defaultThresh: 500,
    defaultOp: ">",
    min: 10,
    max: 10000,
    step: 50,
    presets: [100, 500, 1000, 2500, 5000, 10000],
    icon: HardDrive
  },
  {
    value: "host.net.txSpeed",
    label: "网络出站速率 (TX)",
    sublabel: "host.net.txSpeed · 出网流量突增",
    category: "network",
    unit: "MB/s",
    defaultThresh: 500,
    defaultOp: ">",
    min: 10,
    max: 10000,
    step: 50,
    presets: [100, 500, 1000, 2500, 5000, 10000],
    icon: Network
  },
  {
    value: "host.net.rxSpeed",
    label: "网络入站速率 (RX)",
    sublabel: "host.net.rxSpeed · 入网流量突增",
    category: "network",
    unit: "MB/s",
    defaultThresh: 500,
    defaultOp: ">",
    min: 10,
    max: 10000,
    step: 50,
    presets: [100, 500, 1000, 2500, 5000, 10000],
    icon: Network
  },
  {
    value: "host.net.tcpConn",
    label: "TCP 活跃连接数",
    sublabel: "host.net.tcpConn · 高并发与连接池溢出",
    category: "network",
    unit: "个",
    defaultThresh: 5000,
    defaultOp: ">",
    min: 100,
    max: 500000,
    step: 500,
    presets: [1000, 5000, 10000, 50000, 100000],
    icon: Network
  },
  {
    value: "host.net.udpConn",
    label: "UDP 并发连接数",
    sublabel: "host.net.udpConn · UDP 数据报活跃突增",
    category: "network",
    unit: "个",
    defaultThresh: 3000,
    defaultOp: ">",
    min: 100,
    max: 200000,
    step: 500,
    presets: [1000, 3000, 5000, 20000, 50000],
    icon: Network
  },
  {
    value: "agent.offline.timeout",
    label: "主机 Agent 失联超时",
    sublabel: "agent.offline.timeout · 心跳中断与宕机",
    category: "agent",
    unit: "秒",
    defaultThresh: 60,
    defaultOp: ">",
    min: 15,
    max: 600,
    step: 15,
    presets: [30, 60, 120, 180, 300],
    icon: Radio
  }
];

const DURATION_PRESETS = [
  { value: 60, label: "1 分钟", desc: "即时敏感" },
  { value: 180, label: "3 分钟", desc: "快速判定" },
  { value: 300, label: "5 分钟", desc: "常规推荐" },
  { value: 900, label: "15 分钟", desc: "防偶发毛刺" },
  { value: 1800, label: "30 分钟", desc: "趋势监控" }
];

const REPEAT_INTERVAL_PRESETS = [
  { value: 0, label: "不循环", desc: "仅首发" },
  { value: 300, label: "5 分钟", desc: "极速催办" },
  { value: 900, label: "15 分钟", desc: "应急响应" },
  { value: 1800, label: "30 分钟", desc: "常规推荐" },
  { value: 3600, label: "1 小时", desc: "整点复核" },
  { value: 7200, label: "2 小时", desc: "缓和跟进" },
  { value: 14400, label: "4 小时", desc: "低频跟进" }
];

export function AlertRuleDialog({
  open,
  onOpenChange,
  editingRule,
  fromServerDetail,
  lockedServerId,
  lockedServerName,
  source,
  extraPayload
}: AlertRuleDialogProps) {
  const { data: serverData } = useServers();
  const {
    data: notificationsData,
    isLoading: channelsLoading,
    isFetching: channelsFetching,
    refetch: refetchChannels
  } = useNotifications();
  const createRule = useCreateAlertRule();
  const updateRule = useUpdateAlertRule();

  const [name, setName] = useState("");
  const [metric, setMetric] = useState("host.cpu.usage");
  const [operator, setOperator] = useState<">" | "<" | "==" | "!=">(">");
  const [threshold, setThreshold] = useState<number>(85);
  const [windowSec, setWindowSec] = useState<number>(300);
  const [repeatIntervalSec, setRepeatIntervalSec] = useState<number>(1800);
  const [severity, setSeverity] = useState<AlertSeverity>("warning");
  
  // 多选推送通知渠道
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>([]);
  const [channelModalOpen, setChannelModalOpen] = useState(false);
  const [channelSearch, setChannelSearch] = useState("");
  const [channelOnlySelected, setChannelOnlySelected] = useState(false);
  const [channelPage, setChannelPage] = useState(1);
  const channelPageSize = 6;

  // 多选目标范围 (若传入 lockedServerId 则强制锁定在单机)
  const [targetScope, setTargetScope] = useState<"all" | "server">(lockedServerId ? "server" : "all");
  const [selectedServerIds, setSelectedServerIds] = useState<string[]>(lockedServerId ? [lockedServerId] : []);

  const servers = useMemo(() => serverData?.servers || [], [serverData]);
  const channels = useMemo(() => notificationsData?.channels || [], [notificationsData]);

  const filteredChannels = useMemo(() => {
    return channels.filter((c) => {
      if (channelOnlySelected && !selectedChannelIds.includes(c.id)) {
        return false;
      }
      if (!channelSearch.trim()) return true;
      const q = channelSearch.toLowerCase().trim();
      return (
        c.name.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q) ||
        (c.endpoint && c.endpoint.toLowerCase().includes(q))
      );
    });
  }, [channels, channelSearch, channelOnlySelected, selectedChannelIds]);

  useEffect(() => {
    setChannelPage(1);
  }, [channelSearch, channelOnlySelected]);

  const totalChannelPages = Math.max(1, Math.ceil(filteredChannels.length / channelPageSize));
  const paginatedChannels = useMemo(() => {
    const start = (channelPage - 1) * channelPageSize;
    return filteredChannels.slice(start, start + channelPageSize);
  }, [filteredChannels, channelPage, channelPageSize]);

  useEffect(() => {
    if (lockedServerId) {
      setTargetScope("server");
      setSelectedServerIds([lockedServerId]);
    } else if (editingRule) {
      if (editingRule.serverIds && editingRule.serverIds.length > 0) {
        setTargetScope("server");
        setSelectedServerIds(editingRule.serverIds);
      } else if (editingRule.serverId) {
        setTargetScope("server");
        setSelectedServerIds([editingRule.serverId]);
      } else {
        setTargetScope("all");
        setSelectedServerIds([]);
      }
    } else {
      setTargetScope("all");
      setSelectedServerIds([]);
    }

    if (editingRule) {
      setName(editingRule.name);
      setMetric(editingRule.metric || "host.cpu.usage");
      setOperator(editingRule.operator || ">");
      setThreshold(editingRule.threshold || 85);
      setWindowSec(editingRule.windowSec || 300);
      setRepeatIntervalSec(editingRule.repeatIntervalSec ?? 1800);
      setSeverity(editingRule.severity || "warning");
      setSelectedChannelIds(editingRule.channelIds || []);
    } else {
      setName("");
      setMetric("host.cpu.usage");
      setOperator(">");
      setThreshold(85);
      setWindowSec(300);
      setRepeatIntervalSec(1800);
      setSeverity("warning");
      // 新建规则时默认勾选所有已开启的推送渠道
      setSelectedChannelIds(channels.filter((c) => c.enabled).map((c) => c.id));
    }
  }, [editingRule, open, channels, lockedServerId]);

  const selectedDef = METRIC_DEFINITIONS.find((m) => m.value === metric) || METRIC_DEFINITIONS[0];

  const handleSelectMetric = (def: MetricDef) => {
    setMetric(def.value);
    setOperator(def.defaultOp);
    setThreshold(def.defaultThresh);
    if (!name || METRIC_DEFINITIONS.some((m) => m.label.includes(name) || name.includes("预警") || name.includes("告警"))) {
      setName(`${def.label}阈值预警`);
    }
  };

  const handleToggleChannel = (id: string) => {
    setSelectedChannelIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const getChannelTypeInfo = (type: string) => {
    switch (type) {
      case "telegram":
        return { label: "Telegram Bot", icon: Bot, color: "text-sky-400 bg-sky-500/10 border-sky-500/20" };
      case "email":
        return { label: "SMTP 邮件", icon: Mail, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
      case "webhook":
        return { label: "HTTP Webhook", icon: Send, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
      case "js":
        return { label: "JS 脚本引擎", icon: Code2, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" };
      default:
        return { label: "推送渠道", icon: Send, color: "text-muted-foreground bg-muted/40 border-border/40" };
    }
  };

  const isSubmitting = createRule.isPending || updateRule.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || `${selectedDef.label}阈值预警`;

    const finalTargetScope = lockedServerId ? "server" : targetScope;
    const finalServerIds = lockedServerId ? [lockedServerId] : (finalTargetScope === "server" ? selectedServerIds : undefined);
    const finalServerId = lockedServerId ? lockedServerId : (finalTargetScope === "server" && selectedServerIds.length === 1 ? selectedServerIds[0] : undefined);

    if (finalTargetScope === "server" && (!finalServerIds || finalServerIds.length === 0)) {
      toast.error("您选择了「指定目标节点」，请在下方至少勾选一台主机");
      return;
    }

    // 组装额外携带的 flag 标识，包含单机专属、来源标识等
    const extraFlags: Record<string, unknown> = {
      ...(fromServerDetail !== undefined ? { fromServerDetail } : {}),
      ...(source ? { source } : {}),
      ...(lockedServerId ? { targetServerId: lockedServerId, isHostDedicated: true, scope: "single-host" } : {}),
      ...(extraPayload ?? {})
    };

    try {
      if (editingRule) {
        await updateRule.mutateAsync({
          id: editingRule.id,
          name: finalName,
          metric,
          operator,
          threshold: Number(threshold),
          windowSec: Number(windowSec),
          repeatIntervalSec: Number(repeatIntervalSec) || 0,
          severity,
          channelIds: selectedChannelIds,
          serverIds: finalServerIds,
          serverId: finalServerId,
          ...extraFlags
        });
        toast.success(`告警策略「${finalName}」已成功更新`);
      } else {
        await createRule.mutateAsync({
          name: finalName,
          metric,
          operator,
          threshold: Number(threshold),
          windowSec: Number(windowSec),
          repeatIntervalSec: Number(repeatIntervalSec) || 0,
          severity,
          channelIds: selectedChannelIds,
          serverIds: finalServerIds,
          serverId: finalServerId,
          ...extraFlags
        });
        toast.success(`告警策略「${finalName}」创建成功，已生效守护`);
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "保存告警规则失败，请检查参数");
    }
  };

  const targetSummaryText = useMemo(() => {
    if (targetScope === "all") return "全网所有节点 (集群)";
    if (selectedServerIds.length === 0) return "未指定主机";
    if (selectedServerIds.length === 1) {
      const s = servers.find((item) => item.id === selectedServerIds[0]);
      return s ? `${s.name} (单机)` : selectedServerIds[0];
    }
    return `指定 ${selectedServerIds.length} 台目标主机`;
  }, [targetScope, selectedServerIds, servers]);

  const channelSummaryText = useMemo(() => {
    if (selectedChannelIds.length === 0) return "仅控制台留存 (未指定推送)";
    if (channels.length > 0 && selectedChannelIds.length === channels.length) return `全渠道 (${channels.length}个)`;
    const names = channels.filter((c) => selectedChannelIds.includes(c.id)).map((c) => c.name);
    if (names.length <= 2) return names.join("、");
    return `${names.slice(0, 2).join("、")} 等 ${selectedChannelIds.length} 渠道`;
  }, [selectedChannelIds, channels]);

  const durationDesc = DURATION_PRESETS.find((d) => d.value === windowSec)?.label || `${windowSec}秒`;
  
  const repeatDesc =
    repeatIntervalSec === 0
      ? "单次通知 (不循环)"
      : repeatIntervalSec >= 3600 && repeatIntervalSec % 3600 === 0
      ? `每 ${repeatIntervalSec / 3600} 小时`
      : repeatIntervalSec >= 60 && repeatIntervalSec % 60 === 0
      ? `每 ${repeatIntervalSec / 60} 分钟`
      : `每 ${repeatIntervalSec} 秒`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden rounded-2xl border-border/80 bg-popover/95 backdrop-blur-xl shadow-2xl font-mono max-h-[92vh] flex flex-col">
        {/* 顶部 Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/60 bg-muted/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/30 text-primary shadow-xs">
              <Sliders className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <span>{editingRule ? "编辑告警策略规则" : "新建集群监控告警规则"}</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {editingRule ? "MODIFY" : "CREATE"}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                基于多维指标构建灵敏、防抖的集群健康判定策略，支持循环催办通知与海量业务分组多选
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* 表单内容区：滚动容器 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* ① 规则名称 (必填置顶) */}
          <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-2.5">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">1</span>
                <span>规则可读名称 *</span>
              </span>
              <span className="text-[10px] text-rose-500 font-normal">必填项</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如: 生产集群核心主机 CPU 持续超载预警"
              className="w-full h-10 px-3.5 rounded-lg border border-border/80 bg-background text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-xs font-medium"
            />
          </div>

          {/* ② 告警严重级别 (独立单行外框) */}
          <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">2</span>
                <span>告警严重等级 (Severity)</span>
              </label>
              <span className="text-[11px] font-mono">
                当前: <strong className={severity === "critical" ? "text-rose-400" : severity === "warning" ? "text-amber-400" : "text-cyan-400"}>
                  {severity === "critical" ? "P0 紧急" : severity === "warning" ? "P1 警告" : "Info 提示"}
                </strong>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 select-none">
              {[
                {
                  key: "critical" as const,
                  label: "🔴 P0 严重紧急",
                  desc: "严重影响服务可用性，需值班人员即刻响应",
                  icon: ShieldAlert,
                  active: "border-rose-500/80 bg-rose-500/15 text-rose-400 font-bold ring-1 ring-rose-500/40 shadow-xs"
                },
                {
                  key: "warning" as const,
                  label: "🟡 P1 风险警告",
                  desc: "指标超出常规安全阈值，建议近期跟进排查",
                  icon: AlertTriangle,
                  active: "border-amber-500/80 bg-amber-500/15 text-amber-400 font-bold ring-1 ring-amber-500/40 shadow-xs"
                },
                {
                  key: "info" as const,
                  label: "🔵 Info 提示提醒",
                  desc: "常规状态记录与通知类消息，无需紧急处理",
                  icon: BellRing,
                  active: "border-cyan-500/80 bg-cyan-500/15 text-cyan-400 font-bold ring-1 ring-cyan-500/40 shadow-xs"
                }
              ].map((lvl) => {
                const Icon = lvl.icon;
                const isSelected = severity === lvl.key;
                return (
                  <button
                    key={lvl.key}
                    type="button"
                    onClick={() => setSeverity(lvl.key)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                      isSelected
                        ? lvl.active
                        : "border-border/60 bg-card/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg border shrink-0 mt-0.5 ${
                      isSelected
                        ? "bg-background/80 border-border/80"
                        : "bg-muted border-border/50 text-muted-foreground"
                    }`}>
                      <Icon className="size-4" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-bold text-xs text-foreground">{lvl.label}</div>
                      <div className="text-[10px] text-muted-foreground line-clamp-1">{lvl.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ③ 监控指标选择 (统一外框) */}
          <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">3</span>
                <span>选择监控指标项 (Metric)</span>
              </label>
              <span className="text-[11px] text-muted-foreground font-mono">
                已选: <strong className="text-primary font-bold">{selectedDef.label}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {METRIC_DEFINITIONS.map((def) => {
                const Icon = def.icon;
                const isSelected = metric === def.value;
                return (
                  <button
                    key={def.value}
                    type="button"
                    onClick={() => handleSelectMetric(def)}
                    className={`px-3 py-2 rounded-xl border text-left transition-all duration-150 cursor-pointer flex items-center gap-2.5 select-none ${
                      isSelected
                        ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/40 shadow-2xs font-bold"
                        : "border-border/60 bg-card/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg border shrink-0 ${
                      isSelected
                        ? "bg-primary/20 border-primary/40 text-primary"
                        : "bg-muted border-border/50 text-muted-foreground"
                    }`}>
                      <Icon className="size-3.5" />
                    </div>
                    <span className="text-xs truncate">{def.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ④ 判定条件与阈值设定 (统一外框) */}
          <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">4</span>
                <span>触发条件与判定阈值 (Condition & Threshold)</span>
              </label>
              <div className="flex items-center gap-1 bg-card/80 p-0.5 rounded-lg border border-border/70 select-none">
                {[
                  { op: ">" as const, label: "> 大于" },
                  { op: "<" as const, label: "< 小于" },
                  { op: "==" as const, label: "== 等于" }
                ].map((item) => (
                  <button
                    key={item.op}
                    type="button"
                    onClick={() => setOperator(item.op)}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                      operator === item.op
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 阈值主数值显示、直接输入框与滑块 */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-muted-foreground">当前设定判定阈值:</span>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      step={selectedDef.step}
                      value={threshold}
                      onChange={(e) => setThreshold(Number(e.target.value))}
                      className="w-36 h-9 pl-3 pr-10 rounded-lg border border-border/80 bg-background text-foreground font-mono font-bold text-right text-base outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                      {selectedDef.unit}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <input
                  type="range"
                  min={selectedDef.min}
                  max={selectedDef.max}
                  step={selectedDef.step}
                  value={Math.min(selectedDef.max, Math.max(selectedDef.min, threshold))}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer transition-all"
                />
                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                  <span>最小值: {selectedDef.min} {selectedDef.unit}</span>
                  <span>上限: {selectedDef.max} {selectedDef.unit} (支持直接在上方输入更大数值)</span>
                </div>
              </div>

              {/* 快捷推荐预设药丸 */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1 select-none">
                <span className="text-[11px] text-muted-foreground mr-1">推荐快选:</span>
                {selectedDef.presets.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setThreshold(val)}
                    className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                      threshold === val
                        ? "bg-primary/20 text-primary border border-primary/40 font-bold shadow-2xs"
                        : "bg-card/70 border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {val}{selectedDef.unit}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ⑤ 持续判定时间窗口 与 ⑥ 循环催办通知间隔 (Two Columns with Outer Cards) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ⑤ 持续时间窗口 (防抖动) */}
            <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">5</span>
                  <span>持续判定时间窗口 (Duration)</span>
                </label>
                <span className="text-[11px] text-primary font-mono font-bold">
                  {windowSec >= 60 && windowSec % 60 === 0 ? `${windowSec / 60} 分钟` : `${windowSec} 秒`}
                </span>
              </div>

              {/* 快捷推荐预设药丸 */}
              <div className="grid grid-cols-5 gap-1.5 select-none">
                {DURATION_PRESETS.map((item) => {
                  const isSelected = windowSec === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setWindowSec(item.value)}
                      className={`py-1.5 px-1 rounded-lg border text-center transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/20 text-primary font-bold shadow-2xs ring-1 ring-primary/30"
                          : "border-border/60 bg-card/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      }`}
                    >
                      <div className="text-xs font-mono">{item.label}</div>
                    </button>
                  );
                })}
              </div>

              {/* 自定义直接输入框与单位换算 */}
              <div className="flex items-center gap-2 p-2 rounded-xl border border-border/70 bg-card/60">
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">自定义时长:</span>
                <div className="relative flex-1">
                  <input
                    type="number"
                    min={5}
                    max={86400}
                    step={5}
                    value={windowSec}
                    onChange={(e) => {
                      const val = Math.max(1, Number(e.target.value) || 0);
                      setWindowSec(val);
                    }}
                    placeholder="输入秒数..."
                    className="w-full h-7 px-2.5 rounded-md border border-border/80 bg-background text-xs font-mono text-foreground outline-none focus:border-primary"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">
                    秒
                  </span>
                </div>

                {/* 快捷秒/分换算辅助按钮 */}
                <div className="flex items-center gap-1 select-none">
                  {[
                    { label: "+1m", addSec: 60 },
                    { label: "+5m", addSec: 300 },
                    { label: "+10m", addSec: 600 }
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      type="button"
                      onClick={() => setWindowSec((prev) => prev + btn.addSec)}
                      className="px-2 py-1 rounded bg-muted/80 border border-border/60 text-[10px] font-mono text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                      title={`增加 ${btn.label}`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">连续超标持续达到此时间才正式触发告警，防止网络或瞬时抖动误报</p>
            </div>

            {/* ⑥ 循环通知时间间隔 (持续未静默时重复发送) */}
            <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">6</span>
                  <span>未静默循环通知间隔 (Repeat Interval)</span>
                </label>
                <span className="text-[11px] text-amber-500 font-mono font-bold">
                  {repeatIntervalSec === 0
                    ? "不循环 (单次)"
                    : repeatIntervalSec >= 3600 && repeatIntervalSec % 3600 === 0
                    ? `${repeatIntervalSec / 3600} 小时`
                    : repeatIntervalSec >= 60 && repeatIntervalSec % 60 === 0
                    ? `${repeatIntervalSec / 60} 分钟`
                    : `${repeatIntervalSec} 秒`}
                </span>
              </div>

              {/* 快捷预设药丸 */}
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 select-none">
                {REPEAT_INTERVAL_PRESETS.map((item) => {
                  const isSelected = repeatIntervalSec === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setRepeatIntervalSec(item.value)}
                      title={item.desc}
                      className={`py-1.5 px-1 rounded-lg border text-center transition-all cursor-pointer ${
                        isSelected
                          ? "border-amber-500 bg-amber-500/20 text-amber-400 font-bold shadow-2xs ring-1 ring-amber-500/30"
                          : "border-border/60 bg-card/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      }`}
                    >
                      <div className="text-[11px] font-mono whitespace-nowrap">{item.label}</div>
                    </button>
                  );
                })}
              </div>

              {/* 自定义直接输入框与单位换算 */}
              <div className="flex items-center gap-2 p-2 rounded-xl border border-border/70 bg-card/60">
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">自定义间隔:</span>
                <div className="relative flex-1">
                  <input
                    type="number"
                    min={0}
                    max={604800}
                    step={60}
                    value={repeatIntervalSec}
                    onChange={(e) => {
                      const val = Math.max(0, Number(e.target.value) || 0);
                      setRepeatIntervalSec(val);
                    }}
                    placeholder="输入秒数，0 为不循环..."
                    className="w-full h-7 px-2.5 rounded-md border border-border/80 bg-background text-xs font-mono text-foreground outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-mono">
                    秒 (0=单次)
                  </span>
                </div>

                {/* 快捷秒/分换算辅助按钮 */}
                <div className="flex items-center gap-1 select-none">
                  {[
                    { label: "+15m", addSec: 900 },
                    { label: "+30m", addSec: 1800 },
                    { label: "+1h", addSec: 3600 }
                  ].map((btn) => (
                    <button
                      key={btn.label}
                      type="button"
                      onClick={() => setRepeatIntervalSec((prev) => prev + btn.addSec)}
                      className="px-2 py-1 rounded bg-muted/80 border border-border/60 text-[10px] font-mono text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                      title={`增加 ${btn.label}`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">若故障持续未恢复且未被管理员手动静默，每隔此时间向各通知渠道再次催办重发</p>
            </div>
          </div>

          {/* ⑦ 推送通知渠道 (多选 + 搜索过滤 + 固定高度滚动 + 弹窗接入) */}
          <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3">
            {/* 顶部标题栏与全局操作 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 select-none">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">7</span>
                <span>推送通知渠道 (Notification Channels)</span>
                <span className="text-[11px] font-normal text-muted-foreground font-mono ml-1">
                  (已选 <strong className="text-primary font-bold">{selectedChannelIds.length}</strong>/{channels.length})
                </span>
              </label>

              <div className="flex items-center gap-2 flex-wrap">
                {channels.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedChannelIds.length === channels.length) {
                        setSelectedChannelIds([]);
                      } else {
                        setSelectedChannelIds(channels.map((c) => c.id));
                      }
                    }}
                    className="px-2 py-1 rounded-md text-[11px] font-mono text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60 cursor-pointer"
                  >
                    {selectedChannelIds.length === channels.length ? "清空全选" : "快速全选"}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    refetchChannels();
                    toast.info("已刷新通知渠道列表");
                  }}
                  title="刷新最新通知渠道"
                  className="px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted border border-border/60 cursor-pointer flex items-center gap-1 text-[11px]"
                >
                  <RotateCw className={`size-3.5 ${channelsFetching ? "animate-spin text-primary" : ""}`} />
                  <span className="hidden sm:inline">刷新渠道</span>
                </button>

                {/* 直接弹窗新建 (无缝接入，不跳出当前策略编辑) */}
                <button
                  type="button"
                  onClick={() => setChannelModalOpen(true)}
                  className="px-2.5 py-1 rounded-md text-[11px] bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                  title="直接弹出新渠道接入窗口（创建后自动勾选，不丢失当前表单）"
                >
                  <Plus className="size-3" />
                  <span>新建渠道</span>
                </button>
              </div>
            </div>

            {/* 搜索与过滤工具条 */}
            {channels.length > 0 && (
              <div className="flex items-center gap-2 select-none">
                <div className="relative flex-1">
                  <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
                  <input
                    type="text"
                    value={channelSearch}
                    onChange={(e) => setChannelSearch(e.target.value)}
                    placeholder="搜索渠道名称、类型 (如 dingtalk、邮件) 或 Webhook 端点..."
                    className="w-full h-8 pl-8 pr-7 rounded-lg border border-border/80 bg-background text-foreground text-xs font-mono outline-none focus:border-primary placeholder:text-muted-foreground/60"
                  />
                  {channelSearch && (
                    <button
                      type="button"
                      onClick={() => setChannelSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setChannelOnlySelected(!channelOnlySelected)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all cursor-pointer ${
                      channelOnlySelected
                        ? "bg-primary/20 text-primary border-primary/40 font-bold shadow-2xs"
                        : "bg-card/70 border-border/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    仅看已勾选 ({selectedChannelIds.length})
                  </button>
                </div>
              </div>
            )}

            {channelsLoading ? (
              <div className="py-6 text-center text-muted-foreground text-xs font-mono">
                <RotateCw className="size-4 animate-spin inline-block mr-1 text-primary" />
                正在加载通知渠道列表...
              </div>
            ) : channels.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-border/80 bg-card/40 text-center space-y-2.5">
                <p className="text-xs text-muted-foreground">当前尚未配置任何通知推送渠道，告警事件将仅留存于系统控制台</p>
                <div>
                  <button
                    type="button"
                    onClick={() => setChannelModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 transition-all cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                    <span>直接接入新推送渠道</span>
                  </button>
                </div>
              </div>
            ) : filteredChannels.length === 0 ? (
              <div className="py-6 text-center text-muted-foreground text-xs font-mono border border-dashed border-border/70 rounded-xl bg-card/30 space-y-1.5">
                <p>未找到匹配条件的推送渠道</p>
                <div className="flex items-center justify-center gap-2 pt-0.5">
                  {channelSearch && (
                    <button
                      type="button"
                      onClick={() => setChannelSearch("")}
                      className="px-2 py-0.5 rounded text-[11px] text-primary hover:underline cursor-pointer"
                    >
                      清空搜索词
                    </button>
                  )}
                  {channelOnlySelected && (
                    <button
                      type="button"
                      onClick={() => setChannelOnlySelected(false)}
                      className="px-2 py-0.5 rounded text-[11px] text-primary hover:underline cursor-pointer"
                    >
                      显示全部渠道
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* 舒适展开网格容器（完整展现全部卡片与端点信息） */
              <div className="space-y-2.5">
                <div className="min-h-[148px] overflow-visible rounded-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 select-none p-0.5">
                    {paginatedChannels.map((ch) => {
                      const isSelected = selectedChannelIds.includes(ch.id);
                      const typeInfo = getChannelTypeInfo(ch.type);
                      const ChannelIcon = typeInfo.icon;
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => handleToggleChannel(ch.id)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 select-none min-h-[64px] ${
                            isSelected
                              ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/40 shadow-2xs font-semibold"
                              : "border-border/60 bg-card/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className={`p-2 rounded-lg border shrink-0 ${
                              isSelected
                                ? "bg-primary/20 border-primary/40 text-primary"
                                : "bg-muted border-border/50 text-muted-foreground"
                            }`}>
                              <ChannelIcon className="size-4" />
                            </div>
                            <div className="min-w-0 space-y-0.5 flex-1">
                              <div className="text-xs font-bold text-foreground truncate flex items-center gap-1">
                                <span>{ch.name}</span>
                                {!ch.enabled && (
                                  <span className="text-[9px] font-normal text-muted-foreground/70">(已停用)</span>
                                )}
                              </div>
                              <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[150px]" title={ch.endpoint || ch.type}>
                                {ch.endpoint || ch.type}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1.5">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${typeInfo.color}`}>
                              {typeInfo.label}
                            </span>
                            <div className={`size-4 rounded-full border flex items-center justify-center transition-colors ${
                              isSelected
                                ? "bg-primary border-primary text-primary-foreground"
                                : "border-border/80 bg-background/50"
                            }`}>
                              {isSelected && <Check className="size-2.5 stroke-[3]" />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 渠道紧凑分页控制条 */}
                {filteredChannels.length > channelPageSize && (
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2 text-[11px] font-mono select-none">
                    <span className="text-muted-foreground">
                      第 <strong className="text-foreground">{channelPage}</strong> / {totalChannelPages} 页 (共 {filteredChannels.length} 个渠道)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setChannelPage((p) => Math.max(1, p - 1))}
                        disabled={channelPage <= 1}
                        className="h-6 px-2 text-[10px] gap-1 cursor-pointer"
                      >
                        <ChevronLeft className="size-3" /> 上页
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setChannelPage((p) => Math.min(totalChannelPages, p + 1))}
                        disabled={channelPage >= totalChannelPages}
                        className="h-6 px-2 text-[10px] gap-1 cursor-pointer"
                      >
                        下页 <ChevronRight className="size-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ⑧ 生效目标范围与海量分组矩阵选择器 (统一外框) */}
          <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3">
            <div className="flex items-center justify-between select-none">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">8</span>
                <span>生效目标主机范围 (Target Scope)</span>
              </label>
              {!lockedServerId && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setTargetScope("all")}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                      targetScope === "all"
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                        : "border-border/60 bg-card/60 text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    🌐 全网所有节点 ({servers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetScope("server")}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                      targetScope === "server"
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                        : "border-border/60 bg-card/60 text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    🖥️ 指定目标节点多选 ({selectedServerIds.length}/{servers.length})
                  </button>
                </div>
              )}
            </div>

            {/* 如果锁定为当前专属主机 */}
            {lockedServerId ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border border-primary/40 bg-primary/10 text-primary animate-in fade-in duration-200">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs text-primary border-primary/30 bg-primary/10 font-bold">
                    🖥️ 锁定当前专属主机
                  </Badge>
                  <span className="text-xs font-mono font-bold text-foreground">
                    {lockedServerName || servers.find((s) => s.id === lockedServerId)?.name || lockedServerId}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    ({lockedServerId})
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                  🔒 已锁定本节点，不可修改为全网或其他主机
                </span>
              </div>
            ) : (
              targetScope === "server" && (
                <div className="animate-in fade-in duration-200">
                  <ServerMatrixSelector
                    servers={servers}
                    selectedServerIds={selectedServerIds}
                    onChange={setSelectedServerIds}
                  />
                </div>
              )
            )}
          </div>

          {/* 底部实时策略公式预览条 (Live Rule Summary Banner) */}
          <div className="p-3 rounded-xl border border-border/80 bg-gradient-to-r from-muted/40 via-muted/20 to-muted/40 flex items-center gap-2.5 select-none">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
              <Sparkles className="size-4" />
            </div>
            <div className="text-xs leading-relaxed text-muted-foreground">
              <span>当 </span>
              <strong className="text-foreground bg-muted/80 px-1.5 py-0.5 rounded border border-border/50">{targetSummaryText}</strong>
              <span> 的 </span>
              <strong className="text-foreground bg-muted/80 px-1.5 py-0.5 rounded border border-border/50">{selectedDef.label}</strong>
              <span> </span>
              <strong className="text-primary font-bold">{operator} {threshold}{selectedDef.unit}</strong>
              <span> 持续 </span>
              <strong className="text-foreground">{durationDesc}</strong>
              <span> 时 ➔ 触发 </span>
              <span className={`px-1.5 py-0.5 rounded font-bold ${
                severity === "critical" ? "bg-rose-500/20 text-rose-400" : severity === "warning" ? "bg-amber-500/20 text-amber-400" : "bg-cyan-500/20 text-cyan-400"
              }`}>
                {severity === "critical" ? "🔴 P0 紧急" : severity === "warning" ? "🟡 P1 警告" : "🔵 Info 提示"}
              </span>
              <span> 告警</span>
              <span className="mx-1 text-border">·</span>
              <span className="text-amber-500 font-semibold">未静默{repeatDesc === "单次通知 (不循环)" ? "仅单次通知" : `${repeatDesc}循环通知`}</span>
              <span className="mx-1 text-border">·</span>
              <span className="text-foreground font-semibold">投递至: {channelSummaryText}</span>
            </div>
          </div>
        </form>

        {/* 弹窗底部操作区 */}
        <div className="px-6 py-4 border-t border-border/60 bg-muted/20 flex items-center justify-end gap-3 shrink-0 select-none">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-9 px-4 text-xs font-mono cursor-pointer"
          >
            取消
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="h-9 px-6 text-xs font-mono cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm"
          >
            {isSubmitting ? "保存中..." : editingRule ? "保存修改策略" : "立即创建策略"}
          </Button>
        </div>
      </DialogContent>

      {/* 嵌套子弹窗：直接接入新通知渠道（创建后自动刷新并自动关联勾选） */}
      <NotificationChannelDialog
        open={channelModalOpen}
        onOpenChange={setChannelModalOpen}
        onSuccess={async (newChannelName) => {
          const res = await refetchChannels();
          if (res.data?.channels) {
            const newlyCreated = newChannelName
              ? res.data.channels.find((c) => c.name === newChannelName)
              : res.data.channels[res.data.channels.length - 1];
            if (newlyCreated) {
              setSelectedChannelIds((prev) => Array.from(new Set([...prev, newlyCreated.id])));
              toast.success(`新渠道「${newlyCreated.name}」已自动关联勾选`);
            }
          }
        }}
      />
    </Dialog>
  );
}
