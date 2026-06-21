import type { PingCheck } from "@/features/ping/model/mock-ping";
import { PublicServiceStatus } from "@/features/public/components/public-service-status";
import { formatLatency, formatPercent } from "@/shared/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, InteractiveCardButton } from "@/shared/ui/card";

type PublicServiceListProps = {
  checks: readonly PingCheck[];
  onServiceClick: (check: PingCheck) => void;
};

export function PublicServiceList({ checks, onServiceClick }: PublicServiceListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>服务状态</CardTitle>
        <CardDescription>按访客可理解的服务维度展示，而不是后台字段或节点术语。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {checks.map((check) => (
          <InteractiveCardButton
            key={check.id}
            tone="muted"
            padding="md"
            className="grid gap-3 text-left sm:grid-cols-[minmax(0,1fr)_120px_120px]"
            onClick={() => onServiceClick(check)}
          >
            <div className="min-w-0">
              <p className="truncate font-semibold tracking-[-0.02em]">{check.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {check.protocol} · {check.region}
              </p>
            </div>
            <PublicServiceStatus status={check.status} />
            <div className="text-sm text-muted-foreground">
              <p>{formatLatency(check.latencyMs)}</p>
              <p>{formatPercent(check.availability)}</p>
            </div>
          </InteractiveCardButton>
        ))}
      </CardContent>
    </Card>
  );
}
