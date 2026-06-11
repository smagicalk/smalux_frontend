import { ChartColumnIcon, GlobeIcon, RouteIcon } from "lucide-react";

import { BarChart } from "@/shared/charts/bar-chart";
import { HorizontalBarChart } from "@/shared/charts/horizontal-bar-chart";
import { MultiLineChart } from "@/shared/charts/multi-line-chart";
import { SegmentedBar } from "@/shared/charts/segmented-bar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

type ChartDatum = {
  label: string;
  value: number;
};

type DeploymentSeries = {
  name: string;
  color: string;
  values: readonly number[];
};

type DeploymentInsightsPanelProps = {
  deploymentScoreSeries: readonly DeploymentSeries[];
  runtimeSegments: readonly { label: string; value: number; color: string }[];
  deliveryEffortBars: readonly ChartDatum[];
  cachePolicyBars: readonly ChartDatum[];
};

export function DeploymentInsightsPanel({
  deploymentScoreSeries,
  runtimeSegments,
  deliveryEffortBars,
  cachePolicyBars
}: DeploymentInsightsPanelProps) {
  return (
    <>
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card tone="strong" className="min-w-0">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>部署方式对比</CardTitle>
                <CardDescription>性能、缓存、代理能力、单二进制交付和运维复杂度的相对权衡。</CardDescription>
              </div>
              <ChartColumnIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </div>
          </CardHeader>
          <CardContent>
            <MultiLineChart
              label="部署方式能力对比"
              series={deploymentScoreSeries.map((series) => ({
                ...series,
                values: [...series.values]
              }))}
            />
          </CardContent>
        </Card>

        <div className="grid min-w-0 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>交付状态</CardTitle>
              <CardDescription>三种部署模式当前的就绪度，不把“规划中”误写成已支持。</CardDescription>
            </CardHeader>
            <CardContent>
              <SegmentedBar segments={[...runtimeSegments]} label="部署交付状态" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>实施复杂度</CardTitle>
              <CardDescription>配置、代理、缓存和运行时注入的相对成本。</CardDescription>
            </CardHeader>
            <CardContent>
              <HorizontalBarChart
                data={[...deliveryEffortBars]}
                label="部署实施复杂度"
                color="var(--chart-4)"
              />
            </CardContent>
          </Card>
        </div>

        <Card className="min-w-0">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>缓存窗口</CardTitle>
                <CardDescription>资源类别的推荐缓存天数，入口文件和配置文件必须始终保持可更新。</CardDescription>
              </div>
              <RouteIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </div>
          </CardHeader>
          <CardContent>
            <BarChart
              data={[...cachePolicyBars]}
              label="部署缓存策略"
              color="var(--chart-1)"
              height={150}
            />
          </CardContent>
        </Card>

        <Card tone="muted" className="min-w-0">
          <CardHeader>
            <CardTitle>运行时注入边界</CardTitle>
            <CardDescription>
              同一份前端产物必须依赖部署配置切换 HTTP、WS 和 JSON-RPC 入口，不能把环境差异写死在源码里。
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            {[
              ["静态部署", "public/app-config.json 由静态服务直接托管"],
              ["Nginx", "config 短缓存，/api 与 /ws 反向代理"],
              ["Rust 内置", "环境变量或配置文件生成 app-config 响应"]
            ].map(([label, value]) => (
              <div key={label} className="grid gap-1 rounded-[1rem] bg-white/70 p-3 dark:bg-white/6">
                <p className="font-semibold tracking-[-0.02em]">{label}</p>
                <p className="text-muted-foreground">{value}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Nginx 代理重点</CardTitle>
            <CardDescription>
              前端只依赖运行时配置，不在源码里硬编码后端地址。Nginx 的价值在于把静态交付和协议转发粘在一起。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="max-w-full overflow-x-auto whitespace-pre rounded-[1.15rem] bg-[color:var(--surface-muted)] p-4 text-xs leading-relaxed dark:bg-white/6">
{`location / {
  try_files $uri $uri/ /index.html;
}

location /api/ {
  proxy_pass http://smalux-backend;
}

location /ws {
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
}`}
            </pre>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Rust 内置重点</CardTitle>
            <CardDescription>单二进制交付时，前端运行时配置仍然必须可替换，不能因为 embed 进程序就失去环境切换能力。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {[
              "将 dist/assets 使用长缓存，index.html 和 app-config.json 使用短缓存",
              "支持从环境变量或配置文件注入 public/app-config.json",
              "后台与公开主题使用不同 Cookie 与 CSP 策略",
              "WebSocket 路径需要在 Rust 路由层明确升级处理"
            ].map((item) => (
              <div key={item} className="flex min-w-0 gap-3 rounded-[1.15rem] bg-[color:var(--surface-muted)] p-3 text-sm dark:bg-white/6">
                <GlobeIcon className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
                <span className="min-w-0">{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
