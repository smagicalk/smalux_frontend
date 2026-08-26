import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  VolumeX,
  Search,
  ExternalLink,
  RotateCw,
  Clock,
  Copy,
  Terminal,
  Activity,
  Sparkles
} from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { toast } from "@/shared/ui/toaster";
import { SilenceDialog } from "./silence-dialog";
import type { AlertHistory } from "@/shared/api/methods";

interface AlertIncidentsTabProps {
  history: AlertHistory[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function AlertIncidentsTab({ history, isLoading, onRefresh }: AlertIncidentsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "firing" | "resolved">("all");
  const [severityFilter, setSeverityFilter] = useState<"all" | "critical" | "warning" | "info">("all");

  // 静默状态映射 (截止时间戳)
  const [silencedUntilMap, setSilencedUntilMap] = useState<Record<string, number>>({});
  const [silenceTarget, setSilenceTarget] = useState<{ id: string; name: string; targetName?: string } | null>(null);

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
    <div className="space-y-4 font-mono">
      {/* 搜索与筛选工具栏 */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20 p-2.5 rounded-xl border border-border/80">
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
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 select-none ${
                statusFilter === tab.key
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                statusFilter === tab.key
                  ? "bg-primary-foreground/20 text-primary-foreground font-bold"
                  : tab.highlight
                  ? "bg-rose-500/20 text-rose-400 font-bold"
                  : "bg-muted text-muted-foreground"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* 搜索框与右侧操作 */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索规则、主机或告警内容..."
              className="w-full h-8 pl-8 pr-3 rounded-lg border border-border/80 bg-background/80 text-xs font-mono text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary"
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

      {/* 告警事件列表卡片流 */}
      <div className="space-y-3">
        {filteredEvents.length === 0 ? (
          <Card className="border-border/80 bg-card/40 backdrop-blur-md">
            <CardContent className="p-16 flex flex-col items-center justify-center text-center font-mono gap-2">
              <CheckCircle2 className="size-8 text-emerald-500/70 mb-1" />
              <span className="font-semibold text-foreground text-sm">全网暂无匹配的告警事件</span>
              <span className="text-xs text-muted-foreground">当前筛选条件下所有指标运行平稳，无未决故障</span>
            </CardContent>
          </Card>
        ) : (
          filteredEvents.map((evt) => {
            const isCrit = evt.severity === "critical";
            const isWarn = evt.severity === "warning";
            const silenceUntil = silencedUntilMap[evt.id] || 0;
            const isSilenced = silenceUntil > Date.now();
            const isResolved = !!evt.resolvedAt;

            const targetServer = evt.serverName || "集群节点";

            return (
              <Card
                key={evt.id}
                className={`transition-all duration-200 border overflow-hidden ${
                  isResolved
                    ? "border-border/60 bg-muted/20 opacity-80"
                    : isCrit
                    ? "border-rose-500/50 bg-rose-500/5 shadow-xs"
                    : isWarn
                    ? "border-amber-500/50 bg-amber-500/5 shadow-xs"
                    : "border-cyan-500/50 bg-cyan-500/5"
                }`}
              >
                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Info & Badges */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className="mt-0.5 shrink-0">
                      {isResolved ? (
                        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                          <CheckCircle2 className="size-5" />
                        </div>
                      ) : isCrit ? (
                        <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 animate-pulse">
                          <ShieldAlert className="size-5" />
                        </div>
                      ) : isWarn ? (
                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                          <AlertTriangle className="size-5" />
                        </div>
                      ) : (
                        <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                          <Info className="size-5" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-foreground text-sm font-mono truncate">
                          {evt.ruleName}
                        </span>

                        <Badge
                          variant={isCrit ? "danger" : isWarn ? "warning" : "info"}
                          className="font-mono text-[10px]"
                        >
                          {isCrit ? "P0 紧急" : isWarn ? "P1 警告" : "Info 提示"}
                        </Badge>

                        {isResolved ? (
                          <Badge variant="success" className="font-mono text-[10px]">
                            已自动恢复
                          </Badge>
                        ) : (
                          <Badge variant="danger" className="font-mono text-[10px] animate-pulse">
                            🚨 持续报警中
                          </Badge>
                        )}

                        {isSilenced && (
                          <Badge variant="outline" className="font-mono text-[10px] text-amber-400 border-amber-500/40 bg-amber-500/10">
                            <VolumeX className="size-2.5 mr-1" />
                            静默中 (至 {new Date(silenceUntil).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground font-mono leading-relaxed break-words">
                        {evt.message}
                      </p>

                      {/* 节点与时间元信息 */}
                      <div className="flex items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground font-mono flex-wrap">
                        <span className="flex items-center gap-1 text-foreground/90 font-medium">
                          🖥️ 主机: <strong>{targetServer}</strong>
                          {evt.serverId && <span className="text-muted-foreground text-[10px]">({evt.serverId})</span>}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="size-3 text-muted-foreground/70" />
                          触发于: {new Date(evt.triggeredAt).toLocaleString("zh-CN", { hour12: false })}
                        </span>
                        {evt.resolvedAt && (
                          <span className="text-emerald-500 flex items-center gap-1">
                            ✓ 恢复于: {new Date(evt.resolvedAt).toLocaleString("zh-CN", { hour12: false })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: 极简个人操作按钮 (复制 + 静默 + 排查) */}
                  <div className="flex items-center gap-1.5 self-end md:self-center shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border/40 w-full md:w-auto justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopyIncidentPayload(evt)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                      title="复制排查报文"
                    >
                      <Copy className="size-3.5" />
                    </Button>

                    {!isResolved && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenSilenceDialog(evt)}
                        className={`h-7 px-2.5 text-xs font-mono cursor-pointer ${
                          isSilenced ? "border-amber-500/50 text-amber-400 bg-amber-500/10" : ""
                        }`}
                      >
                        <VolumeX className="size-3 mr-1 text-muted-foreground" />
                        {isSilenced ? "取消静默" : "设定静默"}
                      </Button>
                    )}

                    <Link
                      to="/admin/infrastructure/servers/$serverId"
                      params={{ serverId: targetServer }}
                    >
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 px-3 text-xs font-mono cursor-pointer hover:border-primary/50"
                      >
                        排查节点
                        <ExternalLink className="size-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })
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
    </div>
  );
}
