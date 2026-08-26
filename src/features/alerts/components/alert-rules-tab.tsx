import { useState, useMemo } from "react";
import {
  Sliders,
  Plus,
  Search,
  VolumeX,
  Volume2,
  Trash2,
  Edit,
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  Layers,
  RotateCw,
  Cpu,
  HardDrive,
  Network,
  Radio,
  Copy
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Switch } from "@/shared/ui/switch";
import { toast } from "@/shared/ui/toaster";
import { useSilenceAlert, useDeleteAlert, useToggleAlertRule } from "../hooks/use-alerts";
import type { AlertRule } from "@/shared/api/methods";

import { SilenceDialog } from "./silence-dialog";

interface AlertRulesTabProps {
  rules: AlertRule[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onOpenCreate: () => void;
  onOpenEdit: (rule: AlertRule) => void;
}

export function AlertRulesTab({
  rules,
  isLoading,
  onRefresh,
  onOpenCreate,
  onOpenEdit
}: AlertRulesTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState<"all" | "global" | "custom">("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [silenceRuleTarget, setSilenceRuleTarget] = useState<AlertRule | null>(null);

  const silenceMutation = useSilenceAlert();
  const deleteMutation = useDeleteAlert();
  const toggleMutation = useToggleAlertRule();

  const handleToggleEnable = async (rule: AlertRule) => {
    const nextState = !rule.enabled;
    try {
      await toggleMutation.mutateAsync({ id: rule.id, enabled: nextState });
      toast.success(`规则「${rule.name}」已${nextState ? "启用" : "停用"}`);
    } catch (err: any) {
      toast.error(err?.message || "切换规则状态失败");
    }
  };

  const handleToggleSilence = async (rule: AlertRule) => {
    if (rule.silenced) {
      // 处于静默，点击直接解除
      try {
        await silenceMutation.mutateAsync({ id: rule.id, silenced: false });
        toast.success(`规则「${rule.name}」已解除静默`);
      } catch (err: any) {
        toast.error(err?.message || "解除静默失败");
      }
    } else {
      // 打开弹窗选择静默时长
      setSilenceRuleTarget(rule);
    }
  };

  const handleConfirmSilenceRule = async (durationMinutes: number) => {
    if (!silenceRuleTarget) return;
    try {
      await silenceMutation.mutateAsync({ id: silenceRuleTarget.id, silenced: true });
      toast.info(`规则「${silenceRuleTarget.name}」已开启静默 (${durationMinutes >= 60 && durationMinutes % 60 === 0 ? `${durationMinutes / 60}小时` : `${durationMinutes}分钟`})`);
      setSilenceRuleTarget(null);
    } catch (err: any) {
      toast.error(err?.message || "开启静默失败");
    }
  };

  const handleDeleteRule = async (rule: AlertRule) => {
    if (!window.confirm(`确定要删除告警策略「${rule.name}」吗？`)) return;
    try {
      await deleteMutation.mutateAsync(rule.id);
      toast.success(`告警策略「${rule.name}」已删除`);
    } catch (err: any) {
      toast.error(err?.message || "删除告警策略失败");
    }
  };

  const handleCopyRuleJson = (rule: AlertRule) => {
    navigator.clipboard.writeText(JSON.stringify(rule, null, 2));
    toast.success(`已复制「${rule.name}」策略配置 JSON`);
  };

  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      // 1. 级别筛选
      if (severityFilter !== "all" && r.severity !== severityFilter) return false;

      // 2. 作用范围筛选
      const hasCustomServers = (r.serverIds && r.serverIds.length > 0) || !!r.serverId;
      if (scopeFilter === "global" && hasCustomServers) return false;
      if (scopeFilter === "custom" && !hasCustomServers) return false;

      // 3. 关键词检索
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.name.toLowerCase().includes(q);
        const matchMetric = r.metric.toLowerCase().includes(q);
        const matchServer = (r.serverId || "").toLowerCase().includes(q) || (r.serverIds || []).some((s) => s.toLowerCase().includes(q));
        if (!matchName && !matchMetric && !matchServer) return false;
      }

      return true;
    });
  }, [rules, severityFilter, scopeFilter, searchQuery]);

  return (
    <div className="space-y-4">
      {/* 顶部极简单行工具栏 */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-muted/20 p-2.5 rounded-xl border border-border/80">
        {/* 左侧：搜索框与级别/范围过滤 */}
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px] sm:max-w-sm">
            <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索规则名称、指标项、目标主机..."
              className="w-full h-8 pl-8 pr-3 rounded-lg border border-border/80 bg-background/80 text-xs font-mono text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            aria-label="筛选告警级别"
            className="h-8 px-2.5 rounded-lg border border-border/80 bg-background/80 text-xs font-mono text-foreground outline-none cursor-pointer"
          >
            <option value="all">全部级别</option>
            <option value="critical">🔴 P0 严重 (Critical)</option>
            <option value="warning">🟡 P1 警告 (Warning)</option>
            <option value="info">🔵 Info 提示</option>
          </select>

          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value as any)}
            aria-label="筛选生效范围"
            className="h-8 px-2.5 rounded-lg border border-border/80 bg-background/80 text-xs font-mono text-foreground outline-none cursor-pointer"
          >
            <option value="all">🌐 全部生效范围 ({rules.length})</option>
            <option value="global">🌐 仅全局默认</option>
            <option value="custom">🖥️ 仅单机特化</option>
          </select>
        </div>

        {/* 右侧：刷新与新建规则按钮 */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {onRefresh && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRefresh}
              className="h-8 px-2.5 text-xs font-mono cursor-pointer"
              title="刷新规则列表"
            >
              <RotateCw className={`size-3.5 ${isLoading ? "animate-spin text-primary" : ""}`} />
            </Button>
          )}

          <Button
            size="sm"
            onClick={onOpenCreate}
            className="h-8 px-3.5 text-xs font-mono cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="size-3.5" />
            <span>新建策略规则</span>
          </Button>
        </div>
      </div>

      {/* 规则卡片与列表表格 */}
      <div className="rounded-xl border border-border/80 bg-card/60 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse min-w-[700px]">
            <thead className="bg-muted/40 text-muted-foreground border-b border-border/70 select-none">
              <tr>
                <th className="px-4 py-3 font-semibold w-64 min-w-[200px]">策略规则名称</th>
                <th className="px-3.5 py-3 font-semibold w-28 text-center">级别</th>
                <th className="px-3.5 py-3 font-semibold min-w-[240px]">触发判定条件 (Condition)</th>
                <th className="px-3.5 py-3 font-semibold w-36">生效目标</th>
                <th className="px-3.5 py-3 font-semibold w-24 text-center">静默状态</th>
                <th className="px-3.5 py-3 font-semibold w-20 text-center">启用</th>
                <th className="px-4 py-3 font-semibold text-right w-28 sticky right-0 bg-card/90 backdrop-blur-md">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Sliders className="size-6 text-muted-foreground/40 mb-1" />
                      <span>未找到匹配的告警规则</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={onOpenCreate}
                        className="h-7 text-xs font-mono mt-2 cursor-pointer"
                      >
                        <Plus className="size-3 mr-1" /> 新建第一条告警规则
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule) => {
                  const isCrit = rule.severity === "critical";
                  const isWarn = rule.severity === "warning";

                  return (
                    <tr
                      key={rule.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        !rule.enabled ? "opacity-50" : rule.silenced ? "opacity-75 bg-muted/15" : ""
                      }`}
                    >
                      {/* 规则名称 */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground truncate max-w-[220px]" title={rule.name}>
                          {rule.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground/70">{rule.id}</div>
                      </td>

                      {/* 级别 */}
                      <td className="px-3.5 py-3 text-center">
                        <Badge
                          variant={isCrit ? "danger" : isWarn ? "warning" : "info"}
                          dot
                          className="text-[10px] px-1.5 py-0 h-4 font-semibold"
                        >
                          {isCrit ? "P0 严重" : isWarn ? "P1 警告" : "Info 提示"}
                        </Badge>
                      </td>

                      {/* 条件 */}
                      <td className="px-3.5 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground font-medium text-[11px] border border-border/60">
                            {rule.metric}
                          </span>
                          <span className="font-bold text-primary">{rule.operator}</span>
                          <span className="font-bold text-foreground">
                            {rule.threshold}
                            {rule.metric.toLowerCase().includes("speed")
                              ? "MB/s"
                              : rule.metric.toLowerCase().includes("conn")
                              ? "个"
                              : rule.metric.toLowerCase().includes("timeout")
                              ? "s"
                              : "%"}
                          </span>
                          <span className="text-[10px] text-muted-foreground bg-muted/60 px-1 py-0.2 rounded">
                            持续 {rule.windowSec >= 60 && rule.windowSec % 60 === 0 ? `${rule.windowSec / 60}m` : `${rule.windowSec}s`}
                          </span>
                        </div>
                      </td>

                      {/* 生效目标 */}
                      <td className="px-3.5 py-3 text-muted-foreground">
                        {rule.serverIds && rule.serverIds.length > 1 ? (
                          <span
                            className="text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-md border border-primary/30 text-[11px] cursor-help inline-flex items-center gap-1"
                            title={`生效于 ${rule.serverIds.length} 台主机:\n${rule.serverIds.join(", ")}`}
                          >
                            🖥️ 指定 {rule.serverIds.length} 台节点
                          </span>
                        ) : (rule.serverIds && rule.serverIds.length === 1) || rule.serverId ? (
                          <span className="text-foreground font-medium bg-muted/60 px-1.5 py-0.5 rounded border border-border/50 text-[11px]">
                            🖥️ {rule.serverIds?.[0] || rule.serverId}
                          </span>
                        ) : (
                          <span className="text-primary/90 font-medium text-[11px]">🌐 全集群所有节点</span>
                        )}
                      </td>

                      {/* 静默状态 */}
                      <td className="px-3.5 py-3 text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleSilence(rule)}
                          className={`h-6 px-2 text-[10px] cursor-pointer ${
                            rule.silenced ? "text-amber-400 bg-amber-500/10" : "text-muted-foreground hover:text-foreground"
                          }`}
                          title={rule.silenced ? "点击解除静默" : "点击开启临时静默"}
                        >
                          {rule.silenced ? (
                            <>
                              <VolumeX className="size-3 mr-1 text-amber-400" />
                              已静默
                            </>
                          ) : (
                            <>
                              <Volume2 className="size-3 mr-1" />
                              正常
                            </>
                          )}
                        </Button>
                      </td>

                      {/* 启用 Switch */}
                      <td className="px-3.5 py-3 text-center">
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={() => handleToggleEnable(rule)}
                          aria-label={`启用 ${rule.name}`}
                        />
                      </td>

                      {/* 操作 */}
                      <td className="px-4 py-3 text-right sticky right-0 bg-card/90 backdrop-blur-md">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopyRuleJson(rule)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                            title="复制规则 JSON"
                          >
                            <Copy className="size-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onOpenEdit(rule)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                            title="编辑策略"
                          >
                            <Edit className="size-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteRule(rule)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-500 cursor-pointer"
                            title="删除策略"
                          >
                            <Trash2 className="size-3.5" />
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
      </div>

      {/* 设定静默时长弹窗 */}
      <SilenceDialog
        open={!!silenceRuleTarget}
        onOpenChange={(open) => !open && setSilenceRuleTarget(null)}
        title={silenceRuleTarget?.name || ""}
        targetName={`告警策略 · ${silenceRuleTarget?.name}`}
        onConfirm={handleConfirmSilenceRule}
      />
    </div>
  );
}
