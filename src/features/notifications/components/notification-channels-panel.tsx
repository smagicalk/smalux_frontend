import type { NotificationChannel } from "@/features/notifications/model/mock-notifications";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, InteractiveCardButton } from "@/shared/ui/card";
import { MetricPill } from "@/shared/ui/metric-pill";

type NotificationChannelsPanelProps = {
  channels: readonly NotificationChannel[];
  onInspect: (channel: NotificationChannel) => void;
};

export function NotificationChannelsPanel({ channels, onInspect }: NotificationChannelsPanelProps) {
  return (
    <Card tone="strong">
      <CardHeader>
        <CardTitle>渠道</CardTitle>
        <CardDescription>渠道是路由终点，不是孤立配置项。要同时看启停状态、密钥状态和它承载的事件类型。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {channels.length > 0 ? (
          channels.map((channel) => (
            <InteractiveCardButton
              key={channel.id}
              tone="muted"
              padding="md"
              className="text-left"
              onClick={() => onInspect(channel)}
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
  );
}
