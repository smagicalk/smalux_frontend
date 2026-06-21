import { runtimeInjectionItems } from "@/features/deployment/model/deployment-insights";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

export function DeploymentRuntimeInjectionCard() {
  return (
    <Card tone="muted" className="min-w-0">
      <CardHeader>
        <CardTitle>运行时注入边界</CardTitle>
        <CardDescription>
          同一份前端产物必须依赖部署配置切换 HTTP、WS 和 JSON-RPC 入口，不能把环境差异写死在源码里。
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        {runtimeInjectionItems.map(([label, value]) => (
          <div key={label} className="grid gap-1 rounded-[1rem] bg-white/70 p-3 dark:bg-white/6">
            <p className="font-semibold tracking-[-0.02em]">{label}</p>
            <p className="text-muted-foreground">{value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
