import { BarChart } from "@/shared/charts/bar-chart";
import { HorizontalBarChart } from "@/shared/charts/horizontal-bar-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

type ChartDatum = {
  label: string;
  value: number;
};

type ThemeGovernanceChartsProps = {
  packageLimitBars: readonly ChartDatum[];
  configTypeBars: readonly ChartDatum[];
};

export function ThemeGovernanceCharts({
  packageLimitBars,
  configTypeBars
}: ThemeGovernanceChartsProps) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>上传限制</CardTitle>
          <CardDescription>按限制项展示当前配置上限，让主题治理可量化。</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart data={[...packageLimitBars]} label="主题上传限制" color="var(--chart-3)" height={140} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>参数类型</CardTitle>
          <CardDescription>主题 manifest 参数按类型聚合，帮助判断当前主题系统是否过度复杂。</CardDescription>
        </CardHeader>
        <CardContent>
          <HorizontalBarChart data={[...configTypeBars]} label="主题参数类型分布" color="var(--chart-1)" />
        </CardContent>
      </Card>
    </div>
  );
}
