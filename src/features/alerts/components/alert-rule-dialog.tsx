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
  FolderTree
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { toast } from "@/shared/ui/toaster";
import { useCreateAlertRule, useUpdateAlertRule } from "../hooks/use-alerts";
import { useServers } from "@/features/infrastructure/hooks/use-servers";
import { ServerMatrixSelector, getServerGroupName } from "./server-matrix-selector";
import type { AlertRule, AlertSeverity } from "@/shared/api/methods";

interface AlertRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRule?: AlertRule | null;
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
    defaultThresh: 100,
    defaultOp: ">",
    min: 10,
    max: 1000,
    step: 10,
    presets: [50, 100, 200, 400, 800],
    icon: HardDrive
  },
  {
    value: "host.net.txSpeed",
    label: "网络出站速率 (TX)",
    sublabel: "host.net.txSpeed · 出网流量突增",
    category: "network",
    unit: "MB/s",
    defaultThresh: 100,
    defaultOp: ">",
    min: 10,
    max: 1000,
    step: 10,
    presets: [50, 100, 200, 500, 1000],
    icon: Network
  },
  {
    value: "host.net.rxSpeed",
    label: "网络入站速率 (RX)",
    sublabel: "host.net.rxSpeed · 入网流量突增",
    category: "network",
    unit: "MB/s",
    defaultThresh: 150,
    defaultOp: ">",
    min: 10,
    max: 1000,
    step: 10,
    presets: [50, 100, 150, 300, 500],
    icon: Network
  },
  {
    value: "host.net.tcpConn",
    label: "TCP 活跃连接数",
    sublabel: "host.net.tcpConn · 高并发与连接池溢出",
    category: "network",
    unit: "个",
    defaultThresh: 3000,
    defaultOp: ">",
    min: 100,
    max: 50000,
    step: 500,
    presets: [1000, 2000, 3000, 5000, 10000],
    icon: Network
  },
  {
    value: "host.net.udpConn",
    label: "UDP 并发连接数",
    sublabel: "host.net.udpConn · UDP 数据报活跃突增",
    category: "network",
    unit: "个",
    defaultThresh: 1500,
    defaultOp: ">",
    min: 100,
    max: 20000,
    step: 200,
    presets: [500, 1000, 1500, 3000, 5000],
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

export function AlertRuleDialog({ open, onOpenChange, editingRule }: AlertRuleDialogProps) {
  const { data: serverData } = useServers();
  const createRule = useCreateAlertRule();
  const updateRule = useUpdateAlertRule();

  const [name, setName] = useState("");
  const [metric, setMetric] = useState("host.cpu.usage");
  const [operator, setOperator] = useState<">" | "<" | "==" | "!=">(">");
  const [threshold, setThreshold] = useState<number>(85);
  const [windowSec, setWindowSec] = useState<number>(300);
  const [severity, setSeverity] = useState<AlertSeverity>("warning");
  
  // 多选目标范围
  const [targetScope, setTargetScope] = useState<"all" | "server">("all");
  const [selectedServerIds, setSelectedServerIds] = useState<string[]>([]);

  const servers = useMemo(() => serverData?.servers || [], [serverData]);

  useEffect(() => {
    if (editingRule) {
      setName(editingRule.name);
      setMetric(editingRule.metric || "host.cpu.usage");
      setOperator(editingRule.operator || ">");
      setThreshold(editingRule.threshold || 85);
      setWindowSec(editingRule.windowSec || 300);
      setSeverity(editingRule.severity || "warning");

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
      setName("");
      setMetric("host.cpu.usage");
      setOperator(">");
      setThreshold(85);
      setWindowSec(300);
      setSeverity("warning");
      setTargetScope("all");
      setSelectedServerIds([]);
    }
  }, [editingRule, open]);

  const selectedDef = METRIC_DEFINITIONS.find((m) => m.value === metric) || METRIC_DEFINITIONS[0];

  const handleSelectMetric = (def: MetricDef) => {
    setMetric(def.value);
    setOperator(def.defaultOp);
    setThreshold(def.defaultThresh);
    if (!name || METRIC_DEFINITIONS.some((m) => m.label.includes(name) || name.includes("预警") || name.includes("告警"))) {
      setName(`${def.label}阈值预警`);
    }
  };

  const isSubmitting = createRule.isPending || updateRule.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || `${selectedDef.label}阈值预警`;

    if (targetScope === "server" && selectedServerIds.length === 0) {
      toast.error("您选择了「指定目标节点」，请在下方至少勾选一台主机");
      return;
    }

    try {
      if (editingRule) {
        await updateRule.mutateAsync({
          id: editingRule.id,
          name: finalName,
          metric,
          operator,
          threshold: Number(threshold),
          windowSec: Number(windowSec),
          severity,
          serverIds: targetScope === "server" ? selectedServerIds : undefined,
          serverId: targetScope === "server" && selectedServerIds.length === 1 ? selectedServerIds[0] : undefined
        });
        toast.success(`告警策略「${finalName}」已成功更新`);
      } else {
        await createRule.mutateAsync({
          name: finalName,
          metric,
          operator,
          threshold: Number(threshold),
          windowSec: Number(windowSec),
          severity,
          serverIds: targetScope === "server" ? selectedServerIds : undefined,
          serverId: targetScope === "server" && selectedServerIds.length === 1 ? selectedServerIds[0] : undefined
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

  const durationDesc = DURATION_PRESETS.find((d) => d.value === windowSec)?.label || `${windowSec}秒`;

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
                基于多维指标构建灵敏、防抖的集群健康判定策略，支持海量业务分组与主机高效多选
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* 表单内容区：滚动容器 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* ① 监控指标选择：现代化可视化卡片组 */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">1</span>
                <span>选择监控指标项 (Metric)</span>
              </label>
              <span className="text-[11px] text-muted-foreground">点击卡片切换指标并自动装载最佳阈值</span>
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
                    className={`p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-1.5 relative overflow-hidden group select-none ${
                      isSelected
                        ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/40 shadow-sm"
                        : "border-border/60 bg-card/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className={`p-1.5 rounded-lg border ${isSelected ? "bg-primary/20 border-primary/40 text-primary" : "bg-muted border-border/60 text-muted-foreground group-hover:text-foreground"}`}>
                        <Icon className="size-3.5" />
                      </div>
                      {isSelected && (
                        <div className="size-3.5 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                          <Check className="size-2 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-foreground truncate">{def.label}</div>
                      <div className="text-[10px] text-muted-foreground/80 line-clamp-1 mt-0.5 font-mono">
                        默认 {def.defaultThresh}{def.unit}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ② 判定条件与阈值设定：滑动条 + 快速药丸 + 比较符号 */}
          <div className="space-y-3 p-4 rounded-xl border border-border/80 bg-muted/20">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">2</span>
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

            {/* 阈值主数值显示与滑块 */}
            <div className="space-y-3 pt-1">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">当前设定阈值:</span>
                <div className="flex items-baseline gap-1 text-primary">
                  <span className="text-3xl font-black font-mono tracking-tight">{threshold}</span>
                  <span className="text-sm font-bold text-muted-foreground">{selectedDef.unit}</span>
                </div>
              </div>

              <input
                type="range"
                min={selectedDef.min}
                max={selectedDef.max}
                step={selectedDef.step}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer transition-all"
              />

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
                        ? "bg-primary/20 text-primary border border-primary/40 font-bold"
                        : "bg-card/70 border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {val}{selectedDef.unit}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ③ 判定窗口 & 告警等级 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 持续时间窗口 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">3</span>
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
              <div className="flex items-center gap-2 p-2 rounded-xl border border-border/70 bg-muted/20">
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
                    秒 (s)
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
                      className="px-2 py-1 rounded bg-card border border-border/60 text-[10px] font-mono text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer"
                      title={`增加 ${btn.label}`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 告警严重级别 */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">4</span>
                <span>告警严重等级 (Severity)</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5 select-none">
                {[
                  { key: "critical" as const, label: "P0 紧急", icon: ShieldAlert, active: "border-rose-500/60 bg-rose-500/10 text-rose-400 font-bold ring-1 ring-rose-500/30" },
                  { key: "warning" as const, label: "P1 警告", icon: AlertTriangle, active: "border-amber-500/60 bg-amber-500/10 text-amber-400 font-bold ring-1 ring-amber-500/30" },
                  { key: "info" as const, label: "Info 提示", icon: BellRing, active: "border-cyan-500/60 bg-cyan-500/10 text-cyan-400 font-bold ring-1 ring-cyan-500/30" }
                ].map((lvl) => {
                  const Icon = lvl.icon;
                  const isSelected = severity === lvl.key;
                  return (
                    <button
                      key={lvl.key}
                      type="button"
                      onClick={() => setSeverity(lvl.key)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? lvl.active
                          : "border-border/60 bg-card/60 text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      <Icon className="size-3.5" />
                      <span className="text-xs">{lvl.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ④ 规则名称 */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>规则可读名称 *</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如: 核心业务主机 CPU 高载预警"
              className="w-full h-9 px-3 rounded-lg border border-border/80 bg-background text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-xs"
            />
          </div>

          {/* ⑤ 作用目标范围与海量分组矩阵选择器 */}
          <div className="space-y-3 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between select-none">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">5</span>
                <span>生效目标主机范围 (Target Scope)</span>
              </label>
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
            </div>

            {/* 当选择“指定目标节点”时展开的海量分组矩阵选择器 */}
            {targetScope === "server" && (
              <div className="animate-in fade-in duration-200">
                <ServerMatrixSelector
                  servers={servers}
                  selectedServerIds={selectedServerIds}
                  onChange={setSelectedServerIds}
                />
              </div>
            )}
          </div>

          {/* ⑥ 实时策略公式预览条 (Live Rule Summary Banner) */}
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
    </Dialog>
  );
}
