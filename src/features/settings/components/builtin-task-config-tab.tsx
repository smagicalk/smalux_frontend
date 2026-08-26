import { useState, useMemo } from "react";
import {
  Terminal,
  Zap,
  Clock,
  Cpu,
  Layers,
  Sliders,
  Plus,
  Trash2,
  Edit3,
  Check,
  RotateCcw,
  Save,
  AlertTriangle,
  CheckCircle2,
  Copy,
  FileCode2,
  Search,
  Shield,
  ShieldAlert,
  HelpCircle,
  X,
  Play,
  RotateCw
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
import { Badge } from "@/shared/ui/badge";
import { toast } from "@/shared/ui/toaster";

export interface BuiltinTaskTemplate {
  id: string;
  name: string;
  category: "system" | "container" | "network" | "security";
  command: string;
  risk: "low" | "medium" | "high";
  defaultTimeoutSec: number;
  requireApproval: boolean;
  enabled: boolean;
  description: string;
}

const DEFAULT_PRESET_TEMPLATES: BuiltinTaskTemplate[] = [
  {
    id: "tpl-1",
    name: "Docker 系统深度清理",
    category: "container",
    command: "docker system prune -af --volumes",
    risk: "medium",
    defaultTimeoutSec: 180,
    requireApproval: true,
    enabled: true,
    description: "清理未使用的 Docker 镜像、悬空容器、孤儿卷与构建缓存"
  },
  {
    id: "tpl-2",
    name: "Nginx 配置测试与热重载",
    category: "system",
    command: "nginx -t && systemctl reload nginx",
    risk: "low",
    defaultTimeoutSec: 30,
    requireApproval: false,
    enabled: true,
    description: "验证 Web 服务器语法正确性并执行平滑优雅重载"
  },
  {
    id: "tpl-3",
    name: "Linux 内存缓存清理回收",
    category: "system",
    command: "sync && echo 3 > /proc/sys/vm/drop_caches",
    risk: "low",
    defaultTimeoutSec: 15,
    requireApproval: false,
    enabled: true,
    description: "将脏页写入磁盘并释放 PageCache、dentries 和 inodes 缓存"
  },
  {
    id: "tpl-4",
    name: "日志轮转与磁盘深度巡检",
    category: "system",
    command: "journalctl --vacuum-time=7d && df -hT",
    risk: "low",
    defaultTimeoutSec: 60,
    requireApproval: false,
    enabled: true,
    description: "归档并清理 7 天前系统日志，输出各文件系统类型与可用配额"
  },
  {
    id: "tpl-5",
    name: "TCP 连接异常状态诊断",
    category: "network",
    command: "netstat -antp | awk '{print $6}' | sort | uniq -c | sort -n",
    risk: "low",
    defaultTimeoutSec: 20,
    requireApproval: false,
    enabled: true,
    description: "统计并汇总 ESTABLISHED、TIME_WAIT、CLOSE_WAIT 等网络连接分布"
  },
  {
    id: "tpl-6",
    name: "系统安全补丁更新模拟",
    category: "security",
    command: "apt-get update -s | grep -i security || yum check-update --security",
    risk: "low",
    defaultTimeoutSec: 90,
    requireApproval: false,
    enabled: true,
    description: "非侵入式扫描待修复的高危安全漏洞与内核升级补丁"
  },
  {
    id: "tpl-7",
    name: "Agent 守护进程健康体检与重启",
    category: "system",
    command: "systemctl restart smalux-agent && systemctl status smalux-agent --no-pager",
    risk: "high",
    defaultTimeoutSec: 45,
    requireApproval: true,
    enabled: true,
    description: "重启本机的监控采集与 RPC 守护进程，并输出最新启动日志"
  }
];

const DEFAULT_DANGEROUS_PATTERNS = [
  "rm -rf /",
  "rm -rf /*",
  "mkfs",
  "dd if=",
  ":(){ :|:& };:",
  "shutdown",
  "init 0",
  "reboot",
  "fdisk",
  "chmod -R 777 /",
  "> /dev/sda"
];

export function BuiltinTaskConfigTab() {
  // 全局执行与并发默认参数
  const [defaultTimeout, setDefaultTimeout] = useState(300);
  const [maxConcurrency, setMaxConcurrency] = useState(20);
  const [maxOutputBufferSize, setMaxOutputBufferSize] = useState(2);
  const [defaultRetryCount, setDefaultRetryCount] = useState(0);
  const [defaultRetryInterval, setDefaultRetryInterval] = useState(5);
  const [historyRetentionDays, setHistoryRetentionDays] = useState(30);

  // 安全与高危拦截
  const [interceptorEnabled, setInterceptorEnabled] = useState(true);
  const [dangerousPatterns, setDangerousPatterns] = useState<string[]>(DEFAULT_DANGEROUS_PATTERNS);
  const [newPatternInput, setNewPatternInput] = useState("");
  const [maskSensitiveVariables, setMaskSensitiveVariables] = useState(true);
  const [defaultScope, setDefaultScope] = useState<"node:exec" | "node:read">("node:exec");

  // 通知与回调
  const [notifyOnFailure, setNotifyOnFailure] = useState(true);
  const [longRunningAlertThreshold, setLongRunningAlertThreshold] = useState(60);

  // 模板库
  const [templates, setTemplates] = useState<BuiltinTaskTemplate[]>(() => {
    try {
      const saved = localStorage.getItem("smalux_task_builtin_templates");
      return saved ? JSON.parse(saved) : DEFAULT_PRESET_TEMPLATES;
    } catch {
      return DEFAULT_PRESET_TEMPLATES;
    }
  });

  const [templateSearch, setTemplateSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "system" | "container" | "network" | "security">("all");

  // 模态框/编辑抽屉
  const [editingTemplate, setEditingTemplate] = useState<BuiltinTaskTemplate | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState<Partial<BuiltinTaskTemplate>>({
    name: "",
    category: "system",
    command: "",
    risk: "low",
    defaultTimeoutSec: 60,
    requireApproval: false,
    enabled: true,
    description: ""
  });

  const [isSaving, setIsSaving] = useState(false);

  // 过滤后的模板
  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (templateSearch.trim()) {
        const q = templateSearch.toLowerCase().trim();
        const matchName = t.name.toLowerCase().includes(q);
        const matchCmd = t.command.toLowerCase().includes(q);
        const matchDesc = t.description.toLowerCase().includes(q);
        if (!matchName && !matchCmd && !matchDesc) return false;
      }
      return true;
    });
  }, [templates, categoryFilter, templateSearch]);

  const handleAddDangerousPattern = () => {
    const trimmed = newPatternInput.trim();
    if (!trimmed) return;
    if (dangerousPatterns.includes(trimmed)) {
      toast.warning("该拦截特征规则已存在");
      return;
    }
    setDangerousPatterns([...dangerousPatterns, trimmed]);
    setNewPatternInput("");
  };

  const handleRemoveDangerousPattern = (pattern: string) => {
    setDangerousPatterns(dangerousPatterns.filter((p) => p !== pattern));
  };

  const handleToggleTemplate = (id: string) => {
    const next = templates.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t));
    setTemplates(next);
    localStorage.setItem("smalux_task_builtin_templates", JSON.stringify(next));
    toast.success("已更新模板启用状态");
  };

  const handleDeleteTemplate = (id: string, name: string) => {
    if (!window.confirm(`确定要移除内置模板「${name}」吗？`)) return;
    const next = templates.filter((t) => t.id !== id);
    setTemplates(next);
    localStorage.setItem("smalux_task_builtin_templates", JSON.stringify(next));
    toast.success(`已删除模板「${name}」`);
  };

  const handleOpenCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      name: "",
      category: "system",
      command: "",
      risk: "low",
      defaultTimeoutSec: 60,
      requireApproval: false,
      enabled: true,
      description: ""
    });
    setIsTemplateModalOpen(true);
  };

  const handleOpenEditTemplate = (tpl: BuiltinTaskTemplate) => {
    setEditingTemplate(tpl);
    setTemplateForm({ ...tpl });
    setIsTemplateModalOpen(true);
  };

  const handleSaveTemplateModal = () => {
    if (!templateForm.name?.trim() || !templateForm.command?.trim()) {
      toast.error("模板名称和执行命令不能为空");
      return;
    }

    if (editingTemplate) {
      const next = templates.map((t) =>
        t.id === editingTemplate.id ? ({ ...t, ...templateForm } as BuiltinTaskTemplate) : t
      );
      setTemplates(next);
      localStorage.setItem("smalux_task_builtin_templates", JSON.stringify(next));
      toast.success(`已更新模板「${templateForm.name}」`);
    } else {
      const newTpl: BuiltinTaskTemplate = {
        id: `tpl-custom-${Date.now()}`,
        name: templateForm.name.trim(),
        category: templateForm.category || "system",
        command: templateForm.command.trim(),
        risk: templateForm.risk || "low",
        defaultTimeoutSec: Number(templateForm.defaultTimeoutSec) || 60,
        requireApproval: Boolean(templateForm.requireApproval),
        enabled: templateForm.enabled ?? true,
        description: templateForm.description?.trim() || ""
      };
      const next = [newTpl, ...templates];
      setTemplates(next);
      localStorage.setItem("smalux_task_builtin_templates", JSON.stringify(next));
      toast.success(`已新增内置模板「${newTpl.name}」`);
    }

    setIsTemplateModalOpen(false);
  };

  const handleResetPresetTemplates = () => {
    if (!window.confirm("确定要将内置 Task 模板库恢复为出厂预置状态吗？自定义模板将被清除。")) return;
    setTemplates(DEFAULT_PRESET_TEMPLATES);
    localStorage.setItem("smalux_task_builtin_templates", JSON.stringify(DEFAULT_PRESET_TEMPLATES));
    toast.success("已恢复出厂内置模板库");
  };

  const handleSaveAllConfig = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("内置 Task 默认调度策略与模板配置已成功保存生效！");
    }, 400);
  };

  return (
    <div className="space-y-6 font-mono">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 卡片 1: 全局执行与并发约束 */}
        <Card className="border-border/80 bg-card/60">
          <CardHeader className="p-4 pb-2 border-b border-border/60">
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-amber-400" />
              <CardTitle className="text-xs font-bold text-foreground">执行与并发策略默认值</CardTitle>
            </div>
            <CardDescription className="text-[11px] text-muted-foreground">
              控制集群批量指令下发的执行生命周期、并发步长与终端输出捕获
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            {/* 默认执行超时 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">默认执行超时时间 (Timeout)</span>
                <span className="font-bold text-primary font-mono">{defaultTimeout} 秒 ({Math.round(defaultTimeout / 60)} 分钟)</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={10}
                  max={1800}
                  step={10}
                  value={defaultTimeout}
                  onChange={(e) => setDefaultTimeout(Number(e.target.value))}
                  className="flex-1 accent-primary cursor-pointer"
                />
                <input
                  type="number"
                  min={10}
                  max={3600}
                  value={defaultTimeout}
                  onChange={(e) => setDefaultTimeout(Number(e.target.value))}
                  className="w-20 h-7 px-2 text-right rounded border border-border/80 bg-background text-xs font-mono font-bold"
                />
              </div>
              <p className="text-[10px] text-muted-foreground/70">
                当下发任务未显式指定超时时以此值为准，超时后 Agent 守护进程向子进程发送 SIGTERM / SIGKILL
              </p>
            </div>

            {/* 最大并发节点数 */}
            <div className="space-y-1.5 pt-2 border-t border-border/40">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">单批次最大并发执行主机数 (Concurrency)</span>
                <span className="font-bold text-cyan-400 font-mono">{maxConcurrency} 台 / 批次</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={100}
                  step={1}
                  value={maxConcurrency}
                  onChange={(e) => setMaxConcurrency(Number(e.target.value))}
                  className="flex-1 accent-cyan-500 cursor-pointer"
                />
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={maxConcurrency}
                  onChange={(e) => setMaxConcurrency(Number(e.target.value))}
                  className="w-20 h-7 px-2 text-right rounded border border-border/80 bg-background text-xs font-mono font-bold"
                />
              </div>
              <p className="text-[10px] text-muted-foreground/70">
                向大规模主机集群下发任务时的并发分发窗口，避免因瞬时连接风暴压垮网络或中央调度网关
              </p>
            </div>

            {/* 终端输出缓冲区上限 */}
            <div className="space-y-1.5 pt-2 border-t border-border/40">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">标准输出缓冲区上限 (Buffer Size)</span>
                <select
                  value={maxOutputBufferSize}
                  onChange={(e) => setMaxOutputBufferSize(Number(e.target.value))}
                  className="h-7 px-2 rounded border border-border/80 bg-background text-xs font-mono font-semibold"
                >
                  <option value={1}>1 MB (约 20,000 行)</option>
                  <option value={2}>2 MB (默认推荐)</option>
                  <option value={5}>5 MB (适用于构建日志)</option>
                  <option value={10}>10 MB (最大捕获容量)</option>
                </select>
              </div>
              <p className="text-[10px] text-muted-foreground/70">
                超出指定大小的终端输出将自动在后端进行滚动截断并追加省略标记，防止溢出前端内存
              </p>
            </div>

            {/* 调度记录保留期 */}
            <div className="space-y-1.5 pt-2 border-t border-border/40">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">执行流水与终端日志保留期</span>
                <select
                  value={historyRetentionDays}
                  onChange={(e) => setHistoryRetentionDays(Number(e.target.value))}
                  className="h-7 px-2 rounded border border-border/80 bg-background text-xs font-mono font-semibold"
                >
                  <option value={7}>7 天</option>
                  <option value={15}>15 天</option>
                  <option value={30}>30 天 (标准推荐)</option>
                  <option value={90}>90 天</option>
                  <option value={180}>180 天 (企业审计)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 卡片 2: 高危指令拦截与敏感操作安全沙箱 */}
        <Card className="border-border/80 bg-card/60">
          <CardHeader className="p-4 pb-2 border-b border-border/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-4 text-rose-500" />
                <CardTitle className="text-xs font-bold text-foreground">高危指令拦截与沙箱策略</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground font-mono">{interceptorEnabled ? "引擎已开启" : "已停用"}</span>
                <Switch
                  checked={interceptorEnabled}
                  onCheckedChange={setInterceptorEnabled}
                  className="scale-90"
                />
              </div>
            </div>
            <CardDescription className="text-[11px] text-muted-foreground">
              实时扫描下发命令文本，阻断破坏性危险指令或要求强制管理员双人复核
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            {/* 敏感高危关键词 */}
            <div className="space-y-2">
              <span className="font-semibold text-foreground flex items-center justify-between">
                <span>高危命令特征拦截库 (Blocked Patterns)</span>
                <span className="text-[10px] text-muted-foreground">已录入 {dangerousPatterns.length} 项</span>
              </span>

              <div className="flex flex-wrap gap-1.5 p-2.5 rounded-lg bg-muted/40 border border-border/60 min-h-[72px] max-h-36 overflow-y-auto">
                {dangerousPatterns.map((pattern) => (
                  <Badge
                    key={pattern}
                    variant="outline"
                    className="text-[10px] bg-rose-500/10 text-rose-400 border-rose-500/30 flex items-center gap-1 font-mono pr-1"
                  >
                    <span>{pattern}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDangerousPattern(pattern)}
                      className="hover:text-rose-200 cursor-pointer p-0.5"
                    >
                      <X className="size-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>

              {/* 添加新规则 */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newPatternInput}
                  onChange={(e) => setNewPatternInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddDangerousPattern()}
                  placeholder="输入敏感指令模式，如 rm -rf /..."
                  className="flex-1 h-7 px-2.5 rounded border border-border/80 bg-background text-xs font-mono placeholder:text-muted-foreground/60 outline-none focus:border-rose-500"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddDangerousPattern}
                  className="h-7 px-3 text-xs font-mono cursor-pointer hover:border-rose-500/50 hover:text-rose-400"
                >
                  <Plus className="size-3 mr-1" /> 添加特征
                </Button>
              </div>
            </div>

            {/* 敏感环境变量自动脱敏 */}
            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <div className="space-y-0.5 pr-4">
                <div className="font-semibold text-foreground">终端日志敏感信息自动脱敏 (Log Masking)</div>
                <div className="text-[10px] text-muted-foreground/70">
                  自动将输出中检测到的 Token、私钥、Password 等替换为 *** 掩码
                </div>
              </div>
              <Switch
                checked={maskSensitiveVariables}
                onCheckedChange={setMaskSensitiveVariables}
                className="scale-90"
              />
            </div>

            {/* 默认执行作用域 */}
            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <div className="space-y-0.5 pr-4">
                <div className="font-semibold text-foreground">新建任务默认权限作用域 (Scope)</div>
                <div className="text-[10px] text-muted-foreground/70">
                  指定普通运维人员在控制台新建下发任务时的默认权限级别
                </div>
              </div>
              <select
                value={defaultScope}
                onChange={(e) => setDefaultScope(e.target.value as any)}
                className="h-7 px-2 rounded border border-border/80 bg-background text-xs font-mono font-semibold"
              >
                <option value="node:exec">node:exec (完全执行)</option>
                <option value="node:read">node:read (仅安全只读)</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 卡片 3: 内置常用 Task 模板库管理 */}
      <Card className="border-border/80 bg-card/60">
        <CardHeader className="p-4 pb-3 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <FileCode2 className="size-4 text-cyan-400" />
              <CardTitle className="text-xs font-bold text-foreground">系统内置 Task 常用运维模板库</CardTitle>
              <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                共 {templates.length} 个模板
              </Badge>
            </div>
            <CardDescription className="text-[11px] text-muted-foreground">
              为控制台提供常用一键下发预设（支持容器清理、服务重启、网络诊断、安全体检等场景）
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
            {/* 搜索 */}
            <div className="relative w-44">
              <Search className="size-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                placeholder="搜索模板名称/命令..."
                className="w-full h-7 pl-7 pr-2 rounded border border-border/80 bg-background text-xs font-mono outline-none"
              />
            </div>

            {/* 分类筛选 */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="h-7 px-2 rounded border border-border/80 bg-background text-xs font-mono"
            >
              <option value="all">全部分类</option>
              <option value="system">系统运维</option>
              <option value="container">容器维护</option>
              <option value="network">网络诊断</option>
              <option value="security">安全审计</option>
            </select>

            <Button
              size="sm"
              onClick={handleOpenCreateTemplate}
              className="h-7 px-3 text-xs font-mono cursor-pointer bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1 shadow-xs"
            >
              <Plus className="size-3" />
              <span>新建内置模板</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse min-w-[700px]">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border/70 select-none">
                <tr>
                  <th className="px-4 py-2.5 font-semibold w-52">模板名称</th>
                  <th className="px-3 py-2.5 font-semibold w-24 text-center">分类</th>
                  <th className="px-3 py-2.5 font-semibold min-w-[240px]">执行指令脚本 (Command)</th>
                  <th className="px-3 py-2.5 font-semibold w-24 text-center">风险级别</th>
                  <th className="px-3 py-2.5 font-semibold w-20 text-center">默认超时</th>
                  <th className="px-3 py-2.5 font-semibold w-20 text-center">强制审批</th>
                  <th className="px-3 py-2.5 font-semibold w-16 text-center">启用</th>
                  <th className="px-4 py-2.5 font-semibold text-right w-24">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredTemplates.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      未找到符合条件的内置 Task 模板
                    </td>
                  </tr>
                ) : (
                  filteredTemplates.map((tpl) => {
                    const isCrit = tpl.risk === "high";
                    const isWarn = tpl.risk === "medium";

                    return (
                      <tr
                        key={tpl.id}
                        className={`hover:bg-muted/30 transition-colors ${!tpl.enabled ? "opacity-50" : ""}`}
                      >
                        {/* 模板名称 */}
                        <td className="px-4 py-3">
                          <div className="font-bold text-foreground truncate max-w-[200px]" title={tpl.name}>
                            {tpl.name}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate max-w-[200px] mt-0.5">
                            {tpl.description || tpl.id}
                          </div>
                        </td>

                        {/* 分类 */}
                        <td className="px-3 py-3 text-center">
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {tpl.category === "container"
                              ? "容器维护"
                              : tpl.category === "network"
                              ? "网络诊断"
                              : tpl.category === "security"
                              ? "安全审计"
                              : "系统运维"}
                          </Badge>
                        </td>

                        {/* 脚本 */}
                        <td className="px-3 py-3">
                          <div className="p-1.5 rounded bg-muted/50 border border-border/60 text-[11px] font-mono text-muted-foreground break-all line-clamp-1 select-all">
                            {tpl.command}
                          </div>
                        </td>

                        {/* 风险级别 */}
                        <td className="px-3 py-3 text-center">
                          <Badge
                            variant={isCrit ? "danger" : isWarn ? "warning" : "info"}
                            dot
                            className="text-[10px] px-1.5 py-0 font-semibold"
                          >
                            {isCrit ? "高风险" : isWarn ? "中风险" : "低风险"}
                          </Badge>
                        </td>

                        {/* 默认超时 */}
                        <td className="px-3 py-3 text-center font-mono text-[11px] text-muted-foreground">
                          {tpl.defaultTimeoutSec}s
                        </td>

                        {/* 强制审批 */}
                        <td className="px-3 py-3 text-center">
                          {tpl.requireApproval ? (
                            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                              需要审批
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/60">直接下发</span>
                          )}
                        </td>

                        {/* 启用开关 */}
                        <td className="px-3 py-3 text-center">
                          <Switch
                            checked={tpl.enabled}
                            onCheckedChange={() => handleToggleTemplate(tpl.id)}
                            className="scale-75"
                          />
                        </td>

                        {/* 操作 */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenEditTemplate(tpl)}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                              title="编辑模板"
                            >
                              <Edit3 className="size-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-rose-500 cursor-pointer"
                              title="删除模板"
                            >
                              <Trash2 className="size-3" />
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
        </CardContent>
      </Card>

      {/* 底部保存与重置操作栏 */}
      <div className="sticky bottom-4 z-10 flex items-center justify-between p-3.5 rounded-xl border border-border/80 bg-card/95 backdrop-blur-md shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground font-mono">
            统一控制集群下发任务默认超时、高危拦截规则与预置模板
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetPresetTemplates}
            className="h-8.5 px-3 text-xs font-mono cursor-pointer"
          >
            <RotateCcw className="size-3 mr-1.5" /> 恢复出厂模板
          </Button>
          <Button
            size="sm"
            onClick={handleSaveAllConfig}
            disabled={isSaving}
            className="h-8.5 px-4 text-xs font-mono cursor-pointer shadow-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Save className={`size-3.5 mr-1.5 ${isSaving ? "animate-spin" : ""}`} />
            {isSaving ? "正在保存..." : "保存全部修改"}
          </Button>
        </div>
      </div>

      {/* 模态框：新建 / 编辑内置 Task 模板 */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-mono">
          <div className="w-full max-w-lg rounded-2xl bg-card border border-border/80 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Terminal className="size-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-foreground">
                  {editingTemplate ? "编辑内置 Task 模板" : "新建内置 Task 模板"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* 名称与分类 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">模板名称 *</label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    placeholder="如：重启 Nginx Web 服务"
                    className="w-full h-8 px-2.5 rounded border border-border/80 bg-background text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">所属分类</label>
                  <select
                    value={templateForm.category}
                    onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value as any })}
                    className="w-full h-8 px-2 rounded border border-border/80 bg-background text-xs font-mono"
                  >
                    <option value="system">系统运维 (System)</option>
                    <option value="container">容器维护 (Container)</option>
                    <option value="network">网络诊断 (Network)</option>
                    <option value="security">安全审计 (Security)</option>
                  </select>
                </div>
              </div>

              {/* 执行命令 */}
              <div className="space-y-1">
                <label className="font-semibold text-foreground">执行 Shell 指令脚本 *</label>
                <textarea
                  rows={3}
                  value={templateForm.command}
                  onChange={(e) => setTemplateForm({ ...templateForm, command: e.target.value })}
                  placeholder="如：df -h && free -m"
                  className="w-full p-2.5 rounded border border-border/80 bg-background text-xs font-mono leading-relaxed"
                />
              </div>

              {/* 风险级别与超时 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">风险级别</label>
                  <select
                    value={templateForm.risk}
                    onChange={(e) => setTemplateForm({ ...templateForm, risk: e.target.value as any })}
                    className="w-full h-8 px-2 rounded border border-border/80 bg-background text-xs font-mono"
                  >
                    <option value="low">低风险 (只读或常规诊断)</option>
                    <option value="medium">中风险 (服务重载或局部变更)</option>
                    <option value="high">高风险 (重启或数据清理)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">默认超时时限 (秒)</label>
                  <input
                    type="number"
                    min={5}
                    max={3600}
                    value={templateForm.defaultTimeoutSec}
                    onChange={(e) => setTemplateForm({ ...templateForm, defaultTimeoutSec: Number(e.target.value) })}
                    className="w-full h-8 px-2.5 rounded border border-border/80 bg-background text-xs font-mono"
                  />
                </div>
              </div>

              {/* 描述 */}
              <div className="space-y-1">
                <label className="font-semibold text-foreground">模板说明备注</label>
                <input
                  type="text"
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  placeholder="该任务用途与预期效果简述..."
                  className="w-full h-8 px-2.5 rounded border border-border/80 bg-background text-xs font-mono"
                />
              </div>

              {/* 开关选项 */}
              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <div className="space-y-0.5">
                  <div className="font-semibold text-foreground">强制要求管理员复核审批</div>
                  <div className="text-[10px] text-muted-foreground">下发时需要管理员二次核准才能真正触发</div>
                </div>
                <Switch
                  checked={templateForm.requireApproval}
                  onCheckedChange={(checked) => setTemplateForm({ ...templateForm, requireApproval: checked })}
                  className="scale-90"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsTemplateModalOpen(false)}
                className="h-8 text-xs font-mono cursor-pointer"
              >
                取消
              </Button>
              <Button
                size="sm"
                onClick={handleSaveTemplateModal}
                className="h-8 px-4 text-xs font-mono cursor-pointer bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
              >
                {editingTemplate ? "保存修改" : "确认添加"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
