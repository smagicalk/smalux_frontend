import { KeyRoundIcon, PlugZapIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

const headlessBoundaries = [
  ["Dashboard", "可单独静态部署，只消费运行时配置"],
  ["Master", "主控 API / WS / RPC 可被 Nginx 或 Rust 服务承载"],
  ["WSS Only", "远程主控连接必须走 TLS 与 Origin 校验"],
  ["Token Scope", "主控接入 Token 需要细粒度权限和到期策略"]
] as const;

export function DeploymentBoundaryPanel() {
  return (
    <Card tone="strong">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Headless 交付边界</CardTitle>
            <CardDescription>对齐 NodeGet 的前后端分离思路：Dashboard 可以独立部署，主控通过 HTTPS/WSS 暴露受控入口。</CardDescription>
          </div>
          <PlugZapIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {headlessBoundaries.map(([label, value]) => (
          <div key={label} className="rounded-[1rem] bg-[color:var(--surface-muted)] p-3 dark:bg-white/6">
            <div className="flex items-center gap-2">
              <KeyRoundIcon className="size-4 text-muted-foreground" aria-hidden />
              <p className="text-sm font-semibold tracking-[-0.02em]">{label}</p>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
