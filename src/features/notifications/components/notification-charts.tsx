import { useMemo, type ReactNode } from "react";

import { EChart, chartPalette, type EChartsOption } from "@/shared/charts/echart";
import { ringProgressOption, stackedBarOption } from "@/shared/charts/chart-options";
import { cn } from "@/shared/lib/utils";

/** Glass panel with a primary-tinted top hairline — wraps a notification chart. */
export function ChartPanel({
  title,
  subtitle,
  className,
  children
}: {
  title: string;
  subtitle?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("glass cornered relative overflow-hidden rounded-md border border-border", className)}>
      <span className="absolute inset-x-0 top-0 h-px opacity-60" style={{ background: "linear-gradient(90deg, transparent, var(--primary), transparent)" }} />
      <div className="flex items-baseline justify-between border-b border-border px-3 py-2">
        <span className="text-sm font-semibold tracking-tight">{title}</span>
        {subtitle ? <span className="text-[11px] text-muted-foreground">{subtitle}</span> : null}
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
}

/** Half-ring: overall notification delivery success rate. */
export function SuccessRing({ rate }: { rate: number }) {
  const palette = chartPalette();
  const color = rate > 0.9 ? palette.success : rate > 0.7 ? palette.warning : palette.danger;
  const option = useMemo<EChartsOption>(
    () => ringProgressOption(rate, "成功率", color),
    [rate, color]
  );
  return (
    <div className="flex flex-col items-center gap-1">
      <EChart option={option} height={150} />
      <span className="text-[11px] text-muted-foreground">{(rate * 100).toFixed(0)}%</span>
    </div>
  );
}

/** Stacked bar: deliveries over the last 7 days, split by severity. Mock data. */
export function DeliveryTrendChart() {
  const option = useMemo(
    () => stackedBarOption(
      ["周一", "周二", "周三", "周四", "周五", "周六", "周日"],
      [
        { name: "严重", values: [3, 5, 2, 6, 4, 1, 2] },
        { name: "警告", values: [4, 2, 7, 3, 5, 2, 1] },
        { name: "信息", values: [8, 6, 9, 5, 7, 3, 4] }
      ]
    ),
    []
  );
  return <EChart option={option} height={180} />;
}
