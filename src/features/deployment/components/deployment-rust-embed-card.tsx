import { GlobeIcon } from "lucide-react";

import { rustEmbedNotes } from "@/features/deployment/model/deployment-insights";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

export function DeploymentRustEmbedCard() {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Rust 内置重点</CardTitle>
        <CardDescription>单二进制交付时，前端运行时配置仍然必须可替换，不能因为 embed 进程序就失去环境切换能力。</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {rustEmbedNotes.map((item) => (
          <div key={item} className="flex min-w-0 gap-3 rounded-[1.15rem] bg-[color:var(--surface-muted)] p-3 text-sm dark:bg-white/6">
            <GlobeIcon className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
            <span className="min-w-0">{item}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
