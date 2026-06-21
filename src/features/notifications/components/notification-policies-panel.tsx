import { notificationSeverityMeta } from "@/features/notifications/model/notification-display";
import type { AlertPolicy } from "@/features/notifications/model/mock-notifications";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, InteractiveCardButton } from "@/shared/ui/card";

type NotificationPoliciesPanelProps = {
  policies: readonly AlertPolicy[];
  onInspect: (policy: AlertPolicy) => void;
};

export function NotificationPoliciesPanel({ policies, onInspect }: NotificationPoliciesPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>告警策略</CardTitle>
        <CardDescription>策略连接监控事件与通知渠道，静默窗口只是对它的临时覆盖，而不是替代。</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {policies.map((policy) => (
          <InteractiveCardButton
            key={policy.id}
            tone="muted"
            padding="md"
            className="text-left"
            onClick={() => onInspect(policy)}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={notificationSeverityMeta[policy.severity].variant}>
                {notificationSeverityMeta[policy.severity].label}
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
  );
}
