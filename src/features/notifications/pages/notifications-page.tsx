import {
  BellIcon,
  ClockIcon,
  MailIcon,
  MessageSquareIcon,
  PlusIcon,
  RadioIcon,
  SendIcon,
  ShieldCheckIcon
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  mockAlertPolicies,
  mockNotificationChannels,
  mockNotificationEvents,
  mockQuietWindows,
  type AlertPolicy,
  type NotificationChannelType,
  type NotificationEvent
} from "@/features/notifications/model/mock-notifications";
import { NotificationCharts } from "@/features/notifications/components/notification-charts";
import { Badge, type BadgeVariant } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/shared/ui/card";
import { InteractiveCardButton } from "@/shared/ui/card";
import { Field, Select } from "@/shared/ui/form-controls";
import { MetricPill } from "@/shared/ui/metric-pill";
import { PageHeader } from "@/shared/ui/page-header";
import { StatCard } from "@/shared/ui/stat-card";

const severityMeta: Record<AlertPolicy["severity"], { label: string; variant: BadgeVariant }> = {
  info: { label: "信息", variant: "secondary" },
  warning: { label: "警告", variant: "warning" },
  critical: { label: "严重", variant: "danger" }
};

const eventMeta: Record<NotificationEvent["status"], { label: string; variant: BadgeVariant }> = {
  sent: { label: "已发送", variant: "success" },
  failed: { label: "失败", variant: "danger" },
  suppressed: { label: "已静默", variant: "secondary" }
};

export function NotificationsPage() {
  const [channelTypeFilter, setChannelTypeFilter] = useState<NotificationChannelType | "all">("all");
  const [eventStatusFilter, setEventStatusFilter] = useState<NotificationEvent["status"] | "all">("all");
  const filteredChannels = useMemo(
    () =>
      mockNotificationChannels.filter(
        (channel) => channelTypeFilter === "all" || channel.type === channelTypeFilter
      ),
    [channelTypeFilter]
  );
  const filteredEvents = useMemo(
    () =>
      mockNotificationEvents.filter(
        (event) => eventStatusFilter === "all" || event.status === eventStatusFilter
      ),
    [eventStatusFilter]
  );
  const enabledChannels = mockNotificationChannels.filter((channel) => channel.enabled).length;
  const activePolicies = mockAlertPolicies.filter((policy) => !policy.muted).length;

  return (
    <>
      <PageHeader
        eyebrow="Alert Routing"
        title="通知"
        description="这页的重点不是展示渠道数量，而是把‘事件如何被路由、静默、失败和审计’说清楚。它本质上是告警编排面。"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.success("测试通知已入队", {
                  description: `${enabledChannels} 个启用渠道将收到 mock 测试消息。`
                })
              }
            >
              <SendIcon data-icon="inline-start" aria-hidden />
              测试通知
            </Button>
            <Button
              size="sm"
              onClick={() =>
                toast.info("已创建渠道草稿", {
                  description: "默认密钥状态为 missing，保存前必须加密。"
                })
              }
            >
              <PlusIcon data-icon="inline-start" aria-hidden />
              新建渠道
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="通知渠道"
          value={`${enabledChannels}/${mockNotificationChannels.length}`}
          description="启用渠道与备份渠道的关系决定告警扩散能力。"
          icon={MessageSquareIcon}
          tone="primary"
        />
        <StatCard
          label="告警策略"
          value={`${activePolicies}`}
          description="真正起作用的是当前未静默的策略，而不是配置总数。"
          icon={BellIcon}
          tone="warning"
        />
        <StatCard
          label="静默窗口"
          value={`${mockQuietWindows.length}`}
          description="维护窗口和临时静默都应该被显式记录。"
          icon={ClockIcon}
          tone="info"
        />
        <StatCard
          label="敏感配置"
          value="加密"
          description="Webhook token、SMTP 密码和外联密钥都不能在前端明文暴露。"
          icon={ShieldCheckIcon}
          tone="success"
        />
      </div>

      <NotificationCharts />

      <Card>
        <CardHeader>
          <CardTitle>通知筛选</CardTitle>
          <CardDescription>用于调试不同渠道类型和投递状态，历史列表会按筛选结果更新。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[220px_220px_auto]">
          <Field label="渠道类型">
            <Select
              value={channelTypeFilter}
              onChange={(event) => setChannelTypeFilter(event.target.value as NotificationChannelType | "all")}
            >
              <option value="all">全部渠道</option>
              <option value="Webhook">Webhook</option>
              <option value="Email">Email</option>
              <option value="Telegram">Telegram</option>
              <option value="Discord">Discord</option>
              <option value="WeCom">WeCom</option>
            </Select>
          </Field>
          <Field label="投递状态">
            <Select
              value={eventStatusFilter}
              onChange={(event) => setEventStatusFilter(event.target.value as NotificationEvent["status"] | "all")}
            >
              <option value="all">全部状态</option>
              <option value="sent">已发送</option>
              <option value="failed">失败</option>
              <option value="suppressed">已静默</option>
            </Select>
          </Field>
          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full md:w-auto"
              onClick={() => {
                setChannelTypeFilter("all");
                setEventStatusFilter("all");
              }}
            >
              重置
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card tone="strong">
          <CardHeader>
            <CardTitle>渠道</CardTitle>
            <CardDescription>渠道是路由终点，不是孤立配置项。要同时看启停状态、密钥状态和它承载的事件类型。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {filteredChannels.length > 0 ? (
              filteredChannels.map((channel) => (
                <InteractiveCardButton
                  key={channel.id}
                  tone="muted"
                  padding="md"
                  className="text-left"
                  onClick={() =>
                    toast.info(channel.name, {
                      description: `${channel.type} · ${channel.enabled ? "启用" : "停用"} · ${channel.target}`
                    })
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold tracking-[-0.02em]">{channel.name}</p>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{channel.target}</p>
                    </div>
                    <Badge variant={channel.enabled ? "success" : "secondary"}>
                      {channel.enabled ? "启用" : "停用"}
                    </Badge>
                  </div>
                  <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
                    <MetricPill label="类型" value={channel.type} />
                    <MetricPill label="密钥状态" value={channel.secretStatus === "encrypted" ? "已加密" : "缺少密钥"} />
                  </div>
                </InteractiveCardButton>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border/80 bg-[color:var(--surface-muted)] p-4 text-sm text-muted-foreground md:col-span-2">
                当前筛选没有命中任何通知渠道。
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>通知模板</CardTitle>
            <CardDescription>模板变量可前端预览，但真正渲染和脱敏逻辑必须以后端为准。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <TemplateRow icon={RadioIcon} title="告警触发" value="{{severity}} {{target}} {{message}}" />
            <TemplateRow icon={ShieldCheckIcon} title="恢复通知" value="{{target}} 已恢复，持续 {{duration}}" />
            <TemplateRow icon={MailIcon} title="测试通知" value="smalux 测试消息 / {{channel}}" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>告警策略</CardTitle>
            <CardDescription>策略连接监控事件与通知渠道，静默窗口只是对它的临时覆盖，而不是替代。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {mockAlertPolicies.map((policy) => (
              <InteractiveCardButton
                key={policy.id}
                tone="muted"
                padding="md"
                className="text-left"
                onClick={() =>
                  toast.info(policy.name, {
                    description: `${policy.condition} · ${policy.severity}`
                  })
                }
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={severityMeta[policy.severity].variant}>
                    {severityMeta[policy.severity].label}
                  </Badge>
                  <Badge variant={policy.muted ? "secondary" : "success"}>
                    {policy.muted ? "静默" : "激活"}
                  </Badge>
                </div>
                <p className="mt-3 font-semibold tracking-[-0.02em]">{policy.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{policy.condition}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  渠道：{policy.channels.join(" / ")}
                </p>
              </InteractiveCardButton>
            ))}
          </CardContent>
        </Card>

        <Card tone="strong">
          <CardHeader>
            <CardTitle>历史与静默</CardTitle>
            <CardDescription>失败通知、测试通知和静默命中原因都必须可追踪，这页同时承担审计入口作用。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3">
              {mockQuietWindows.map((window) => (
                <InteractiveCardButton
                  key={window.id}
                  tone="muted"
                  padding="sm"
                  className="text-left text-sm"
                  onClick={() =>
                    toast.info(window.name, {
                      description: `${window.schedule} · ${window.scope}`
                    })
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold tracking-[-0.02em]">{window.name}</span>
                    <Badge variant={window.enabled ? "success" : "secondary"}>
                      {window.enabled ? "启用" : "停用"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {window.schedule} · {window.scope}
                  </p>
                </InteractiveCardButton>
              ))}
            </div>
            <div className="grid gap-3">
              {filteredEvents.map((event) => (
                <InteractiveCardButton
                  key={event.id}
                  tone="muted"
                  padding="sm"
                  className="text-left text-sm"
                  onClick={() =>
                    toast.info(event.title, {
                      description: `${event.channel} · ${event.detail}`
                    })
                  }
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={eventMeta[event.status].variant}>
                      {eventMeta[event.status].label}
                    </Badge>
                    <span className="font-semibold tracking-[-0.02em]">{event.title}</span>
                  </div>
                  <p className="mt-1 text-muted-foreground">{event.channel}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{event.detail}</p>
                </InteractiveCardButton>
              ))}
              {filteredEvents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/80 bg-[color:var(--surface-muted)] p-4 text-sm text-muted-foreground">
                  当前投递状态没有命中任何历史事件。
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

type TemplateRowProps = {
  icon: typeof RadioIcon;
  title: string;
  value: string;
};

function TemplateRow({ icon: Icon, title, value }: TemplateRowProps) {
  return (
    <InteractiveCardButton
      tone="muted"
      padding="sm"
      className="text-left"
      onClick={() =>
        toast.info(title, {
          description: value
        })
      }
    >
      <div className="flex items-center gap-2 font-semibold tracking-[-0.02em]">
        <Icon className="size-4 text-muted-foreground" aria-hidden />
        <span>{title}</span>
      </div>
      <p className="mt-2 rounded-xl bg-white/70 p-2 font-mono text-xs dark:bg-white/6">{value}</p>
    </InteractiveCardButton>
  );
}
