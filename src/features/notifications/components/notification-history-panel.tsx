import { notificationEventMeta } from "@/features/notifications/model/notification-display";
import type { NotificationEvent, QuietWindow } from "@/features/notifications/model/mock-notifications";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, InteractiveCardButton } from "@/shared/ui/card";

type NotificationHistoryPanelProps = {
  quietWindows: readonly QuietWindow[];
  events: readonly NotificationEvent[];
  onInspectQuietWindow: (window: QuietWindow) => void;
  onInspectEvent: (event: NotificationEvent) => void;
};

export function NotificationHistoryPanel({
  quietWindows,
  events,
  onInspectQuietWindow,
  onInspectEvent
}: NotificationHistoryPanelProps) {
  return (
    <Card tone="strong">
      <CardHeader>
        <CardTitle>历史与静默</CardTitle>
        <CardDescription>失败通知、测试通知和静默命中原因都必须可追踪，这页同时承担审计入口作用。</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-3">
          {quietWindows.map((window) => (
            <InteractiveCardButton
              key={window.id}
              tone="muted"
              padding="sm"
              className="text-left text-sm"
              onClick={() => onInspectQuietWindow(window)}
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
          {events.map((event) => (
            <InteractiveCardButton
              key={event.id}
              tone="muted"
              padding="sm"
              className="text-left text-sm"
              onClick={() => onInspectEvent(event)}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={notificationEventMeta[event.status].variant}>
                  {notificationEventMeta[event.status].label}
                </Badge>
                <span className="font-semibold tracking-[-0.02em]">{event.title}</span>
              </div>
              <p className="mt-1 text-muted-foreground">{event.channel}</p>
              <p className="mt-1 text-xs text-muted-foreground">{event.detail}</p>
            </InteractiveCardButton>
          ))}
          {events.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 bg-[color:var(--surface-muted)] p-4 text-sm text-muted-foreground">
              当前投递状态没有命中任何历史事件。
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
