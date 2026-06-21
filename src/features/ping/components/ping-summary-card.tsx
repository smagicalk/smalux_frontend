import { formatLatency, formatPercent } from "@/shared/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { MetricPill } from "@/shared/ui/metric-pill";

type PingSummary = {
  total: number;
  enabled: number;
  degraded: number;
  down: number;
  availability: number;
  latency: number;
};

type PingSummaryCardProps = {
  summary: PingSummary;
};

export function PingSummaryCard({ summary }: PingSummaryCardProps) {
  return (
    <Card tone="muted">
      <CardHeader>
        <CardTitle>摘要</CardTitle>
        <CardDescription>只保留当前窗口必要摘要。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        <MetricPill label="启用目标" value={`${summary.enabled}/${summary.total}`} />
        <MetricPill label="平均可用率" value={formatPercent(summary.availability)} />
        <MetricPill label="平均延迟" value={formatLatency(summary.latency)} />
        <MetricPill label="异常目标" value={`${summary.degraded + summary.down}`} />
      </CardContent>
    </Card>
  );
}
