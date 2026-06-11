import { GaugeIcon, ShieldCheckIcon, TriangleAlertIcon } from "lucide-react";

import { ColorPaletteCard } from "@/features/settings/components/color-palette-card";
import { FeatureDesignCard } from "@/features/settings/components/feature-design-card";
import { RuntimeConfigCard } from "@/features/settings/components/runtime-config-card";
import { SecurityDesignCard } from "@/features/settings/components/security-design-card";
import { SettingLimitsCard } from "@/features/settings/components/setting-limits-card";
import { ThemeModeCard } from "@/features/settings/components/theme-mode-card";
import { securityDesignItems } from "@/features/settings/model/design-catalog";
import { BarChart } from "@/shared/charts/bar-chart";
import { DonutChart } from "@/shared/charts/donut-chart";
import { HorizontalBarChart } from "@/shared/charts/horizontal-bar-chart";
import { SegmentedBar } from "@/shared/charts/segmented-bar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/shared/ui/card";
import { PageHeader } from "@/shared/ui/page-header";

const securityCoverage = [
  { label: "认证", value: 92 },
  { label: "传输", value: 88 },
  { label: "上传", value: 76 },
  { label: "审计", value: 84 },
  { label: "Agent", value: 81 },
  { label: "WSS", value: 86 },
  { label: "Token", value: 78 }
];

const riskSegments = [
  { label: "核心", value: 4, color: "var(--chart-1)" },
  { label: "高风险", value: 4, color: "var(--chart-3)" },
  { label: "治理", value: 3, color: "var(--chart-2)" },
  { label: "部署", value: 2, color: "var(--chart-4)" }
];

const limitRiskBars = [
  { label: "主题上传", value: 78 },
  { label: "远程执行", value: 92 },
  { label: "Ping 外联", value: 84 },
  { label: "通知 Webhook", value: 74 },
  { label: "Agent 注册", value: 88 },
  { label: "Token Scope", value: 82 },
  { label: "插件 Worker", value: 80 }
];

export function SettingsPage() {
  const hardenedItems = securityDesignItems.filter((item) => item.badgeVariant === "success").length;
  const hardeningPercent = Math.round((hardenedItems / securityDesignItems.length) * 100);

  return (
    <>
      <PageHeader
        eyebrow="Governance Surface"
        title="系统设置"
        description="把运行时配置、主题模式、限制项和治理边界组织成系统控制中心，而不是继续展示组件目录。"
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <RuntimeConfigCard />
        <ThemeModeCard />
      </div>
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
              detail={`${hardenedItems}/${securityDesignItems.length} 项为核心策略`}
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
            <BarChart
              data={securityCoverage}
              label="安全配置成熟度"
              color="var(--chart-2)"
              height={150}
            />
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
            <HorizontalBarChart
              data={limitRiskBars}
              label="限制项风险分布"
              color="var(--chart-4)"
            />
          </CardContent>
        </Card>
      </div>
      <SettingLimitsCard />
      <FeatureDesignCard />
      <SecurityDesignCard />
      <ColorPaletteCard />
    </>
  );
}
