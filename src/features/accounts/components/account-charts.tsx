import { useMemo } from "react";

import { EChart, chartPalette, barGradient, donutCenter, withTheme, type EChartsOption } from "@/shared/charts/echart";
import { ringProgressOption } from "@/shared/charts/chart-options";
import type { Account } from "@/shared/api/methods";

import { ROLE_LABEL } from "../lib/account-meta";

/** Half-ring: share of accounts with MFA enabled. */
export function MfaRing({ accounts }: { accounts: Account[] }) {
  const palette = chartPalette();
  const ratio = accounts.length ? accounts.filter((a) => a.mfaEnabled).length / accounts.length : 0;
  const color = ratio > 0.7 ? palette.success : ratio > 0.4 ? palette.warning : palette.danger;
  const option = useMemo<EChartsOption>(
    () => ringProgressOption(ratio, "MFA", color),
    [ratio, color]
  );
  return (
    <div className="flex flex-col items-center gap-1">
      <EChart option={option} height={180} />
      <span className="text-[11px] text-muted-foreground">{accounts.filter((a) => a.mfaEnabled).length} / {accounts.length} 已启用</span>
    </div>
  );
}

/** Donut: account count broken down by role. */
export function RoleDonut({ accounts }: { accounts: Account[] }) {
  const palette = chartPalette();
  const counts = useMemo(() => {
    const m: Record<Account["role"], number> = { admin: 0, operator: 0, viewer: 0, auditor: 0 };
    for (const a of accounts) m[a.role]++;
    return m;
  }, [accounts]);
  const total = accounts.length;
  const option = useMemo<EChartsOption>(
    () => {
      const baseColors = [palette.danger, palette.cyan, palette.muted, palette.violet];
      return withTheme({
      tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
      legend: { bottom: 0, textStyle: { color: palette.muted, fontSize: 11 }, icon: "circle", itemWidth: 8, itemHeight: 8 },
      graphic: donutCenter(total, "账户", palette),
      series: [{
        type: "pie",
        radius: ["58%", "80%"],
        itemStyle: { borderColor: palette.card, borderWidth: 3, borderRadius: 6 },
        label: { show: false },
        emphasis: { scale: true, scaleSize: 5, itemStyle: { shadowBlur: 16, shadowColor: palette.cyan }, label: { show: false } },
        data: (Object.keys(ROLE_LABEL) as Account["role"][]).map((r, i) => ({
          name: ROLE_LABEL[r],
          value: counts[r],
          itemStyle: { color: barGradient(baseColors[i % baseColors.length]) }
        }))
      }]
      });
    },
    [counts, palette, total]
  );
  return <EChart option={option} height={180} />;
}
