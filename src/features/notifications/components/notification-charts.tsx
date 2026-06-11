import { notificationChannelBars, notificationDeliveryTrend, notificationSeveritySegments } from "@/features/notifications/model/mock-notification-metrics";
import { HorizontalBarChart } from "@/shared/charts/horizontal-bar-chart";
import { MultiLineChart } from "@/shared/charts/multi-line-chart";
import { SegmentedBar } from "@/shared/charts/segmented-bar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/shared/ui/card";

export function NotificationCharts() {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Card>
        <CardHeader>
          <CardTitle>发送趋势</CardTitle>
          <CardDescription>已发送、失败和静默事件的最近窗口趋势。</CardDescription>
        </CardHeader>
        <CardContent>
          <MultiLineChart label="通知发送趋势" series={notificationDeliveryTrend} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>路由分布</CardTitle>
          <CardDescription>渠道负载和告警级别占比。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <SegmentedBar segments={notificationSeveritySegments} label="通知级别分布" />
          <HorizontalBarChart
            data={notificationChannelBars}
            label="通知渠道分布"
            color="var(--chart-2)"
          />
        </CardContent>
      </Card>
    </div>
  );
}
