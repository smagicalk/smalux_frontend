import { nodeAgentAccessItems } from "@/features/nodes/model/node-display";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

export function NodeAgentBoundaryCard() {
  return (
    <Card tone="strong">
      <CardHeader>
        <CardTitle>Agent 接入边界</CardTitle>
        <CardDescription>节点接入要同时说明通道、Token 生命周期和密钥轮换，否则添加节点会变成不透明的危险入口。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
        {nodeAgentAccessItems.map(([label, value, description]) => (
          <div
            key={label}
            className="rounded-[1rem] border border-white/45 bg-[color:var(--surface-muted)] p-3 dark:border-white/8 dark:bg-white/6"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">{label}</p>
              <Badge variant="outline">{value}</Badge>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
