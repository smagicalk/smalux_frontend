import { executionRiskBars, executionRunsTrend, executionStatusSegments } from "@/features/executions/model/mock-execution-metrics";
import { AreaTrendChart } from "@/shared/charts/area-trend-chart";
import { HorizontalBarChart } from "@/shared/charts/horizontal-bar-chart";
import { SegmentedBar } from "@/shared/charts/segmented-bar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/shared/ui/card";

export function ExecutionCharts() {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Card>
        <CardHeader>
          <CardTitle>执行趋势</CardTitle>
          <CardDescription>最近 12 个窗口的任务下发数量。</CardDescription>
        </CardHeader>
        <CardContent>
          <AreaTrendChart
            values={executionRunsTrend}
            label="远程执行趋势"
            color="var(--chart-1)"
            height={140}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>风险与状态</CardTitle>
          <CardDescription>执行状态占比和命令风险分布。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <SegmentedBar segments={executionStatusSegments} label="执行状态分布" />
          <HorizontalBarChart
            data={executionRiskBars}
            label="执行风险分布"
            color="var(--chart-4)"
          />
        </CardContent>
      </Card>
    </div>
  );
}
