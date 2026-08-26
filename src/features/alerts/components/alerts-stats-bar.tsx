import { ShieldAlert, AlertTriangle, Sliders, CheckCircle2, VolumeX, Send } from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";
import type { AlertHistory, AlertRule, NotificationChannel, NotificationEvent } from "@/shared/api/methods";

interface AlertsStatsBarProps {
  rules: AlertRule[];
  history: AlertHistory[];
  channels: NotificationChannel[];
  events: NotificationEvent[];
}

export function AlertsStatsBar({ rules, history, channels, events }: AlertsStatsBarProps) {
  // 1. 未决告警（resolvedAt 为空）
  const activeIncidents = history.filter((h) => !h.resolvedAt);
  const criticalCount = activeIncidents.filter((h) => h.severity === "critical").length;
  const warningCount = activeIncidents.filter((h) => h.severity === "warning").length;

  // 2. 规则统计
  const enabledRules = rules.filter((r) => r.enabled).length;
  const silencedRules = rules.filter((r) => r.silenced).length;

  // 3. 今日历史触发总数
  const total24hEvents = history.length;
  const resolvedCount = history.filter((h) => !!h.resolvedAt).length;

  // 4. 渠道与送达率
  const activeChannels = channels.filter((c) => c.enabled).length;
  const okEvents = events.filter((e) => e.ok).length;
  const deliveryRate = events.length > 0 ? Math.round((okEvents / events.length) * 100) : 100;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. 未决告警态势 */}
      <Card className="relative overflow-hidden border-border/80 bg-card/60 backdrop-blur-md shadow-xs">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">当前未决告警事件</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold font-mono ${activeIncidents.length > 0 ? "text-rose-500" : "text-emerald-500"}`}>
                {activeIncidents.length}
              </span>
              <span className="text-xs text-muted-foreground">
                {activeIncidents.length > 0 ? `(${criticalCount} 严重 · ${warningCount} 警告)` : "运行平稳"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground/80 flex items-center gap-1 font-mono">
              {activeIncidents.length > 0 ? (
                <span className="text-rose-400 font-semibold">🚨 需值班人员介入响应</span>
              ) : (
                <span className="text-emerald-400 font-semibold">✓ 全网节点指标健康</span>
              )}
            </p>
          </div>
          <div className={`p-3 rounded-xl border ${activeIncidents.length > 0 ? "bg-rose-500/10 border-rose-500/30 text-rose-500" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"}`}>
            <ShieldAlert className="size-5" />
          </div>
        </CardContent>
      </Card>

      {/* 2. 24h 告警事件处理 */}
      <Card className="relative overflow-hidden border-border/80 bg-card/60 backdrop-blur-md shadow-xs">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">24h 告警触发与闭环</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-foreground">{total24hEvents}</span>
              <span className="text-xs text-emerald-500 font-mono">已恢复 {resolvedCount} 起</span>
            </div>
            <p className="text-[11px] text-muted-foreground/80 font-mono">
              闭环恢复率 {total24hEvents > 0 ? Math.round((resolvedCount / total24hEvents) * 100) : 100}%
            </p>
          </div>
          <div className="p-3 rounded-xl border bg-amber-500/10 border-amber-500/30 text-amber-500">
            <AlertTriangle className="size-5" />
          </div>
        </CardContent>
      </Card>

      {/* 3. 告警规则布防 */}
      <Card className="relative overflow-hidden border-border/80 bg-card/60 backdrop-blur-md shadow-xs">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">布防告警策略规则</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-primary">{enabledRules}</span>
              <span className="text-xs text-muted-foreground">/ {rules.length} 条已启用</span>
            </div>
            <p className="text-[11px] text-muted-foreground/80 flex items-center gap-1 font-mono">
              {silencedRules > 0 ? (
                <span className="text-amber-400 flex items-center gap-1">
                  <VolumeX className="size-3" /> {silencedRules} 条规则处于临时静默
                </span>
              ) : (
                <span className="text-muted-foreground">全部规则处于全天候守护</span>
              )}
            </p>
          </div>
          <div className="p-3 rounded-xl border bg-primary/10 border-primary/30 text-primary">
            <Sliders className="size-5" />
          </div>
        </CardContent>
      </Card>

      {/* 4. 通知网关可用率 */}
      <Card className="relative overflow-hidden border-border/80 bg-card/60 backdrop-blur-md shadow-xs">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">通知渠道与投递率</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-cyan-400">{deliveryRate}%</span>
              <span className="text-xs text-muted-foreground font-mono">{activeChannels} 渠道在线</span>
            </div>
            <p className="text-[11px] text-muted-foreground/80 font-mono">
              过去 24h 成功推送 {okEvents} / {events.length || okEvents} 次
            </p>
          </div>
          <div className="p-3 rounded-xl border bg-cyan-500/10 border-cyan-500/30 text-cyan-400">
            <Send className="size-5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
