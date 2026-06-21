import { nodeRegionPolicies, nodeTokenScopes } from "@/features/nodes/model/node-display";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

export function NodeGovernanceCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Scope 与区域治理</CardTitle>
        <CardDescription>后台应把“能接入什么、能执行什么、能公开展示什么”拆成可审计的权限片段。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-2">
          {nodeTokenScopes.map(([scope, description]) => (
            <div key={scope} className="rounded-xl bg-[color:var(--surface-muted)] p-3">
              <p className="font-mono text-sm font-semibold">{scope}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-2">
          {nodeRegionPolicies.map(([region, group, policy]) => (
            <div
              key={region}
              className="grid gap-2 rounded-xl border border-white/45 bg-white/65 p-3 text-sm sm:grid-cols-[100px_minmax(0,1fr)] dark:border-white/8 dark:bg-white/6"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{region}</p>
                <p className="mt-1 text-xs text-muted-foreground">{group}</p>
              </div>
              <p className="text-muted-foreground">{policy}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
