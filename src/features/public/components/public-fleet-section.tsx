import { PublicNodeCard } from "@/features/public/components/public-node-card";
import type { MonitorNode } from "@/shared/domain/node";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

type PublicFleetSectionProps = {
  nodes: readonly MonitorNode[];
  onNodeClick: (node: MonitorNode) => void;
};

export function PublicFleetSection({ nodes, onNodeClick }: PublicFleetSectionProps) {
  return (
    <section>
      <Card tone="strong">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>节点快读</CardTitle>
              <CardDescription>
                按 Komari 式公开面板组织：访客先看到区域、在线状态和资源压力，后台细节仍留在管理端。
              </CardDescription>
            </div>
            <div className="rounded-full border border-white/50 px-3 py-1 text-xs font-medium text-muted-foreground dark:border-white/10">
              Public Fleet
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {nodes.map((node) => (
            <PublicNodeCard key={node.id} node={node} onNodeClick={onNodeClick} />
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
