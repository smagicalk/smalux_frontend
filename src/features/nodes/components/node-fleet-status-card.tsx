import { SegmentedBar } from "@/shared/charts/segmented-bar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { MetricPill } from "@/shared/ui/metric-pill";

type NodeFleetStatusCardProps = {
  statusSegments: Array<{ label: string; value: number; color: string }>;
  filteredCount: number;
  totalCount: number;
};

export function NodeFleetStatusCard({
  statusSegments,
  filteredCount,
  totalCount
}: NodeFleetStatusCardProps) {
  return (
    <Card tone="muted">
      <CardHeader>
        <CardTitle>编队状态</CardTitle>
        <CardDescription>只保留和节点扫描最相关的摘要。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <SegmentedBar segments={statusSegments} label="服务器状态分布" />
        <MetricPill label="当前结果" value={`${filteredCount}/${totalCount}`} />
        <MetricPill label="主关注区域" value="Tokyo / Singapore" />
      </CardContent>
    </Card>
  );
}
