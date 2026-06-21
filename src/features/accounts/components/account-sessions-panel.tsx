import type { ActiveSession } from "@/features/accounts/model/mock-accounts";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, InteractiveCardButton } from "@/shared/ui/card";
import { MetricPill } from "@/shared/ui/metric-pill";

type AccountSessionsPanelProps = {
  sessions: readonly ActiveSession[];
  onInspect: (session: ActiveSession) => void;
};

export function AccountSessionsPanel({ sessions, onInspect }: AccountSessionsPanelProps) {
  return (
    <Card tone="strong">
      <CardHeader>
        <CardTitle>会话</CardTitle>
        <CardDescription>会话视图应该帮助管理员快速判断谁在线、从什么设备接入、是否需要立刻吊销。</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {sessions.map((session) => (
          <InteractiveCardButton
            key={session.id}
            tone="muted"
            padding="md"
            className="text-left"
            onClick={() => onInspect(session)}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={session.current ? "success" : "secondary"}>
                {session.current ? "当前会话" : "活跃"}
              </Badge>
              <span className="font-semibold tracking-[-0.02em]">{session.user}</span>
            </div>
            <div className="mt-3 grid gap-2">
              <MetricPill label="设备" value={session.device} />
              <MetricPill label="IP" value={session.ip} />
            </div>
          </InteractiveCardButton>
        ))}
      </CardContent>
    </Card>
  );
}
