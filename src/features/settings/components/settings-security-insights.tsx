import { GaugeIcon, ShieldCheckIcon, TriangleAlertIcon } from "lucide-react";

import {
  createSecurityInsightSummary,
  limitRiskBars,
  riskSegments,
  securityCoverage
} from "@/features/settings/model/security-insights";
import { BarChart } from "@/shared/charts/bar-chart";
import { DonutChart } from "@/shared/charts/donut-chart";
import { HorizontalBarChart } from "@/shared/charts/horizontal-bar-chart";
import { SegmentedBar } from "@/shared/charts/segmented-bar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

export function SettingsSecurityInsights() {
  const { hardenedItems, totalItems, hardeningPercent } = createSecurityInsightSummary();

  return (
    <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
      <Card tone="strong">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>安全覆盖率</CardTitle>
              <CardDescription>已固化为核心策略的安全项占比。</CardDescription>
            </div>
            <ShieldCheckIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </div>
        </CardHeader>
        <CardContent>
          <DonutChart
            value={hardeningPercent}
            label="安全配置覆盖率"
            detail={`${hardenedItems}/${totalItems} 项为核心策略`}
            color="var(--chart-1)"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>配置成熟度</CardTitle>
              <CardDescription>认证、传输、上传、审计、WSS 和细粒度 Token 的配置完整度。</CardDescription>
            </div>
            <GaugeIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </div>
        </CardHeader>
        <CardContent>
          <BarChart data={securityCoverage} label="安全配置成熟度" color="var(--chart-2)" height={150} />
        </CardContent>
      </Card>

      <Card tone="muted">
        <CardHeader>
          <CardTitle>安全项分层</CardTitle>
          <CardDescription>核心、高风险、治理和部署类安全项占比。</CardDescription>
        </CardHeader>
        <CardContent>
          <SegmentedBar segments={riskSegments} label="安全项风险分层" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>限制项风险</CardTitle>
              <CardDescription>必须在设置页明确参数化的高风险能力，包括远程执行、Token Scope 和插件 Worker。</CardDescription>
            </div>
            <TriangleAlertIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </div>
        </CardHeader>
        <CardContent>
          <HorizontalBarChart data={limitRiskBars} label="限制项风险分布" color="var(--chart-4)" />
        </CardContent>
      </Card>
    </div>
  );
}
