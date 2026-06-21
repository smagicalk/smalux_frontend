import { pingStatusMeta } from "@/features/ping/model/ping-display";
import type { PingCheck } from "@/features/ping/model/mock-ping";
import { formatLatency, formatPercent } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, InteractiveCardButton } from "@/shared/ui/card";
import { PercentBar } from "@/shared/ui/percent-bar";

type PingTargetsPanelProps = {
  checks: readonly PingCheck[];
  onInspect: (check: PingCheck) => void;
};

export function PingTargetsPanel({ checks, onInspect }: PingTargetsPanelProps) {
  return (
    <Card tone="strong">
      <CardHeader>
        <CardTitle>监测目标</CardTitle>
        <CardDescription>这是主操作面。先扫状态、区域、参数和可用率，再决定是否查看趋势和边界信息。</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {checks.length > 0 ? (
          checks.map((check) => (
            <InteractiveCardButton
              key={check.id}
              tone="muted"
              padding="sm"
              className="grid gap-3 text-left lg:grid-cols-[minmax(0,1.45fr)_100px_100px_100px_130px]"
              onClick={() => onInspect(check)}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold tracking-[-0.02em]">{check.name}</p>
                  <Badge variant={pingStatusMeta[check.status].variant}>
                    {pingStatusMeta[check.status].label}
                  </Badge>
                  <Badge variant="outline">{check.protocol}</Badge>
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">{check.target}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {check.region} · {check.intervalSec}s · retry {check.retries}
                </p>
              </div>
              <PingTargetMetric label="延迟" value={formatLatency(check.latencyMs)} />
              <PingTargetMetric label="丢包" value={formatPercent(check.lossPercent)} />
              <PingTargetMetric label="超时" value={`${check.timeoutMs} ms`} />
              <PercentBar label="可用率" value={check.availability} />
            </InteractiveCardButton>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-border/80 bg-white/45 p-4 text-sm text-muted-foreground dark:bg-white/6">
            当前筛选没有命中任何监测目标。
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type PingTargetMetricProps = {
  label: string;
  value: string;
};

function PingTargetMetric({ label, value }: PingTargetMetricProps) {
  return (
    <div className="min-w-0 rounded-[0.9rem] bg-white/70 p-3 transition hover:bg-white/85 dark:bg-white/6 dark:hover:bg-white/8">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold tracking-[-0.02em]">{value}</p>
    </div>
  );
}
