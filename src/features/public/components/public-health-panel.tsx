import { AreaTrendChart } from "@/shared/charts/area-trend-chart";
import { PercentBar } from "@/shared/ui/percent-bar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

type UptimeTone = "success" | "warning" | "danger";

type PublicHealthPanelProps = {
  uptimeBars: readonly UptimeTone[];
  apiAvailability: number;
  pageAvailability: number;
  edgeAvailability: number;
  trendValues: readonly number[];
};

const uptimeToneClassName: Record<UptimeTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger"
};

export function PublicHealthPanel({
  uptimeBars,
  apiAvailability,
  pageAvailability,
  edgeAvailability,
  trendValues
}: PublicHealthPanelProps) {
  return (
    <Card tone="strong">
      <CardHeader>
        <CardTitle>最近 14 次检查</CardTitle>
        <CardDescription>公开页只展示聚合状态，不展示敏感地址和后台配置。</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-7 gap-2">
          {uptimeBars.map((tone, index) => (
            <span
              key={`${tone}-${index}`}
              className={["h-12 rounded-xl", uptimeToneClassName[tone]].join(" ")}
              aria-label={`check-${index + 1}-${tone}`}
            />
          ))}
        </div>
        <div className="grid gap-3">
          <PercentBar label="公开 API 可用率" value={apiAvailability} />
          <PercentBar label="状态页可用率" value={pageAvailability} />
          <PercentBar label="边缘入口可用率" value={edgeAvailability} />
        </div>
        <AreaTrendChart
          values={[...trendValues]}
          label="公开可用性趋势"
          color="var(--chart-1)"
          height={80}
        />
      </CardContent>
    </Card>
  );
}
