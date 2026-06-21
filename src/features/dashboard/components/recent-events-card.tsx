import { toast } from "sonner";

import type { LogEntry } from "@/features/logs/model/mock-logs";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, InteractiveCardButton } from "@/shared/ui/card";

type RecentEventsCardProps = {
  logs: readonly LogEntry[];
};

export function RecentEventsCard({ logs }: RecentEventsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>最近事件</CardTitle>
        <CardDescription>按时间顺序快速扫最近动态，而不是做成大卡片说明区。</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        {logs.slice(0, 4).map((log) => (
          <InteractiveCardButton
            key={log.id}
            tone="muted"
            padding="sm"
            onClick={() =>
              toast.info(log.action, {
                description: `${log.kind} · ${log.result} · ${log.detail}`
              })
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={log.result === "failed" ? "danger" : "outline"}>{log.kind}</Badge>
              <span className="truncate text-sm font-semibold tracking-[-0.02em]">{log.action}</span>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">{log.detail}</p>
          </InteractiveCardButton>
        ))}
      </CardContent>
    </Card>
  );
}
