import { CheckCircle2Icon, ClipboardIcon, RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";

import { useRuntimeConfig } from "@/app/providers/runtime-config-context";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/shared/ui/card";
import { InteractiveCardButton } from "@/shared/ui/card";

export function RuntimeConfigCard() {
  const runtimeConfig = useRuntimeConfig();
  const serializedConfig = JSON.stringify(runtimeConfig, null, 2);
  const configEntries = Object.entries(runtimeConfig);

  const copyRuntimeConfig = () => {
    void navigator.clipboard.writeText(serializedConfig).then(
      () =>
        toast.success("运行时配置已复制", {
          description: "mock: 可用于检查独立部署、Nginx 和 Rust 内置配置。"
        }),
      () =>
        toast.info("运行时配置预览", {
          description: serializedConfig
        })
    );
  };

  const copyRuntimeEntry = (key: string, value: string) => {
    void navigator.clipboard.writeText(`${key}: ${value}`).then(
      () =>
        toast.success("配置项已复制", {
          description: `${key} · ${value}`
        }),
      () =>
        toast.info("配置项预览", {
          description: `${key} · ${value}`
        })
    );
  };

  return (
    <Card tone="strong">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>运行时配置</CardTitle>
            <CardDescription>三种部署方式共享同一份前端产物，配置在运行时装载而不是写死进构建。</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.success("运行时配置校验通过", {
                  description: `${configEntries.length} 项配置已按 schema 解析。`
                })
              }
            >
              <CheckCircle2Icon data-icon="inline-start" aria-hidden />
              校验
            </Button>
            <Button variant="outline" size="sm" onClick={copyRuntimeConfig}>
              <ClipboardIcon data-icon="inline-start" aria-hidden />
              复制
            </Button>
            <Button
              size="sm"
              onClick={() =>
                toast.info("已模拟重新加载配置", {
                  description: "mock: /app-config.json 使用 no-store 策略重新读取。"
                })
              }
            >
              <RefreshCwIcon data-icon="inline-start" aria-hidden />
              重载
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 text-sm">
          {configEntries.map(([key, value]) => (
            <InteractiveCardButton
              key={key}
              tone="muted"
              padding="sm"
              className="grid gap-1"
              onClick={() => copyRuntimeEntry(key, String(value))}
            >
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {key}
              </dt>
              <dd className="min-w-0 truncate text-sm font-semibold tracking-[-0.02em]">{value}</dd>
            </InteractiveCardButton>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
