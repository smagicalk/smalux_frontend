import { useState } from "react";
import {
  BellRing,
  AlertTriangle,
  Sliders,
  Send,
  Plus,
  CheckCircle2,
  VolumeX,
  ShieldAlert
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Switch } from "@/shared/ui/switch";
import { PageHeader } from "@/shared/ui/page-header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { toast } from "@/shared/ui/toaster";

interface Incident {
  id: string;
  title: string;
  target: string;
  severity: "critical" | "warning" | "info";
  status: "firing" | "acknowledged" | "resolved";
  startedAt: string;
  resolvedAt?: string;
  details: string;
}

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: string;
  duration: string;
  severity: "critical" | "warning" | "info";
  enabled: boolean;
  channels: string[];
}

interface Channel {
  id: string;
  name: string;
  type: "Webhook" | "Feishu" | "DingTalk" | "Telegram" | "Email";
  endpoint: string;
  enabled: boolean;
  successRate: string;
}

export function AlertsPage() {
  const [activeTab, setActiveTab] = useState<"incidents" | "rules" | "channels">("incidents");
  const [channelDialogOpen, setChannelDialogOpen] = useState(false);
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);

  const [newRule, setNewRule] = useState<{
    name: string;
    metric: string;
    condition: string;
    duration: string;
    severity: "critical" | "warning" | "info";
    channel: string;
  }>({
    name: "",
    metric: "host.cpu.usage",
    condition: ">= 90%",
    duration: "持续 5 分钟",
    severity: "critical",
    channel: "运维应急飞书群 Bot"
  });

  // Incidents
  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: "inc-101",
      title: "主机内存占用超过 85% 预警阈值 (当前 92%)",
      target: "sg-app-worker-02",
      severity: "warning",
      status: "firing",
      startedAt: "10 分钟前",
      details: "sg-app-worker-02 连续 5 分钟物理内存超过 85%，触发预警规则。"
    },
    {
      id: "inc-102",
      title: "探针 HTTP 延迟恢复至正常水位 (24ms)",
      target: "api.smalux.com",
      severity: "info",
      status: "resolved",
      startedAt: "45 分钟前",
      resolvedAt: "25 分钟前",
      details: "全网探测节点 HTTP Ping 延迟已平稳回落至 < 50ms。"
    },
    {
      id: "inc-103",
      title: "主机 Agent 离线失联超过 2 分钟",
      target: "us-west-backup-node",
      severity: "critical",
      status: "resolved",
      startedAt: "昨天 14:20",
      resolvedAt: "昨天 14:24",
      details: "节点网络发生瞬断，4 分钟后自动恢复握手。"
    }
  ]);

  // Alert Rules
  const [rules, setRules] = useState<AlertRule[]>([
    {
      id: "rule-1",
      name: "主机 CPU 持续超载告警",
      metric: "host.cpu.usage",
      condition: ">= 90%",
      duration: "持续 5 分钟",
      severity: "critical",
      enabled: true,
      channels: ["运维群飞书 Bot", "全局紧急 Webhook"]
    },
    {
      id: "rule-2",
      name: "主机内存占用过高预警",
      metric: "host.memory.usage",
      condition: ">= 85%",
      duration: "持续 3 分钟",
      severity: "warning",
      enabled: true,
      channels: ["运维群飞书 Bot"]
    },
    {
      id: "rule-3",
      name: "主机心跳失联离线告警",
      metric: "agent.heartbeat.lost",
      condition: ">= 120 秒",
      duration: "立即",
      severity: "critical",
      enabled: true,
      channels: ["全局紧急 Webhook", "Telegram 报警频道"]
    },
    {
      id: "rule-4",
      name: "服务探针 HTTP 状态码异常 / 探测超时",
      metric: "probe.http.status",
      condition: "!= 200 或 > 3000ms",
      duration: "连续 3 次",
      severity: "warning",
      enabled: true,
      channels: ["运维群飞书 Bot"]
    }
  ]);

  // Notification Channels
  const [channels, setChannels] = useState<Channel[]>([
    {
      id: "ch-1",
      name: "运维应急飞书群 Bot",
      type: "Feishu",
      endpoint: "https://open.feishu.cn/open-apis/bot/v2/hook/8f***",
      enabled: true,
      successRate: "99.8%"
    },
    {
      id: "ch-2",
      name: "全局告警中央 Webhook",
      type: "Webhook",
      endpoint: "https://ops-alert.internal.corp/events",
      enabled: true,
      successRate: "100.0%"
    },
    {
      id: "ch-3",
      name: "Telegram 核心群通知",
      type: "Telegram",
      endpoint: "Bot ID: 68912**** (Chat: -100412)",
      enabled: true,
      successRate: "98.4%"
    },
    {
      id: "ch-4",
      name: "管理员值班邮箱通知",
      type: "Email",
      endpoint: "ops-duty@smalux.com (SMTP SSL)",
      enabled: false,
      successRate: "95.2%"
    }
  ]);

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
    toast.success("告警规则状态已更新");
  };

  const acknowledgeIncident = (id: string) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: "acknowledged" } : inc))
    );
    toast.success("已确认并知悉该告警事件");
  };

  const testChannel = (name: string) => {
    toast.success(`已向 [${name}] 发送测试告警通知，投递成功！`);
  };

  const handleCreateRule = () => {
    if (!newRule.name) {
      toast.error("请输入告警规则名称");
      return;
    }
    const r: AlertRule = {
      id: `rule-${Date.now()}`,
      name: newRule.name,
      metric: newRule.metric,
      condition: newRule.condition,
      duration: newRule.duration,
      severity: newRule.severity,
      enabled: true,
      channels: [newRule.channel]
    };
    setRules([...rules, r]);
    setRuleDialogOpen(false);
    toast.success("新告警规则已创建并生效");
  };

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="告警中心"
        subtitle="活跃告警事件、阈值触发规则与多渠道推送通知"
        action={
          <div className="flex items-center gap-2">
            {activeTab === "rules" ? (
              <Button size="sm" onClick={() => setRuleDialogOpen(true)}>
                <Plus className="size-3.5 mr-1" /> 新建告警规则
              </Button>
            ) : (
              <Button size="sm" onClick={() => setChannelDialogOpen(true)}>
                <Plus className="size-3.5 mr-1" /> 添加通知渠道
              </Button>
            )}
          </div>
        }
      />

      <div className="flex-1 space-y-6 p-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-border/80 pb-3">
          <button
            onClick={() => setActiveTab("incidents")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "incidents"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <AlertTriangle className="size-3.5" />
            活跃与历史事件 ({incidents.filter((i) => i.status === "firing").length} 触发中)
          </button>
          <button
            onClick={() => setActiveTab("rules")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "rules"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Sliders className="size-3.5" />
            告警规则 ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab("channels")}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "channels"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <BellRing className="size-3.5" />
            通知渠道 ({channels.length})
          </button>
        </div>

        {/* Tab 1: Incidents Stream */}
        {activeTab === "incidents" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">告警事件流水线</CardTitle>
              <CardDescription>当前触发中的未恢复事件及近期恢复记录</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border/60">
                {incidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            inc.severity === "critical"
                              ? "danger"
                              : inc.severity === "warning"
                              ? "warning"
                              : "info"
                          }
                          dot
                        >
                          {inc.severity === "critical"
                            ? "严重"
                            : inc.severity === "warning"
                            ? "警告"
                            : "提示"}
                        </Badge>
                        <span className="text-xs font-semibold text-foreground">{inc.title}</span>
                        {inc.status === "firing" ? (
                          <span className="rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 px-1.5 py-0.5 text-[10px] font-medium">
                            触发中
                          </span>
                        ) : (
                          <span className="rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium">
                            已恢复
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        目标: <span className="font-mono text-foreground">{inc.target}</span> · 触发时间: {inc.startedAt}
                        {inc.resolvedAt && ` · 恢复于: ${inc.resolvedAt}`}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {inc.status === "firing" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => acknowledgeIncident(inc.id)}
                          >
                            <CheckCircle2 className="size-3 mr-1 text-emerald-500" /> 确认知悉
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 text-xs"
                            onClick={() => toast.success("已静默该规则告警 1 小时")}
                          >
                            <VolumeX className="size-3 mr-1" /> 静默 1h
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab 2: Alert Rules */}
        {activeTab === "rules" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">告警触发规则</CardTitle>
                <CardDescription>配置指标聚合阈值与满足条件时的自动告警触发策略</CardDescription>
              </div>
              <Button size="sm" onClick={() => setRuleDialogOpen(true)}>
                <Plus className="size-3.5 mr-1" /> 新建规则
              </Button>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border/60">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">{rule.name}</span>
                        <Badge
                          variant={rule.severity === "critical" ? "danger" : "warning"}
                        >
                          {rule.severity === "critical" ? "严重" : "警告"}
                        </Badge>
                      </div>
                      <div className="text-[11px] font-mono text-muted-foreground">
                        指标: {rule.metric} · 阈值: {rule.condition} · 条件: {rule.duration}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground pt-0.5">
                        <span>通知通道:</span>
                        {rule.channels.map((ch, i) => (
                          <span key={i} className="rounded bg-muted px-1.5 py-0.5 text-foreground">
                            {ch}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => toggleRule(rule.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab 3: Notification Channels */}
        {activeTab === "channels" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {channels.map((ch) => (
              <Card key={ch.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{ch.name}</span>
                      <Badge variant="outline">{ch.type}</Badge>
                    </div>
                  </div>
                  <Switch
                    checked={ch.enabled}
                    onCheckedChange={() => {
                      setChannels((prev) =>
                        prev.map((c) => (c.id === ch.id ? { ...c, enabled: !c.enabled } : c))
                      );
                      toast.success("渠道启用状态已变更");
                    }}
                  />
                </CardHeader>
                <CardContent className="space-y-3 pt-1">
                  <div className="rounded-lg bg-muted/40 p-2 font-mono text-[11px] text-muted-foreground truncate">
                    {ch.endpoint}
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border/60 text-xs">
                    <span className="text-muted-foreground font-mono text-[11px]">
                      投递成功率: <strong className="text-foreground">{ch.successRate}</strong>
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => testChannel(ch.name)}
                    >
                      <Send className="size-3 mr-1" /> 发送测试
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog: Create Alert Rule */}
      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-primary" />
              新建告警触发规则
            </DialogTitle>
            <DialogDescription>
              设置监控指标阈值与触发推送策略
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 pt-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-medium text-foreground">规则名称</label>
              <input
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                placeholder="例如: 生产主机内存过高预警"
                className="w-full h-8.5 rounded-lg border border-border/80 bg-muted/40 px-3 text-xs outline-none focus:border-primary text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">监控指标</label>
              <select
                value={newRule.metric}
                onChange={(e) => setNewRule({ ...newRule, metric: e.target.value })}
                className="w-full h-8.5 rounded-lg border border-border/80 bg-muted/40 px-2 text-xs outline-none focus:border-primary text-foreground"
              >
                <option value="host.cpu.usage">主机 CPU 占用率 (host.cpu.usage)</option>
                <option value="host.memory.usage">主机物理内存占用 (host.memory.usage)</option>
                <option value="agent.heartbeat.lost">Agent 心跳失联 (agent.heartbeat.lost)</option>
                <option value="probe.http.latency">探针 HTTP 延迟 (probe.http.latency)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-medium text-foreground">触发阈值</label>
                <input
                  value={newRule.condition}
                  onChange={(e) => setNewRule({ ...newRule, condition: e.target.value })}
                  placeholder=">= 90%"
                  className="w-full h-8.5 rounded-lg border border-border/80 bg-muted/40 px-3 text-xs font-mono outline-none focus:border-primary text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-medium text-foreground">告警级别</label>
                <select
                  value={newRule.severity}
                  onChange={(e) => setNewRule({ ...newRule, severity: e.target.value as "critical" | "warning" | "info" })}
                  className="w-full h-8.5 rounded-lg border border-border/80 bg-muted/40 px-2 text-xs outline-none focus:border-primary text-foreground"
                >
                  <option value="critical">严重 (Critical)</option>
                  <option value="warning">警告 (Warning)</option>
                  <option value="info">提示 (Info)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
              <Button variant="outline" size="sm" onClick={() => setRuleDialogOpen(false)}>
                取消
              </Button>
              <Button size="sm" onClick={handleCreateRule}>
                确认创建
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Add Channel */}
      <Dialog open={channelDialogOpen} onOpenChange={setChannelDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BellRing className="size-4 text-primary" />
              配置新通知推送渠道
            </DialogTitle>
            <DialogDescription>
              支持飞书、钉钉、Telegram Bot、自定义 Webhook 及 SMTP 邮件服务
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 pt-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-medium text-foreground">渠道名称</label>
              <input
                placeholder="例如: 基础架构运维飞书群"
                className="w-full h-8 rounded-lg border border-border/80 bg-muted/40 px-3 text-xs outline-none focus:border-primary text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">渠道类型</label>
              <select className="w-full h-8 rounded-lg border border-border/80 bg-muted/40 px-2 text-xs outline-none focus:border-primary text-foreground">
                <option value="feishu">飞书自定义机器人 Webhook</option>
                <option value="dingtalk">钉钉群机器人 Webhook</option>
                <option value="telegram">Telegram Bot</option>
                <option value="webhook">通用 JSON Webhook (POST)</option>
                <option value="email">SMTP 邮件通知</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-foreground">Webhook URL / 访问令牌</label>
              <input
                placeholder="https://open.feishu.cn/open-apis/bot/v2/hook/..."
                className="w-full h-8 rounded-lg border border-border/80 bg-muted/40 px-3 text-xs font-mono outline-none focus:border-primary text-foreground"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
              <Button variant="outline" size="sm" onClick={() => setChannelDialogOpen(false)}>
                取消
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setChannelDialogOpen(false);
                  toast.success("通知渠道创建成功");
                }}
              >
                保存渠道
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
