import type { MonitorNode } from "@/shared/domain/node";
import { formatLatency, formatMbps } from "@/shared/lib/format";
import { toast } from "sonner";
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

type NodeMobileCardsProps = {
  nodes: MonitorNode[];
};

export function NodeMobileCards({ nodes }: NodeMobileCardsProps) {
  return (
    <div className="flex flex-col gap-4 md:hidden">
      {nodes.map((node) => (
        <Card
          key={node.id}
          tone="strong"
          className="cursor-pointer transition hover:-translate-y-0.5"
          onClick={() =>
            toast.info(node.name, {
              description: `${node.group} · ${node.region} · ${node.status}`
            })
          }
        >
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="truncate">{node.name}</CardTitle>
              <CardDescription>
                {node.group} · {node.region}
              </CardDescription>
            </div>
            <StatusBadge status={node.status} />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3">
              <PercentBar label="CPU" value={node.cpu} />
              <PercentBar label="内存" value={node.memory} />
              <PercentBar label="磁盘" value={node.disk} />
            </div>
            <div className="grid gap-2 text-sm text-muted-foreground">
              <MetricPill label="入站" value={formatMbps(node.networkInMbps)} />
              <MetricPill label="出站" value={formatMbps(node.networkOutMbps)} />
              <MetricPill label="延迟" value={formatLatency(node.latencyMs)} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
