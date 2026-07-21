import { useMemo } from "react";

import { EChart, chartPalette, type EChartsOption } from "@/shared/charts/echart";
import { horizontalBarOption, ringProgressOption } from "@/shared/charts/chart-options";
import type { Token } from "@/shared/api/methods";

/** Half-ring: share of tokens that are still active. */
export function ActiveRing({ active, total }: { active: number; total: number }) {
  const palette = chartPalette();
  const ratio = total ? active / total : 0;
  const option = useMemo<EChartsOption>(
    () => ringProgressOption(ratio, "有效", palette.cyan),
    [ratio, palette.cyan]
  );
  return (
    <div className="flex flex-col items-center gap-1">
      <EChart option={option} height={150} />
      <span className="text-[11px] text-muted-foreground">有效 {active} / 共 {total}</span>
    </div>
  );
}

/** Horizontal bar: how many tokens carry each scope, sorted by frequency. */
export function ScopeChart({ tokens }: { tokens: Token[] }) {
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of tokens) for (const s of t.scopes) m.set(s, (m.get(s) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [tokens]);
  const option = useMemo<EChartsOption>(
    () => horizontalBarOption(counts.map(([s]) => s), counts.map(([, v]) => v), {}),
    [counts]
  );
  if (!counts.length) return <div className="flex h-[160px] items-center justify-center text-xs text-muted-foreground">暂无数据</div>;
  return <EChart option={option} height={Math.max(160, counts.length * 28)} />;
}
