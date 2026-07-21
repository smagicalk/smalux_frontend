import { useMemo } from "react";

import { EChart, chartPalette, barGradient, withTheme, type EChartsOption } from "@/shared/charts/echart";
import type { Theme } from "@/shared/api/methods";

/** Funnel: theme counts by lifecycle stage (draft → published → archived). */
export function StatusFunnel({ themes }: { themes: Theme[] }) {
  const palette = chartPalette();
  const counts = useMemo(() => {
    const m: Record<Theme["status"], number> = { draft: 0, published: 0, archived: 0 };
    for (const t of themes) m[t.status]++;
    return m;
  }, [themes]);
  const option = useMemo<EChartsOption>(
    () => {
      const colors = [palette.muted, palette.success, palette.warning];
      return withTheme({
      tooltip: { trigger: "item", formatter: "{b}: {c}" },
      series: [{
        type: "funnel",
        left: "12%", right: "12%", top: 8, bottom: 8,
        minSize: "24%",
        label: { color: palette.foreground, fontSize: 11, position: "inside" },
        labelLine: { show: false },
        gap: 3,
        itemStyle: { borderColor: palette.card, borderWidth: 2 },
        data: [
          { name: "草稿", value: counts.draft, itemStyle: { color: barGradient(colors[0]) } },
          { name: "已发布", value: counts.published, itemStyle: { color: barGradient(colors[1]) } },
          { name: "已归档", value: counts.archived, itemStyle: { color: barGradient(colors[2]) } }
        ]
      }]
      });
    },
    [counts, palette]
  );
  return <EChart option={option} height={160} />;
}
