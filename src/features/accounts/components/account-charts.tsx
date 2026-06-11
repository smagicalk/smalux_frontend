import { accountSecuritySegments, roleDistributionBars, sessionTrend } from "@/features/accounts/model/mock-account-metrics";
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

export function AccountCharts() {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <Card>
        <CardHeader>
          <CardTitle>会话趋势</CardTitle>
          <CardDescription>最近窗口的活跃会话数量。</CardDescription>
        </CardHeader>
        <CardContent>
          <AreaTrendChart
            values={sessionTrend}
            label="账户会话趋势"
            color="var(--chart-1)"
            height={140}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>账户安全</CardTitle>
          <CardDescription>MFA、Passkey 和角色覆盖情况。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <SegmentedBar segments={accountSecuritySegments} label="账户安全覆盖" />
          <HorizontalBarChart
            data={roleDistributionBars}
            label="角色分布"
            color="var(--chart-3)"
          />
        </CardContent>
      </Card>
    </div>
  );
}
