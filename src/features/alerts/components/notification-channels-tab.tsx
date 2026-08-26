import { useState } from "react";
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
  Layers
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Switch } from "@/shared/ui/switch";
import { toast } from "@/shared/ui/toaster";
import { useToggleChannel, useDeleteChannel, useTestChannel } from "../hooks/use-notifications";
import type { NotificationChannel, NotificationEvent } from "@/shared/api/methods";

interface NotificationChannelsTabProps {
  channels: NotificationChannel[];
  events: NotificationEvent[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onOpenCreate: () => void;
}

export function NotificationChannelsTab({
  channels,
  events,
  isLoading,
  onRefresh,
  onOpenCreate
}: NotificationChannelsTabProps) {
  const toggleMutation = useToggleChannel();
  const deleteMutation = useDeleteChannel();
  const testMutation = useTestChannel();

  const [testingId, setTestingId] = useState<string | null>(null);

  const handleToggleEnable = async (channel: NotificationChannel) => {
    const nextState = !channel.enabled;
    try {
      await toggleMutation.mutateAsync({ id: channel.id, enabled: nextState });
      toast.success(`推送渠道「${channel.name}」已${nextState ? "开启" : "暂停"}`);
    } catch (err: any) {
      toast.error(err?.message || "切换渠道状态失败");
    }
  };

  const handleDeleteChannel = async (channel: NotificationChannel) => {
    if (!window.confirm(`确定要删除推送渠道「${channel.name}」吗？`)) return;
    try {
      await deleteMutation.mutateAsync(channel.id);
      toast.success(`推送渠道「${channel.name}」已成功移除`);
    } catch (err: any) {
      toast.error(err?.message || "删除推送渠道失败");
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
      {/* 顶部工具栏 */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20 p-2.5 rounded-xl border border-border/80">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">
            已配置 <strong>{channels.length}</strong> 个外发推送渠道 · 活跃 <strong>{channels.filter((c) => c.enabled).length}</strong> 个
          </span>
        </div>

        <div className="flex items-center gap-2">
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
        ) : (
          channels.map((chan) => {
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
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-2 rounded-xl bg-muted/60 border border-border/70 shrink-0">
                        {getChannelIcon(chan.type)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-foreground truncate text-xs" title={chan.name}>
                          {chan.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          {chan.type}
                        </div>
                      </div>
                    </div>

                    <Switch
                      checked={chan.enabled}
                      onCheckedChange={() => handleToggleEnable(chan)}
                      aria-label={`启用 ${chan.name}`}
                    />
                  </div>

                  {/* Endpoint Preview */}
                  <div className="space-y-1.5">
                    <div className="p-2 rounded-lg bg-muted/40 border border-border/50 text-[11px] text-muted-foreground break-all truncate font-mono">
                      {chan.type === "webhook" && <span className="text-cyan-400 font-bold mr-1">[POST]</span>}
                      {chan.endpoint}
                    </div>

                    {(chan.headers || chan.template) && (
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                        {chan.headers && (
                          <span className="px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30 font-mono">
                            🔒 已配置 Header 鉴权
                          </span>
                        )}
                        {chan.template && (
                          <span className="px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border/60 font-mono">
                            📦 自定义消息/Body参数
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Delivery Status & Actions */}
                  <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground border-t border-border/40">
                    <div className="flex items-center gap-1.5">
                      {chan.lastOk !== false ? (
                        <span className="flex items-center gap-1 text-emerald-500 font-medium">
                          <CheckCircle2 className="size-3" /> 送达正常
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
                        {isTesting ? "测试中..." : "测试连通"}
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

      {/* 近期通知投递流水 */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold text-foreground flex items-center gap-1.5">
            <Clock className="size-3.5 text-muted-foreground" />
            <span>近期通知外发投递日志流水 (Delivery Log)</span>
          </h3>
          <span className="text-[10px] text-muted-foreground font-mono">
            保留最近 {events.length} 条发送记录
          </span>
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
                ) : (
                  events.map((evt) => (
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
        </div>
      </div>
    </div>
  );
}
