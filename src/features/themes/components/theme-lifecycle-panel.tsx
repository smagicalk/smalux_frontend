import { FileArchiveIcon, PaletteIcon } from "lucide-react";

import { AreaTrendChart } from "@/shared/charts/area-trend-chart";
import { SegmentedBar } from "@/shared/charts/segmented-bar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

type ThemeLifecyclePanelProps = {
  statusSegments: readonly { label: string; value: number; color: string }[];
  uploadTrend: readonly number[];
};

export function ThemeLifecyclePanel({ statusSegments, uploadTrend }: ThemeLifecyclePanelProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card tone="strong">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>主题生命周期</CardTitle>
              <CardDescription>启用、预览和草稿不是美术状态，而是交付状态。</CardDescription>
            </div>
            <PaletteIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </div>
        </CardHeader>
        <CardContent>
          <SegmentedBar segments={[...statusSegments]} label="主题生命周期分布" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>上传趋势</CardTitle>
              <CardDescription>最近窗口内主题包上传与替换频率，帮助判断运营修改强度。</CardDescription>
            </div>
            <FileArchiveIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </div>
        </CardHeader>
        <CardContent>
          <AreaTrendChart
            values={[...uploadTrend]}
            label="主题上传趋势"
            color="var(--chart-2)"
            height={136}
          />
        </CardContent>
      </Card>
    </div>
  );
}
