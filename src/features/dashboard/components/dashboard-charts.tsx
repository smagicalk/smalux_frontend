import {
  availabilityTrend,
  eventDistribution,
  resourceSeries,
  trafficSeries
} from "@/features/dashboard/model/mock-metrics";
import { AreaTrendChart } from "@/shared/charts/area-trend-chart";
import { BarChart } from "@/shared/charts/bar-chart";
import { DonutChart } from "@/shared/charts/donut-chart";
import { MultiLineChart } from "@/shared/charts/multi-line-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";

export function DashboardCharts() {
  const latestAvailability = availabilityTrend.at(-1) ?? 0;

  return (
    <div className="grid gap-2 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,0.55fr)]">
      <Card tone="strong">
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>资源趋势</CardTitle>
            <CardDescription>主时间序列，优先用于扫热点和波动。</CardDescription>
          </div>
          <Badge variant="outline">12</Badge>
        </CardHeader>
        <CardContent>
          <MultiLineChart label="资源趋势" series={resourceSeries} />
        </CardContent>
      </Card>

      <Card tone="muted">
        <CardHeader>
          <CardTitle>可用率</CardTitle>
          <CardDescription>当前聚合窗口。</CardDescription>
        </CardHeader>
        <CardContent>
          <DonutChart
            value={latestAvailability}
            label="聚合可用率"
            detail="按启用监测目标计算"
            color="var(--chart-1)"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>吞吐走势</CardTitle>
          <CardDescription>边缘 / 核心波峰。</CardDescription>
        </CardHeader>
        <CardContent>
          <AreaTrendChart
            values={trafficSeries}
            label="总流量趋势"
            color="var(--chart-2)"
            height={132}
          />
        </CardContent>
      </Card>

      <Card tone="muted">
        <CardHeader>
          <CardTitle>事件分布</CardTitle>
          <CardDescription>噪声来源。</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart data={eventDistribution} label="事件分布" height={132} />
        </CardContent>
      </Card>
    </div>
  );
}
