import type { MonitorNode } from "@/shared/domain/node";
import { NodeMobileCards } from "@/features/nodes/components/node-mobile-cards";
import { NodesTable } from "@/features/nodes/components/nodes-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/shared/ui/card";

type NodesListProps = {
  nodes: MonitorNode[];
  onInspect: (node: MonitorNode) => void;
};

export function NodesList({ nodes, onInspect }: NodesListProps) {
  if (nodes.length === 0) {
    return (
      <Card tone="muted">
        <CardHeader>
          <CardTitle>没有匹配节点</CardTitle>
          <CardDescription>调整搜索、状态或分组筛选后再查看节点列表。</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-dashed border-border/80 bg-white/45 p-4 text-sm text-muted-foreground dark:bg-white/6">
            当前筛选没有命中任何 mock 节点。
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <NodeMobileCards nodes={nodes} onInspect={onInspect} />
      <div className="hidden md:block">
        <NodesTable nodes={nodes} onInspect={onInspect} />
      </div>
    </>
  );
}
