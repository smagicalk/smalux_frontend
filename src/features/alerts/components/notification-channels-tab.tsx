import { useState, useMemo, useEffect } from "react";
import {
  Send,
  Plus,
  Globe,
  Bot,
  Mail,
  Code2,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCw,
  Trash2,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  AlertTriangle
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Switch } from "@/shared/ui/switch";
import { toast } from "@/shared/ui/toaster";
import { useToggleChannel, useDeleteChannel, useTestChannel } from "../hooks/use-notifications";
import { useUpdateAlertRule } from "../hooks/use-alerts";
import type { NotificationChannel, NotificationEvent, AlertRule } from "@/shared/api/methods";

interface NotificationChannelsTabProps {
  channels: NotificationChannel[];
  events: NotificationEvent[];
  rules?: AlertRule[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onOpenCreate: () => void;
}

interface ConfirmActionState {
  type: "toggle" | "delete";
  channel: NotificationChannel;
  relatedRules: AlertRule[];
}

export function NotificationChannelsTab({
  channels,
  events,
  rules = [],
  isLoading,
  onRefresh,
  onOpenCreate
}: NotificationChannelsTabProps) {
  const toggleMutation = useToggleChannel();
  const deleteMutation = useDeleteChannel();
  const testMutation = useTestChannel();
  const updateRuleMutation = useUpdateAlertRule();

  const [testingId, setTestingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmActionState | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // 渠道搜索与筛选
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "enabled" | "disabled">("all");

  // 渠道卡片分页
  const [channelPage, setChannelPage] = useState(1);
  const [channelPageSize, setChannelPageSize] = useState(6);

  // 投递日志搜索与筛选
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [logSeverityFilter, setLogSeverityFilter] = useState<string>("all");
  const [logStatusFilter, setLogStatusFilter] = useState<"all" | "ok" | "fail">("all");

  // 投递日志分页
  const [logPage, setLogPage] = useState(1);
  const [logPageSize, setLogPageSize] = useState(10);

  const filteredChannels = useMemo(() => {
    return channels.filter((c) => {
      if (typeFilter !== "all" && c.type !== typeFilter) return false;
      if (statusFilter === "enabled" && !c.enabled) return false;
      if (statusFilter === "disabled" && c.enabled) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = c.name.toLowerCase().includes(q);
        const matchType = c.type.toLowerCase().includes(q);
        const matchEndpoint = (c.endpoint || "").toLowerCase().includes(q);
        if (!matchName && !matchType && !matchEndpoint) return false;
      }
      return true;
    });
  }, [channels, searchQuery, typeFilter, statusFilter]);

  // 当渠道搜索条件改变时重置到第 1 页
  useEffect(() => {
    setChannelPage(1);
  }, [searchQuery, typeFilter, statusFilter]);

  const totalChannelPages = Math.max(1, Math.ceil(filteredChannels.length / channelPageSize));
  const paginatedChannels = useMemo(() => {
    const start = (channelPage - 1) * channelPageSize;
    return filteredChannels.slice(start, start + channelPageSize);
  }, [filteredChannels, channelPage, channelPageSize]);

  // 投递日志筛选逻辑
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (logSeverityFilter !== "all" && e.severity !== logSeverityFilter) return false;
      if (logStatusFilter === "ok" && !e.ok) return false;
      if (logStatusFilter === "fail" && e.ok) return false;
      if (logSearchQuery.trim()) {
        const q = logSearchQuery.toLowerCase().trim();
        const matchChannel = e.channelName.toLowerCase().includes(q);
        const matchMsg = e.message.toLowerCase().includes(q);
        if (!matchChannel && !matchMsg) return false;
      }
      return true;
    });
  }, [events, logSearchQuery, logSeverityFilter, logStatusFilter]);

  // 当日志搜索条件改变时重置到第 1 页
  useEffect(() => {
    setLogPage(1);
  }, [logSearchQuery, logSeverityFilter, logStatusFilter]);

  const totalLogPages = Math.max(1, Math.ceil(filteredEvents.length / logPageSize));
  const paginatedEvents = useMemo(() => {
    const start = (logPage - 1) * logPageSize;
    return filteredEvents.slice(start, start + logPageSize);
  }, [filteredEvents, logPage, logPageSize]);

  // 查找使用某个渠道的全部告警策略
  const getRelatedRulesForChannel = (channelId: string) => {
    return rules.filter(
      (r) =>
        (r.channelIds && r.channelIds.includes(channelId)) ||
        ((r as any).channels && (r as any).channels.includes(channelId))
    );
  };

  const handleToggleEnable = async (channel: NotificationChannel) => {
    const willDisable = channel.enabled; // 当前已启用，点击将要关闭

    if (willDisable) {
      const related = getRelatedRulesForChannel(channel.id);
      if (related.length > 0) {
        // 有关联告警规则，拦截并弹窗确认
        setConfirmAction({
          type: "toggle",
          channel,
          relatedRules: related
        });
        return;
      }
    }

    // 无关联或开启操作直接执行
    try {
      await toggleMutation.mutateAsync({ id: channel.id, enabled: !channel.enabled });
      toast.success(`推送渠道「${channel.name}」已${!channel.enabled ? "开启" : "暂停"}`);
    } catch (err: any) {
      toast.error(err?.message || "切换渠道状态失败");
    }
  };

  const handleDeleteChannel = (channel: NotificationChannel) => {
    const related = getRelatedRulesForChannel(channel.id);
    setConfirmAction({
      type: "delete",
      channel,
      relatedRules: related
    });
  };

  const handleExecuteConfirmAction = async () => {
    if (!confirmAction) return;
    setIsProcessingAction(true);

    try {
      if (confirmAction.type === "toggle") {
        await toggleMutation.mutateAsync({ id: confirmAction.channel.id, enabled: false });
        toast.success(`推送渠道「${confirmAction.channel.name}」已暂停使用`);
      } else if (confirmAction.type === "delete") {
        // 方案 1：级联从关联的告警规则中解绑该渠道 ID
        if (confirmAction.relatedRules.length > 0) {
          for (const rule of confirmAction.relatedRules) {
            const nextChannelIds = (rule.channelIds || []).filter((id) => id !== confirmAction.channel.id);
            try {
              await updateRuleMutation.mutateAsync({
                id: rule.id,
                name: rule.name,
                metric: rule.metric,
                operator: rule.operator,
                threshold: rule.threshold,
                windowSec: rule.windowSec,
                severity: rule.severity,
                serverIds: rule.serverIds,
                serverId: rule.serverId,
                channelIds: nextChannelIds
              });
            } catch (ruleErr) {
              console.warn(`解绑规则 [${rule.id}] 的渠道失败:`, ruleErr);
            }
          }
        }

        // 删除该渠道
        await deleteMutation.mutateAsync(confirmAction.channel.id);
        toast.success(
          `推送渠道「${confirmAction.channel.name}」已成功移除${
            confirmAction.relatedRules.length > 0
              ? `（已从 ${confirmAction.relatedRules.length} 条关联策略中解绑）`
              : ""
          }`
        );
      }
      setConfirmAction(null);
    } catch (err: any) {
      toast.error(err?.message || "操作执行失败，请重试");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleTestPing = async (channel: NotificationChannel) => {
    setTestingId(channel.id);
    try {
      await testMutation.mutateAsync({ id: channel.id, channelName: channel.name });
      toast.success(`已向「${channel.name}」发送测试告警报文，推送成功！`);
    } catch (err: any) {
      toast.error(err?.message || `向「${channel.name}」推送测试报文失败，请检查端点配置`);
    } finally {
      setTestingId(null);
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case "telegram":
      case "tgbot":
        return <Bot className="size-4 text-sky-400" />;
      case "email":
        return <Mail className="size-4 text-amber-400" />;
      case "js":
      case "script":
        return <Code2 className="size-4 text-emerald-400" />;
      case "webhook":
      default:
        return <Globe className="size-4 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 顶部工具栏：搜索 + 类型过滤 + 状态过滤 + 刷新 + 配置新渠道 */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 bg-muted/20 p-2.5 rounded-xl border border-border/80">
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          {/* 搜索框 */}
          <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
            <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索渠道名称、类型、端点..."
              className="w-full h-8 pl-8 pr-7 rounded-lg border border-border/80 bg-background/80 text-xs font-mono text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* 类型筛选 */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="筛选渠道类型"
            className="h-8 px-2.5 rounded-lg border border-border/80 bg-background/80 text-xs font-mono text-foreground outline-none cursor-pointer"
          >
            <option value="all">全部类型</option>
            <option value="telegram">Telegram Bot</option>
            <option value="webhook">HTTP Webhook</option>
            <option value="email">Email 邮件</option>
            <option value="js">JavaScript 脚本</option>
          </select>

          {/* 状态筛选 */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            aria-label="筛选启用状态"
            className="h-8 px-2.5 rounded-lg border border-border/80 bg-background/80 text-xs font-mono text-foreground outline-none cursor-pointer"
          >
            <option value="all">全部状态</option>
            <option value="enabled">已开启 ({channels.filter((c) => c.enabled).length})</option>
            <option value="disabled">已停用 ({channels.filter((c) => !c.enabled).length})</option>
          </select>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          <span className="text-xs font-mono text-muted-foreground hidden lg:inline">
            共 <strong>{channels.length}</strong> 个渠道
          </span>

          {onRefresh && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRefresh}
              className="h-8 px-2.5 text-xs font-mono cursor-pointer"
              title="刷新渠道状态"
            >
              <RotateCw className={`size-3.5 ${isLoading ? "animate-spin text-primary" : ""}`} />
            </Button>
          )}

          <Button
            size="sm"
            onClick={onOpenCreate}
            className="h-8 px-3.5 text-xs font-mono cursor-pointer bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-1.5"
          >
            <Plus className="size-3.5" />
            <span>配置新渠道</span>
          </Button>
        </div>
      </div>

      {/* 渠道网格卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {channels.length === 0 ? (
          <Card className="col-span-full border-border/80 bg-card/40">
            <CardContent className="p-16 flex flex-col items-center justify-center text-center font-mono gap-2">
              <Send className="size-8 text-muted-foreground/40 mb-1" />
              <span className="font-semibold text-foreground text-sm">暂未配置任何外发推送渠道</span>
              <span className="text-xs text-muted-foreground">配置群机器人或邮件通知，确保第一时刻获取告警突发事件</span>
              <Button
                size="sm"
                onClick={onOpenCreate}
                className="h-8 text-xs font-mono mt-3 cursor-pointer bg-cyan-600 hover:bg-cyan-500 text-white"
              >
                <Plus className="size-3 mr-1" /> 添加第一个推送渠道
              </Button>
            </CardContent>
          </Card>
        ) : filteredChannels.length === 0 ? (
          <Card className="col-span-full border-border/80 bg-card/40">
            <CardContent className="p-16 flex flex-col items-center justify-center text-center font-mono gap-2">
              <Search className="size-8 text-muted-foreground/40 mb-1" />
              <span className="font-semibold text-foreground text-sm">未找到匹配条件的推送渠道</span>
              <span className="text-xs text-muted-foreground">请调整关键词搜索或过滤条件</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setTypeFilter("all");
                  setStatusFilter("all");
                }}
                className="h-8 text-xs font-mono mt-3 cursor-pointer"
              >
                清空全部筛选条件
              </Button>
            </CardContent>
          </Card>
        ) : (
          paginatedChannels.map((chan) => {
            const isTesting = testingId === chan.id;
            return (
              <Card
                key={chan.id}
                className={`overflow-hidden border transition-all duration-200 ${
                  chan.enabled
                    ? "border-border/80 bg-card/60 hover:border-cyan-500/50 shadow-xs"
                    : "border-border/50 bg-muted/15 opacity-60"
                }`}
              >
                <CardContent className="p-4 space-y-3 font-mono text-xs">
                  {/* Top Bar: Icon + Name + Switch */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-xl bg-muted/80 border border-border/80 shrink-0">
                        {getChannelIcon(chan.type)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-foreground text-sm truncate flex items-center gap-1.5" title={chan.name}>
                          <span>{chan.name}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1 mt-0.5">
                          <span className="font-semibold text-cyan-400">{chan.type}</span>
                          <span>·</span>
                          <span>ID: {chan.id}</span>
                        </div>
                      </div>
                    </div>

                    <Switch
                      checked={chan.enabled}
                      onCheckedChange={() => handleToggleEnable(chan)}
                      aria-label={`启用 ${chan.name}`}
                      className="scale-90"
                    />
                  </div>

                  {/* Endpoint/Target details */}
                  <div className="p-2 rounded-lg bg-muted/30 border border-border/60 text-[11px] text-muted-foreground break-all line-clamp-2 select-all font-mono">
                    {chan.endpoint}
                  </div>

                  {/* Footer status & actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[11px] text-muted-foreground">
                    <div>
                      {chan.lastOk !== false ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-medium">
                          <CheckCircle2 className="size-3" /> 最近送达成功
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-rose-500 font-medium">
                          <XCircle className="size-3" /> 最近失败
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isTesting || !chan.enabled}
                        onClick={() => handleTestPing(chan)}
                        className="h-6 px-2 text-[11px] font-mono cursor-pointer hover:border-cyan-500/50 hover:text-cyan-400"
                        title="向该渠道发送单次测试报文"
                      >
                        <Sparkles className={`size-3 mr-1 ${isTesting ? "animate-spin text-cyan-400" : "text-cyan-400"}`} />
                        {isTesting ? "测试中..." : "测试"}
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteChannel(chan)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-rose-500 cursor-pointer"
                        title="删除该渠道"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* 渠道网格卡片分页栏 */}
      {filteredChannels.length > 0 && (
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>共 <strong>{filteredChannels.length}</strong> 个推送渠道</span>
            <span>·</span>
            <span>第 <strong>{channelPage}</strong> / {totalChannelPages} 页</span>
            <span>·</span>
            <div className="flex items-center gap-1">
              <span>每页:</span>
              <select
                value={channelPageSize}
                onChange={(e) => {
                  setChannelPageSize(Number(e.target.value));
                  setChannelPage(1);
                }}
                className="bg-muted/40 border border-border/80 rounded px-1.5 py-0.5 outline-none font-semibold text-foreground cursor-pointer"
              >
                <option value={3}>3 个</option>
                <option value={6}>6 个</option>
                <option value={9}>9 个</option>
                <option value={12}>12 个</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setChannelPage((p) => Math.max(1, p - 1))}
              disabled={channelPage <= 1}
              className="h-7.5 px-2.5 text-xs gap-1 cursor-pointer"
            >
              <ChevronLeft className="size-3.5" /> 上一页
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setChannelPage((p) => Math.min(totalChannelPages, p + 1))}
              disabled={channelPage >= totalChannelPages}
              className="h-7.5 px-2.5 text-xs gap-1 cursor-pointer"
            >
              下一页 <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* ── 下方独立区块：左对齐标题栏与外发投递日志流水 ── */}
      <div className="pt-6 border-t border-border/80 space-y-3">
        {/* 左对齐 Section Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 select-none">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Clock className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>外发投递日志流水</span>
                <span className="text-[11px] font-normal text-muted-foreground font-mono">
                  (Delivery Audit Trail)
                </span>
              </h3>
            </div>
          </div>

          <span className="text-[11px] font-mono text-muted-foreground">
            保留最近 <strong>{events.length}</strong> 条记录 (匹配 <strong>{filteredEvents.length}</strong> 条)
          </span>
        </div>

        {/* 日志顶部工具栏与筛选 */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 bg-muted/20 p-2.5 rounded-xl border border-border/80">
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            {/* 日志搜索框 */}
            <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
              <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={logSearchQuery}
                onChange={(e) => setLogSearchQuery(e.target.value)}
                placeholder="搜索日志目标渠道、通知正文..."
                className="w-full h-8 pl-8 pr-7 rounded-lg border border-border/80 bg-background/80 text-xs font-mono text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {logSearchQuery && (
                <button
                  type="button"
                  onClick={() => setLogSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            {/* 级别筛选 */}
            <select
              value={logSeverityFilter}
              onChange={(e) => setLogSeverityFilter(e.target.value)}
              aria-label="筛选日志级别"
              className="h-8 px-2.5 rounded-lg border border-border/80 bg-background/80 text-xs font-mono text-foreground outline-none cursor-pointer"
            >
              <option value="all">全部级别</option>
              <option value="critical">🔴 Critical 严重</option>
              <option value="warning">🟡 Warning 警告</option>
              <option value="info">🔵 Info 提示</option>
            </select>

            {/* 投递状态筛选 */}
            <select
              value={logStatusFilter}
              onChange={(e) => setLogStatusFilter(e.target.value as any)}
              aria-label="筛选投递状态"
              className="h-8 px-2.5 rounded-lg border border-border/80 bg-background/80 text-xs font-mono text-foreground outline-none cursor-pointer"
            >
              <option value="all">全部状态</option>
              <option value="ok">✓ 仅看送达成功</option>
              <option value="fail">✕ 仅看投递失败</option>
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card/60 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse min-w-[600px]">
              <thead className="bg-muted/40 text-muted-foreground border-b border-border/70 select-none">
                <tr>
                  <th className="px-4 py-2.5 font-semibold w-40">目标渠道</th>
                  <th className="px-3.5 py-2.5 font-semibold w-24 text-center">级别</th>
                  <th className="px-3.5 py-2.5 font-semibold">通知正文概要</th>
                  <th className="px-3.5 py-2.5 font-semibold w-40">投递时间</th>
                  <th className="px-4 py-2.5 font-semibold w-24 text-center">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      暂无通知外发记录
                    </td>
                  </tr>
                ) : filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Search className="size-6 text-muted-foreground/50" />
                        <span>未找到匹配筛选条件的投递日志</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setLogSearchQuery("");
                            setLogSeverityFilter("all");
                            setLogStatusFilter("all");
                          }}
                          className="h-7 text-xs font-mono mt-1 cursor-pointer"
                        >
                          清空日志筛选
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedEvents.map((evt) => (
                    <tr key={evt.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-foreground">
                        {evt.channelName}
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <Badge
                          variant={evt.severity === "critical" ? "danger" : evt.severity === "warning" ? "warning" : "info"}
                          dot
                          className="text-[9px] px-1 py-0 h-3.5"
                        >
                          {evt.severity}
                        </Badge>
                      </td>
                      <td className="px-3.5 py-2.5 text-muted-foreground truncate max-w-[320px]">
                        {evt.message}
                      </td>
                      <td className="px-3.5 py-2.5 text-muted-foreground text-[11px]">
                        {new Date(evt.deliveredAt).toLocaleString("zh-CN", { hour12: false })}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {evt.ok ? (
                          <span className="text-emerald-500 font-bold text-[11px]">✓ 送达</span>
                        ) : (
                          <span className="text-rose-500 font-bold text-[11px]">✕ 失败</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 投递日志分页控制栏 */}
          {filteredEvents.length > 0 && (
            <div className="p-2.5 border-t border-border/60 bg-muted/10 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>共 <strong>{filteredEvents.length}</strong> 条日志</span>
                <span>·</span>
                <span>第 <strong>{logPage}</strong> / {totalLogPages} 页</span>
                <span>·</span>
                <div className="flex items-center gap-1">
                  <span>每页:</span>
                  <select
                    value={logPageSize}
                    onChange={(e) => {
                      setLogPageSize(Number(e.target.value));
                      setLogPage(1);
                    }}
                    className="bg-muted/40 border border-border/80 rounded px-1.5 py-0.5 outline-none font-semibold text-foreground cursor-pointer"
                  >
                    <option value={5}>5 条</option>
                    <option value={10}>10 条</option>
                    <option value={20}>20 条</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setLogPage((p) => Math.max(1, p - 1))}
                  disabled={logPage <= 1}
                  className="h-7 px-2 text-xs gap-1 cursor-pointer"
                >
                  <ChevronLeft className="size-3.5" /> 上一页
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setLogPage((p) => Math.min(totalLogPages, p + 1))}
                  disabled={logPage >= totalLogPages}
                  className="h-7 px-2 text-xs gap-1 cursor-pointer"
                >
                  下一页 <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 渠道关闭/删除前置依赖检查与确认弹窗 (方案 1) */}
      <ConfirmChannelActionDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open && !isProcessingAction) setConfirmAction(null);
        }}
        confirmState={confirmAction}
        onConfirm={handleExecuteConfirmAction}
        isPending={isProcessingAction}
      />
    </div>
  );
}

interface ConfirmChannelActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  confirmState: ConfirmActionState | null;
  onConfirm: () => Promise<void>;
  isPending: boolean;
}

function ConfirmChannelActionDialog({
  open,
  onOpenChange,
  confirmState,
  onConfirm,
  isPending
}: ConfirmChannelActionDialogProps) {
  if (!open || !confirmState) return null;

  const { type: actionType, channel, relatedRules } = confirmState;
  const isDelete = actionType === "delete";
  const hasRelated = relatedRules.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 font-mono">
      <div className="w-full max-w-md rounded-2xl bg-card border border-border/80 p-5 shadow-2xl space-y-4">
        {/* 头部标题与图标 */}
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              isDelete
                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
            }`}
          >
            <AlertTriangle className="size-5" />
          </div>
          <div className="space-y-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground">
              {isDelete
                ? hasRelated
                  ? "高危操作：删除推送渠道"
                  : "删除推送渠道确认"
                : "停用推送渠道确认"}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              渠道名称：<strong className="text-foreground">{channel.name}</strong> ({channel.type})
            </p>
          </div>
        </div>

        {/* 依赖告警规则警示区 */}
        {hasRelated ? (
          <div className="space-y-2.5">
            <div
              className={`p-3 rounded-xl text-xs space-y-1.5 border ${
                isDelete
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-300"
              }`}
            >
              <div className="font-semibold flex items-center gap-1.5">
                <span>⚠️ 当前有 {relatedRules.length} 条告警策略正使用此渠道</span>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {isDelete
                  ? `删除后系统将自动从上述 ${relatedRules.length} 条告警规则中解除与该渠道的绑定关联，可能导致突发故障时通知中断！`
                  : `停用后，上述策略触发告警时将无法发送至此渠道（系统控制台仍会正常记录未决告警事件）。`}
              </p>
            </div>

            {/* 关联告警策略清单 */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              <div className="text-[10px] font-semibold text-muted-foreground px-0.5">受影响的告警策略清单：</div>
              {relatedRules.map((rule) => {
                const isCrit = rule.severity === "critical";
                const isWarn = rule.severity === "warning";

                return (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`size-1.5 rounded-full shrink-0 ${
                          isCrit ? "bg-rose-400" : isWarn ? "bg-amber-400" : "bg-sky-400"
                        }`}
                      />
                      <span className="font-medium text-foreground truncate">{rule.name}</span>
                    </div>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 font-mono shrink-0">
                      {isCrit ? "P0" : isWarn ? "P1" : "Info"} · {rule.metric}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-muted/30 border border-border/60 text-xs text-muted-foreground leading-relaxed">
            确定要{isDelete ? "永久删除" : "暂停停用"}该推送渠道吗？{isDelete ? "此操作无法撤销。" : ""}
          </div>
        )}

        {/* 底部操作按钮 */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs font-mono cursor-pointer"
          >
            取消
          </Button>
          <Button
            size="sm"
            disabled={isPending}
            onClick={onConfirm}
            className={`h-8 text-xs font-mono cursor-pointer font-semibold shadow-xs ${
              isDelete
                ? "bg-rose-600 hover:bg-rose-500 text-white"
                : "bg-amber-600 hover:bg-amber-500 text-white"
            }`}
          >
            {isPending ? "处理中..." : isDelete ? (hasRelated ? "解绑并删除 (高危)" : "确认删除") : "确认停用"}
          </Button>
        </div>
      </div>
    </div>
  );
}
