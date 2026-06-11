import type { MonitorNode } from "@/shared/domain/node";
import { formatLatency, formatMbps } from "@/shared/lib/format";
import { MiniTrendChart } from "@/shared/charts/mini-trend-chart";
import { toast } from "sonner";
import { InteractiveCardButton } from "@/shared/ui/card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/shared/ui/card";
import { MetricPill } from "@/shared/ui/metric-pill";
import { PercentBar } from "@/shared/ui/percent-bar";
import { StatusBadge } from "@/shared/ui/status-badge";

const trendValues = [18, 24, 32, 28, 42, 39, 52, 49, 61, 58, 64, 71];

type NodeHealthGridProps = {
  nodes: MonitorNode[];
};

export function NodeHealthGrid({ nodes }: NodeHealthGridProps) {
  return (
    <Card tone="muted">
      <CardHeader>
        <CardTitle>节点速览</CardTitle>
        <CardDescription>这里不再把每个节点做成大卡片，而是压缩成更像探针面板的紧凑列表。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {nodes.map((node) => (
          <InteractiveCardButton
            key={node.id}
            tone="muted"
            padding="sm"
            className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_160px_180px_220px]"
            onClick={() =>
              toast.info(node.name, {
                description: `${node.group} · ${node.region} · CPU ${node.cpu}% / MEM ${node.memory}% / DISK ${node.disk}%`
              })
            }
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold tracking-[-0.02em]">{node.name}</p>
                <StatusBadge status={node.status} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {node.group} · {node.region}
              </p>
            </div>
            <div className="min-w-0">
              <MiniTrendChart
                values={trendValues.map((value) => value + node.cpu / 10)}
                label={`${node.name} CPU 趋势`}
              />
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              <PercentBar label="CPU" value={node.cpu} />
              <PercentBar label="内存" value={node.memory} />
              <PercentBar label="磁盘" value={node.disk} />
            </div>
            <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
              <MetricPill label="入站" value={formatMbps(node.networkInMbps)} />
              <MetricPill label="出站" value={formatMbps(node.networkOutMbps)} />
              <MetricPill label="延迟" value={formatLatency(node.latencyMs)} />
            </div>
          </InteractiveCardButton>
        ))}
      </CardContent>
    </Card>
  );
}
