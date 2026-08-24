import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Cpu,
  Activity,
  HardDrive,
  Network,
  Radio,
  Sliders,
  Sparkles,
  ShieldCheck,
  Search,
  Box,
  SlidersHorizontal,
  Flame,
  Container,
  Lock,
  FileCode,
  Database
} from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Switch } from "@/shared/ui/switch";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { toast } from "sonner";
import { useInfrastructureData } from "../api/use-infrastructure-api";
import { MOCK_HOST_SERVERS } from "../mock/infrastructure-mock";
import { AGENT_TASK_SCHEMAS } from "../mock/agent-task-schemas";
import { DynamicSchemaForm } from "../components/schema-form/dynamic-schema-form";
import type { HostServer } from "../types";

// Icon mapping helper
const ICON_MAP: Record<string, typeof Cpu> = {
  Cpu,
  Activity,
  HardDrive,
  Network,
  Radio,
  Sliders,
  Sparkles,
  Container,
  Lock,
  FileCode,
  Database,
  Flame
};

export function ServerTasksPage() {
  const { serverId } = useParams({ strict: false }) as { serverId?: string };
  const navigate = useNavigate();
  const { servers } = useInfrastructureData({ limit: 100 });

  // Resolve target server
  const server: HostServer | null = useMemo(() => {
    if (!serverId) return null;
    const found = servers.find((s) => s.id === serverId || s.name.toLowerCase() === serverId.toLowerCase());
    if (found) return found;
    return MOCK_HOST_SERVERS.find((s) => s.id === serverId || s.name.toLowerCase() === serverId.toLowerCase()) || null;
  }, [serverId, servers]);

  // Initial task instances state per node
  const [taskInstances, setTaskInstances] = useState<Record<string, { enabled: boolean; values: Record<string, unknown>; status: "running" | "idle" | "paused" | "uninstalled"; lastDispatchedAt: string }>>(() => {
    const map: Record<string, { enabled: boolean; values: Record<string, unknown>; status: "running" | "idle" | "paused" | "uninstalled"; lastDispatchedAt: string }> = {};

    for (const schema of AGENT_TASK_SCHEMAS) {
      const defaultValues: Record<string, unknown> = {};
      for (const field of schema.fields) {
        defaultValues[field.id] = field.defaultValue;
      }

      // Check server specific hardware / service capability
      const isGpu = server?.name?.toLowerCase().includes("gpu") || server?.id === "srv-04" || server?.id === "srv-08";
      const isDocker = server?.id !== "srv-03";

      let initialStatus: "running" | "idle" | "paused" | "uninstalled" = "running";
      let initialEnabled = true;

      if (schema.id === "task.plus.gpu" && !isGpu) {
        initialStatus = "uninstalled";
        initialEnabled = false;
      } else if (schema.id === "task.plus.docker" && !isDocker) {
        initialStatus = "uninstalled";
        initialEnabled = false;
      } else if (schema.id === "task.plus.db" || schema.id === "task.plus.ebpf") {
        initialStatus = "paused";
        initialEnabled = false;
      }

      map[schema.id] = {
        enabled: initialEnabled,
        values: defaultValues,
        status: initialStatus,
        lastDispatchedAt: initialEnabled ? "2 秒前" : "未启动"
      };
    }
    return map;
  });

  const [selectedTaskId, setSelectedTaskId] = useState<string>("task.sys.cpu");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "builtin" | "plus">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);

  // Selected Schema and state
  const selectedSchema = useMemo(() => {
    return AGENT_TASK_SCHEMAS.find((s) => s.id === selectedTaskId) || AGENT_TASK_SCHEMAS[0];
  }, [selectedTaskId]);

  const currentTaskState = taskInstances[selectedSchema.id] || {
    enabled: true,
    values: {},
    status: "running",
    lastDispatchedAt: "刚刚"
  };

  // Filter tasks list
  const filteredSchemas = useMemo(() => {
    return AGENT_TASK_SCHEMAS.filter((s) => {
      if (categoryFilter !== "all" && s.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [categoryFilter, searchQuery]);

  // Statistics
  const builtinCount = AGENT_TASK_SCHEMAS.filter((t) => t.category === "builtin").length;
  const plusCount = AGENT_TASK_SCHEMAS.filter((t) => t.category === "plus").length;
  const activeCount = Object.values(taskInstances).filter((t) => t.enabled && (t.status === "running" || t.status === "idle")).length;

  // Toggle single task enable
  const handleToggleTask = (taskId: string, currentEnabled: boolean) => {
    const next = !currentEnabled;
    setTaskInstances((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        enabled: next,
        status: next ? "running" : "paused",
        lastDispatchedAt: next ? "刚刚" : prev[taskId].lastDispatchedAt
      }
    }));
    const targetSchema = AGENT_TASK_SCHEMAS.find((s) => s.id === taskId);
    if (next) {
      toast.success(`[${server?.name}] 已开启 Agent 任务下发: ${targetSchema?.name}`);
    } else {
      toast.info(`[${server?.name}] 已暂停 Agent 任务下发: ${targetSchema?.name}`);
    }
  };

  // Update form values for current task
  const handleFormValuesChange = (newValues: Record<string, unknown>) => {
    setTaskInstances((prev) => ({
      ...prev,
      [selectedSchema.id]: {
        ...prev[selectedSchema.id],
        values: newValues
      }
    }));
  };

  // Reset current task to schema defaults
  const handleResetDefaults = () => {
    const defaultValues: Record<string, unknown> = {};
    for (const field of selectedSchema.fields) {
      defaultValues[field.id] = field.defaultValue;
    }
    setTaskInstances((prev) => ({
      ...prev,
      [selectedSchema.id]: {
        ...prev[selectedSchema.id],
        values: defaultValues
      }
    }));
    toast.info(`任务 [${selectedSchema.name}] 参数已恢复为 Schema 默认定义`);
  };

  // Save parameters to Agent
  const handleSaveToAgent = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success(`[${server?.name}] 任务 [${selectedSchema.name}] 参数已成功推流同步至 Agent 守护进程！`);
    }, 600);
  };

  // Dispatch one-shot test
  const handleDispatchNow = () => {
    setIsDispatching(true);
    setTimeout(() => {
      setIsDispatching(false);
      setTaskInstances((prev) => ({
        ...prev,
        [selectedSchema.id]: {
          ...prev[selectedSchema.id],
          lastDispatchedAt: "刚刚"
        }
      }));
      toast.success(`⚡ 已向 [${server?.name}] 即时下发单次采集指令: [${selectedSchema.name}]`);
    }, 700);
  };

  const SelectedIcon = ICON_MAP[selectedSchema.iconName] || Cpu;
  const isSelectedPlus = selectedSchema.category === "plus";

  // Automatically ensure scroll is at the top when entering page
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  return (
    <div className="flex flex-col min-h-full space-y-6 p-6">
      {/* 1. Header with Breadcrumb & Server Identity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link
              to="/admin/infrastructure/servers/$serverId"
              params={{ serverId: serverId || "" }}
              search={{ tab: "config" }}
              className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
            >
              <ArrowLeft className="size-3.5" /> 返回节点配置与运维管理
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold">Agent 任务与插件调度中心</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-inner">
              <SlidersHorizontal className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <span>{server?.name || "服务器节点"} · 任务与插件调度</span>
                <Badge variant="outline" className="text-xs font-mono font-normal">
                  {server?.id}
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                基于后端动态 JSON Schema 自动生成复杂参数表单，控制 Agent 内置采集与 PLUS 扩展插件的调度下发
              </p>
            </div>
          </div>
        </div>

        {/* Top Badges */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Badge variant="neutral" className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-2.5 py-1">
            <ShieldCheck className="size-3.5 mr-1 text-emerald-400" />
            Agent v{server?.agentVersion || "1.4.2"}
          </Badge>
          <Badge variant="outline" className="text-xs font-mono px-2.5 py-1">
            {activeCount} / {AGENT_TASK_SCHEMAS.length} 运行中
          </Badge>
        </div>
      </div>

      {/* 2. Main 2-Column Master-Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Task List Navigator (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Filter & Search Bar */}
          <div className="space-y-2.5 p-3 rounded-xl border border-border/70 bg-card/60">
            {/* Category Filter Pills */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-muted/40 rounded-lg border border-border/50 text-xs">
              <button
                type="button"
                onClick={() => setCategoryFilter("all")}
                className={`py-1 rounded-md font-medium transition-all text-center cursor-pointer ${
                  categoryFilter === "all"
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                全部 ({AGENT_TASK_SCHEMAS.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter("builtin")}
                className={`py-1 rounded-md font-medium transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                  categoryFilter === "builtin"
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Box className="size-3" />
                <span>内置 ({builtinCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter("plus")}
                className={`py-1 rounded-md font-medium transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                  categoryFilter === "plus"
                    ? "bg-purple-600 text-white shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Sparkles className="size-3 text-purple-300" />
                <span>PLUS ({plusCount})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索任务名称或 ID..."
                className="w-full h-8 rounded-lg border border-border/80 bg-background/80 pl-8 pr-3 text-xs outline-none focus:border-primary text-foreground transition-colors"
              />
            </div>
          </div>

          {/* Tasks List Cards */}
          <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {filteredSchemas.map((schema) => {
              const Icon = ICON_MAP[schema.iconName] || Cpu;
              const isPlus = schema.category === "plus";
              const isSelected = schema.id === selectedTaskId;
              const state = taskInstances[schema.id] || { enabled: true, status: "running" };

              return (
                <div
                  key={schema.id}
                  onClick={() => setSelectedTaskId(schema.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer text-xs relative overflow-hidden ${
                    isSelected
                      ? isPlus
                        ? "bg-purple-500/10 border-purple-500 shadow-sm"
                        : "bg-primary/10 border-primary shadow-sm"
                      : "bg-card/70 border-border/60 hover:bg-muted/30 hover:border-border"
                  }`}
                >
                  {/* Left Active Accent Bar */}
                  {isSelected && (
                    <div
                      className={`absolute left-0 top-0 bottom-0 w-1 ${
                        isPlus ? "bg-purple-500" : "bg-primary"
                      }`}
                    />
                  )}

                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div
                        className={`size-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isPlus
                            ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                            : "bg-primary/15 text-primary border border-primary/25"
                        }`}
                      >
                        <Icon className="size-4" />
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-semibold truncate ${isSelected ? "text-foreground font-bold" : "text-foreground"}`}>
                            {schema.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                          <span>{schema.id}</span>
                          <span>·</span>
                          <span>{schema.fields.length} 项参数</span>
                        </div>
                      </div>
                    </div>

                    {/* Switch Toggle */}
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0 pt-0.5"
                    >
                      <Switch
                        checked={state.enabled}
                        onCheckedChange={() => handleToggleTask(schema.id, state.enabled)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Dynamic Schema Form & Task Controls (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Task Header Banner */}
          <div
            className={`p-5 rounded-xl border relative overflow-hidden shadow-2xs ${
              isSelectedPlus
                ? "bg-gradient-to-br from-card via-card to-purple-950/20 border-purple-500/30"
                : "bg-card/80 border-border/70"
            }`}
          >
            {/* Top Accent Gradient Line */}
            {isSelectedPlus ? (
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500" />
            ) : (
              <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
            )}

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div
                  className={`size-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                    isSelectedPlus
                      ? "bg-purple-500/15 border border-purple-500/30 text-purple-400"
                      : "bg-primary/15 border border-primary/30 text-primary"
                  }`}
                >
                  <SelectedIcon className="size-6" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-foreground">{selectedSchema.name}</h2>
                    {isSelectedPlus ? (
                      <Badge variant="neutral" className="text-[10px] bg-purple-500/15 text-purple-400 border-purple-500/30 font-semibold px-2 py-0.5">
                        <Sparkles className="size-2.5 mr-1 inline" />
                        {selectedSchema.version || "PLUS 插件"}
                      </Badge>
                    ) : (
                      <Badge variant="neutral" className="text-[10px] bg-primary/10 text-primary border-primary/20 px-2 py-0.5">
                        内置核心任务
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">{selectedSchema.id}</div>
                  <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                    {selectedSchema.description}
                  </p>
                </div>
              </div>

              {/* Master Switch on Header */}
              <div className="flex items-center gap-3 self-end sm:self-start bg-muted/40 p-2.5 rounded-xl border border-border/60">
                <div className="text-right">
                  <div className="text-xs font-semibold text-foreground">
                    {currentTaskState.enabled ? "下发已启用" : "已暂停下发"}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    最近: {currentTaskState.lastDispatchedAt}
                  </div>
                </div>
                <Switch
                  checked={currentTaskState.enabled}
                  onCheckedChange={() => handleToggleTask(selectedSchema.id, currentTaskState.enabled)}
                />
              </div>
            </div>
          </div>

          {/* Dynamic Schema Form Component */}
          <DynamicSchemaForm
            key={selectedSchema.id}
            schema={selectedSchema}
            values={currentTaskState.values}
            onChange={handleFormValuesChange}
            onReset={handleResetDefaults}
            isSaving={isSaving}
            onSave={handleSaveToAgent}
            onDispatchNow={handleDispatchNow}
            isDispatching={isDispatching}
          />
        </div>
      </div>
    </div>
  );
}
