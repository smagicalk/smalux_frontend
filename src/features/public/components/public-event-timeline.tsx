import type { NotificationEvent } from "@/features/notifications/model/mock-notifications";
import { ShieldCheckIcon } from "lucide-react";

import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, InteractiveCardButton } from "@/shared/ui/card";

type PublicEventTimelineProps = {
  events: readonly NotificationEvent[];
  onEventClick: (event: NotificationEvent, index: number) => void;
};

export function PublicEventTimeline({ events, onEventClick }: PublicEventTimelineProps) {
  return (
    <section>
      <Card tone="strong">
        <CardHeader>
          <CardTitle>事件时间线</CardTitle>
          <CardDescription>仅展示对外可读的状态变化和恢复进度。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {events.map((event, index) => (
            <InteractiveCardButton
              key={event.id}
              tone="muted"
              padding="md"
              className="grid gap-3 text-left md:grid-cols-[140px_minmax(0,1fr)_120px]"
              onClick={() => onEventClick(event, index)}
            >
              <div className="text-sm text-muted-foreground">
                {index === 0 ? "刚刚" : index === 1 ? "23 分钟前" : "1 小时前"}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon className="size-4 text-muted-foreground" aria-hidden />
                  <p className="truncate font-semibold tracking-[-0.02em]">{event.title}</p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{event.detail}</p>
              </div>
              <Badge
                variant={
                  event.status === "sent"
                    ? "success"
                    : event.status === "failed"
                      ? "danger"
                      : "secondary"
                }
              >
                {event.status === "sent"
                  ? "已通知"
                  : event.status === "failed"
                    ? "处理中"
                    : "已静默"}
              </Badge>
            </InteractiveCardButton>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
