import { ChartColumnIcon, RouteIcon } from "lucide-react";

import { DeploymentRuntimeInjectionCard } from "@/features/deployment/components/deployment-runtime-injection-card";
import type { DeploymentChartDatum, DeploymentSeries } from "@/features/deployment/model/deployment-insights";
import { BarChart } from "@/shared/charts/bar-chart";
import { HorizontalBarChart } from "@/shared/charts/horizontal-bar-chart";
import { MultiLineChart } from "@/shared/charts/multi-line-chart";
import { SegmentedBar } from "@/shared/charts/segmented-bar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

type DeploymentChartsPanelProps = {
  deploymentScoreSeries: readonly DeploymentSeries[];
  runtimeSegments: readonly { label: string; value: number; color: string }[];
  deliveryEffortBars: readonly DeploymentChartDatum[];
  cachePolicyBars: readonly DeploymentChartDatum[];
};

export function DeploymentChartsPanel({
  deploymentScoreSeries,
  runtimeSegments,
  deliveryEffortBars,
  cachePolicyBars
}: DeploymentChartsPanelProps) {
  return (
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

      <DeploymentRuntimeInjectionCard />
    </div>
  );
}
