import {
  pingAvailabilityBars,
  pingLatencySeries,
  pingLossTrend
} from "@/features/ping/model/mock-ping-metrics";
import { AreaTrendChart } from "@/shared/charts/area-trend-chart";
import { BarChart } from "@/shared/charts/bar-chart";
import { MultiLineChart } from "@/shared/charts/multi-line-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { MetricPill } from "@/shared/ui/metric-pill";

export function PingChartsPanel() {
  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
      <Card tone="strong">
        <CardHeader>
          <CardTitle>延迟趋势</CardTitle>
          <CardDescription>主链路视图。</CardDescription>
        </CardHeader>
        <CardContent>
          <MultiLineChart label="Ping 延迟趋势" series={pingLatencySeries} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>可用率对比</CardTitle>
          <CardDescription>识别短板入口。</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart
            data={pingAvailabilityBars}
            label="Ping 可用率对比"
            color="var(--chart-1)"
            baseline={90}
            height={140}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>丢包走势</CardTitle>
          <CardDescription>判断抖动 / 断裂。</CardDescription>
        </CardHeader>
        <CardContent>
          <AreaTrendChart
            values={pingLossTrend}
            label="Ping 丢包趋势"
            color="var(--chart-4)"
            height={132}
          />
        </CardContent>
      </Card>

      <Card tone="muted">
        <CardHeader>
          <CardTitle>探测边界</CardTitle>
          <CardDescription>外联策略提示。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          <MetricPill label="目标校验" value="服务端审核" />
          <MetricPill label="最小间隔" value="15 秒" />
          <MetricPill label="私网限制" value="默认拒绝" />
          <MetricPill label="API/WSS" value="后台可见" />
          <MetricPill label="公开展示" value="白名单" />
        </CardContent>
      </Card>
    </div>
  );
}
