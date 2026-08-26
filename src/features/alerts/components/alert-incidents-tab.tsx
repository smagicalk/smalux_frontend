import { useState, useMemo, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  VolumeX,
  Volume2,
  Search,
  ExternalLink,
  RotateCw,
  Clock,
  Copy,
  Terminal,
  Activity,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Eye
} from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { toast } from "@/shared/ui/toaster";
import { SilenceDialog } from "./silence-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/shared/ui/dialog";
import type { AlertHistory } from "@/shared/api/methods";

/**
 * 全局实时告警事件卡片流与排查组件 (Alert Incidents Tab)
 * 
 * 核心特性：
 * 1. 紧凑高度卡片流设计，单行 Ellipsis 截断超长诊断信息，支持 Hover Tooltip；
 * 2. 独立「详情」Dialog 弹窗，支持完整展示诊断文本、采样峰值、节点信息与 JSON 复制；
 * 3. 极简二元状态切换（触发中 vs 已恢复），支持按级别筛选与关键词检索；
 * 4. 支持设定/解除临时静默勿扰时长。
 */

/**
 * 告警事件流水组件属性入参
 */
interface AlertIncidentsTabProps {
  /** 全量告警事件历史流水列表 */
  history: AlertHistory[];
  /** 是否处于加载中状态 */
  isLoading?: boolean;
  /** 手动刷新回调函数 */
  onRefresh?: () => void;
}

export function AlertIncidentsTab({ history, isLoading, onRefresh }: AlertIncidentsTabProps) {

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "firing" | "resolved">("all");
  const [severityFilter, setSeverityFilter] = useState<"all" | "critical" | "warning" | "info">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 静默状态映射 (截止时间戳)
  const [silencedUntilMap, setSilencedUntilMap] = useState<Record<string, number>>({});
  const [silenceTarget, setSilenceTarget] = useState<{ id: string; name: string; targetName?: string } | null>(null);

  // 详情弹窗选中的事件
  const [selectedIncident, setSelectedIncident] = useState<AlertHistory | null>(null);

  const handleOpenSilenceDialog = (evt: AlertHistory) => {
    const isSilenced = (silencedUntilMap[evt.id] || 0) > Date.now();
    if (isSilenced) {
      // 已经处于静默状态，点击直接解除
      setSilencedUntilMap((prev) => {
        const next = { ...prev };
        delete next[evt.id];
        return next;
      });
      toast.success(`已解除「${evt.ruleName}」的静默状态`);
    } else {
      setSilenceTarget({
        id: evt.id,
        name: evt.ruleName,
        targetName: `${evt.serverName || "集群"} · ${evt.ruleName}`
      });
    }
  };

  const handleConfirmSilence = (durationMinutes: number) => {
    if (!silenceTarget) return;
    const until = Date.now() + durationMinutes * 60 * 1000;
    setSilencedUntilMap((prev) => ({ ...prev, [silenceTarget.id]: until }));
    toast.info(`已开启临时静默 ${durationMinutes >= 60 && durationMinutes % 60 === 0 ? `${durationMinutes / 60}小时` : `${durationMinutes}分钟`}`);
    setSilenceTarget(null);
  };

  const handleCopyIncidentPayload = (evt: AlertHistory) => {
    const text = `[告警事件报文]\n规则: ${evt.ruleName}\n级别: ${evt.severity}\n目标节点: ${evt.serverName} (${evt.serverId || "集群"})\n触发时间: ${new Date(evt.triggeredAt).toLocaleString()}\n详细内容: ${evt.message}`;
    navigator.clipboard.writeText(text);
    toast.success("已复制告警排查报文至剪贴板");
  };

  // 过滤与计算
  const filteredEvents = useMemo(() => {
    return history.filter((evt) => {
      const isResolved = !!evt.resolvedAt;

      // 状态筛选：单人极简 2 档（触发中 vs 已恢复）
      if (statusFilter === "firing" && isResolved) return false;
      if (statusFilter === "resolved" && !isResolved) return false;

      // 级别筛选
      if (severityFilter !== "all" && evt.severity !== severityFilter) return false;

      // 关键词搜索
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchRule = evt.ruleName.toLowerCase().includes(q);
        const matchServer = (evt.serverName || "").toLowerCase().includes(q);
        const matchMsg = (evt.message || "").toLowerCase().includes(q);
        if (!matchRule && !matchServer && !matchMsg) return false;
      }

      return true;
    });
  }, [history, statusFilter, severityFilter, searchQuery]);

  // 当筛选条件改变时，重置分页到第 1 页
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, severityFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / pageSize));

  const paginatedEvents = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredEvents.slice(start, start + pageSize);
  }, [filteredEvents, page, pageSize]);

  // 统计各状态计数
  const counts = useMemo(() => {
    let firing = 0;
    let resolved = 0;

    history.forEach((h) => {
      if (h.resolvedAt) {
        resolved++;
      } else {
        firing++;
      }
    });

    return { total: history.length, firing, resolved };
  }, [history]);

  return (
    <div className="space-y-3 font-mono">
      {/* 搜索与筛选工具栏 */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-muted/20 p-2 rounded-xl border border-border/80">
        {/* 状态切换 Tabs：极简二元状态 */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: "all" as const, label: "全部事件", count: counts.total },
            { key: "firing" as const, label: "🚨 触发中", count: counts.firing, highlight: counts.firing > 0 },
            { key: "resolved" as const, label: "🟢 已恢复", count: counts.resolved }
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none ${
                statusFilter === tab.key
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                statusFilter === tab.key
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : tab.highlight
                  ? "bg-rose-500/20 text-rose-400 font-bold"
                  : "bg-muted text-muted-foreground"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* 搜索与级别筛选 */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索规则/节点/原因..."
              className="w-full h-8 pl-8 pr-3 rounded-lg border border-border/80 bg-background/80 text-xs font-mono text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
            />
          </div>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            aria-label="筛选告警严重级别"
            className="h-8 px-2 rounded-lg border border-border/80 bg-background/80 text-xs font-mono text-foreground outline-none cursor-pointer"
          >
            <option value="all">全部级别</option>
            <option value="critical">P0 严重 (Critical)</option>
            <option value="warning">P1 警告 (Warning)</option>
            <option value="info">Info 提示</option>
          </select>

          {onRefresh && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRefresh}
              className="h-8 w-8 p-0 cursor-pointer"
              title="刷新事件"
            >
              <RotateCw className={`size-3.5 ${isLoading ? "animate-spin text-primary" : ""}`} />
            </Button>
          )}
        </div>
      </div>

      {/* 告警事件列表卡片流 (紧凑高度排版) */}
      <div className="space-y-2">
        {filteredEvents.length === 0 ? (
          <Card className="border-border/80 bg-card/40 backdrop-blur-md">
            <CardContent className="p-12 flex flex-col items-center justify-center text-center font-mono gap-2">
              <CheckCircle2 className="size-8 text-emerald-500/70 mb-1" />
              <span className="font-semibold text-foreground text-sm">全网暂无匹配的告警事件</span>
              <span className="text-xs text-muted-foreground">当前筛选条件下所有指标运行平稳，无未决故障</span>
            </CardContent>
          </Card>
        ) : (
          paginatedEvents.map((evt) => {
            const isCrit = evt.severity === "critical";
            const isWarn = evt.severity === "warning";
            const silenceUntil = silencedUntilMap[evt.id] || 0;
            const isSilenced = silenceUntil > Date.now();
            const isResolved = !!evt.resolvedAt;

            const targetServer = evt.serverName || "集群节点";

            return (
              <Card
                key={evt.id}
                className={`transition-all duration-150 border overflow-hidden ${
                  isResolved
                    ? "border-border/60 bg-muted/20 opacity-80 hover:opacity-100"
                    : isCrit
                    ? "border-rose-500/40 bg-rose-500/5 shadow-2xs hover:border-rose-500/60"
                    : isWarn
                    ? "border-amber-500/40 bg-amber-500/5 shadow-2xs hover:border-amber-500/60"
                    : "border-cyan-500/40 bg-cyan-500/5 hover:border-cyan-500/60"
                }`}
              >
                <div className="px-3.5 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                  {/* Left: Info & Badges */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="shrink-0">
                      {isResolved ? (
                        <div className="size-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                          <CheckCircle2 className="size-4" />
                        </div>
                      ) : isCrit ? (
                        <div className="size-7 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 animate-pulse flex items-center justify-center">
                          <ShieldAlert className="size-4" />
                        </div>
                      ) : isWarn ? (
                        <div className="size-7 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                          <AlertTriangle className="size-4" />
                        </div>
                      ) : (
                        <div className="size-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                          <Info className="size-4" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-0.5 min-w-0 flex-1">
                      {/* Line 1: 规则名称 + 级别 + 状态 + 触发时间 */}
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className="font-bold text-foreground font-mono truncate max-w-[240px]" title={evt.ruleName}>
                          {evt.ruleName}
                        </span>

                        <Badge
                          variant={isCrit ? "danger" : isWarn ? "warning" : "info"}
                          dot
                          className="text-[10px] px-1.5 py-0 font-mono shrink-0"
                        >
                          {evt.severity.toUpperCase()}
                        </Badge>

                        {isResolved ? (
                          <Badge variant="success" className="text-[10px] px-1.5 py-0 font-mono shrink-0">
                            已恢复
                          </Badge>
                        ) : isSilenced ? (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/40 text-amber-400 bg-amber-500/10 font-mono shrink-0">
                            已静默
                          </Badge>
                        ) : (
                          <Badge variant="danger" className="text-[10px] px-1.5 py-0 animate-pulse font-mono shrink-0">
                            触发中
                          </Badge>
                        )}

                        <span className="text-[11px] text-muted-foreground/60 font-mono ml-auto hidden sm:inline-flex items-center gap-1 shrink-0">
                          <Clock className="size-2.5" />
                          {new Date(evt.triggeredAt).toLocaleString("zh-CN", { hour12: false })}
                        </span>
                      </div>

                      {/* Line 2: 主机 + Message (单行截断) */}
                      <div className="text-[11px] text-muted-foreground font-mono flex items-center gap-1.5 truncate">
                        <span className="text-foreground font-semibold shrink-0">
                          {evt.serverName || "全网节点"}
                        </span>
                        <span className="text-muted-foreground/40 shrink-0">·</span>
                        <span className="truncate max-w-[360px] md:max-w-[500px] lg:max-w-[680px]" title={evt.message}>
                          {evt.message}
                        </span>
                        {typeof evt.value === "number" && (
                          <span className="font-bold text-foreground shrink-0 font-mono text-[10px] bg-muted/60 px-1 py-0.2 rounded border border-border/40 ml-1">
                            峰值: {Math.round(evt.value * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedIncident(evt)}
                      className="h-6.5 px-2 text-[11px] font-mono text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-border/50 hover:border-border cursor-pointer transition-all gap-1"
                      title="查看事件完整诊断报告"
                    >
                      <Eye className="size-3 text-muted-foreground/70" />
                      详情
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopyIncidentPayload(evt)}
                      className="h-6.5 w-6.5 p-0 text-muted-foreground hover:text-foreground cursor-pointer border border-border/40 hover:border-border"
                      title="复制排查报文"
                    >
                      <Copy className="size-3" />
                    </Button>

                    {!isResolved && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenSilenceDialog(evt)}
                        className={`h-6.5 px-2 text-[11px] font-mono cursor-pointer border border-border/50 hover:border-border ${
                          isSilenced ? "border-amber-500/50 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Volume2 className="size-3 mr-1 text-muted-foreground/70" />
                        {isSilenced ? "取消静默" : "静默"}
                      </Button>
                    )}

                    <Link
                      to="/admin/infrastructure/servers/$serverId"
                      params={{ serverId: targetServer }}
                    >
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-6.5 px-2.5 text-[11px] font-mono cursor-pointer hover:border-primary/50 gap-1"
                      >
                        排查节点
                        <ExternalLink className="size-2.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })
        )}

        {/* 分页控制栏 */}
        {filteredEvents.length > 0 && (
          <div className="pt-2.5 border-t border-border/60 flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>共 <strong>{filteredEvents.length}</strong> 条事件</span>
              <span>·</span>
              <span>第 <strong>{page}</strong> / {totalPages} 页</span>
              <span>·</span>
              <div className="flex items-center gap-1">
                <span>每页:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-muted/40 border border-border/80 rounded px-1.5 py-0.5 outline-none font-semibold text-foreground cursor-pointer"
                >
                  <option value={5}>5 条</option>
                  <option value={10}>10 条</option>
                  <option value={20}>20 条</option>
                  <option value={50}>50 条</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-7 px-2 text-xs gap-1 cursor-pointer"
              >
                <ChevronLeft className="size-3" /> 上一页
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-7 px-2 text-xs gap-1 cursor-pointer"
              >
                下一页 <ChevronRight className="size-3" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 设定静默时长弹窗 */}
      <SilenceDialog
        open={!!silenceTarget}
        onOpenChange={(open) => !open && setSilenceTarget(null)}
        title={silenceTarget?.name || ""}
        targetName={silenceTarget?.targetName}
        onConfirm={handleConfirmSilence}
      />

      {/* 告警事件全量详细诊断弹窗 */}
      <Dialog
        open={!!selectedIncident}
        onOpenChange={(open) => !open && setSelectedIncident(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  selectedIncident?.severity === "critical"
                    ? "danger"
                    : selectedIncident?.severity === "warning"
                    ? "warning"
                    : "info"
                }
                dot
                className="text-xs px-2 py-0.5 font-mono"
              >
                {selectedIncident?.severity === "critical"
                  ? "P0 严重告警"
                  : selectedIncident?.severity === "warning"
                  ? "P1 警告"
                  : "Info 提示"}
              </Badge>
              <DialogTitle className="text-sm font-bold text-foreground truncate max-w-[320px]">
                {selectedIncident?.ruleName}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs font-mono">
              事件流水编号: {selectedIncident?.id} · 规则 ID: {selectedIncident?.ruleId}
            </DialogDescription>
          </DialogHeader>

          {selectedIncident && (
            <div className="space-y-3 py-1 text-xs font-mono">
              {/* 关键属性网格 */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-muted/40 border border-border/70">
                <div>
                  <div className="text-muted-foreground text-[10px]">关联节点</div>
                  <div className="font-semibold text-foreground mt-0.5 truncate">
                    {selectedIncident.serverName || "全集群节点"} ({selectedIncident.serverId || "-"})
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[10px]">当前状态</div>
                  <div className="mt-0.5">
                    {selectedIncident.resolvedAt ? (
                      <span className="text-emerald-400 font-bold">✓ 已恢复正常</span>
                    ) : (
                      <span className="text-red-400 font-bold animate-pulse">● 正在持续告警中</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[10px]">触发时间戳</div>
                  <div className="text-foreground mt-0.5">
                    {new Date(selectedIncident.triggeredAt).toLocaleString("zh-CN", { hour12: false })}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[10px]">恢复时间戳</div>
                  <div className="text-foreground mt-0.5">
                    {selectedIncident.resolvedAt
                      ? new Date(selectedIncident.resolvedAt).toLocaleString("zh-CN", { hour12: false })
                      : "持续告警触发中 (未恢复)"}
                  </div>
                </div>
                {typeof selectedIncident.value === "number" && (
                  <div className="col-span-2 pt-1 border-t border-border/40 flex items-center justify-between">
                    <span className="text-muted-foreground text-[10px]">触发时监控采样值</span>
                    <span className="font-bold text-primary text-xs">
                      {Math.round(selectedIncident.value * 100)}% ({selectedIncident.value})
                    </span>
                  </div>
                )}
              </div>

              {/* 详细诊断与判定内容 */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-foreground flex items-center justify-between">
                  <span>完整排查说明与诊断建议</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedIncident.message);
                      toast.success("已复制诊断说明");
                    }}
                    className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="size-3" />
                    复制文本
                  </button>
                </div>
                <div className="p-3 rounded-lg border border-border/80 bg-background text-[11px] leading-relaxed text-foreground whitespace-pre-wrap select-text">
                  {selectedIncident.message}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-between sm:justify-between gap-2 pt-2">
            <div>
              {selectedIncident && !selectedIncident.resolvedAt && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const inc = selectedIncident;
                    setSelectedIncident(null);
                    handleOpenSilenceDialog(inc);
                  }}
                  className="h-8 text-xs gap-1.5 border-border/70 hover:border-border cursor-pointer font-mono"
                >
                  <Volume2 className="size-3.5 text-muted-foreground" />
                  设置静默勿扰
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (selectedIncident) {
                    navigator.clipboard.writeText(JSON.stringify(selectedIncident, null, 2));
                    toast.success("已复制事件 JSON");
                  }
                }}
                className="h-8 text-xs gap-1.5 cursor-pointer font-mono"
              >
                <Copy className="size-3" />
                复制 JSON
              </Button>
              <Button
                size="sm"
                onClick={() => setSelectedIncident(null)}
                className="h-8 text-xs px-4 cursor-pointer font-mono font-bold"
              >
                关闭
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

