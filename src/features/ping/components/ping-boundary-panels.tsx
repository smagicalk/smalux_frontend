import { pingProtocolHealth, pingTargetGroups } from "@/features/ping/model/ping-display";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

export function PingBoundaryPanels() {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader>
          <CardTitle>目标组与展示范围</CardTitle>
          <CardDescription>Ping 目标需要先分组，再决定监测协议、告警策略和是否允许出现在公开状态页。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {pingTargetGroups.map(([name, description, exposure]) => (
            <div
              key={name}
              className="rounded-[1rem] border border-white/45 bg-[color:var(--surface-muted)] p-3 dark:border-white/8 dark:bg-white/6"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{name}</p>
                <Badge variant={exposure === "可展示" ? "success" : exposure === "默认拒绝" ? "danger" : "outline"}>
                  {exposure}
                </Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card tone="muted">
        <CardHeader>
          <CardTitle>协议健康</CardTitle>
          <CardDescription>不只测 ping，还要测控制面通道。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          {pingProtocolHealth.map(([protocol, description]) => (
            <div key={protocol} className="flex items-center justify-between gap-3 rounded-xl bg-white/65 p-3 dark:bg-white/6">
              <span className="font-mono text-sm font-semibold">{protocol}</span>
              <span className="min-w-0 text-right text-xs text-muted-foreground">{description}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
