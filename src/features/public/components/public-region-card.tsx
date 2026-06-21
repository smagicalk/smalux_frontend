import type { MonitorNode } from "@/shared/domain/node";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, InteractiveCardButton } from "@/shared/ui/card";
import { StatusBadge } from "@/shared/ui/status-badge";

type PublicRegionCardProps = {
  regions: readonly MonitorNode[];
  onRegionClick: (node: MonitorNode) => void;
};

export function PublicRegionCard({ regions, onRegionClick }: PublicRegionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>服务器区域</CardTitle>
        <CardDescription>公开展示只保留区域和健康状态。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {regions.map((node) => (
          <InteractiveCardButton
            key={node.id}
            tone="muted"
            padding="sm"
            className="flex items-center justify-between gap-3 text-left"
            onClick={() => onRegionClick(node)}
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-[-0.02em]">{node.region}</p>
              <p className="truncate text-xs text-muted-foreground">{node.group}</p>
            </div>
            <StatusBadge status={node.status} />
          </InteractiveCardButton>
        ))}
      </CardContent>
    </Card>
  );
}
