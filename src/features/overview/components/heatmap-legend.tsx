import { useMemo } from "react";

import { chartPalette } from "@/shared/charts/echart";

/**
 * Continuous color legend for the load heatmap. The visualMap is hidden on the
 * chart itself (it eats layout space), so we render a slim HTML gradient bar
 * here instead — cyan (idle) → violet (moderate) → danger (saturated), with
 * 低/高 labels and tick marks so the color meaning is self-explanatory.
 */
export function HeatmapLegend() {
  const palette = useMemo(() => chartPalette(), []);
  const stops = [palette.cyan, palette.violet, palette.danger];
  const ticks = [0, 25, 50, 75, 100];
  return (
    <div className="px-1 pb-0.5 pt-1">
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span>低负载</span>
        <div className="relative h-2 flex-1 overflow-hidden rounded-full"
          style={{ background: `linear-gradient(90deg, ${stops.join(", ")})` }}
        >
          {ticks.map((t) => (
            <span key={t} className="absolute top-0 h-full w-px bg-black/20" style={{ left: `${t}%` }} />
          ))}
        </div>
        <span>高负载</span>
      </div>
      <div className="mt-0.5 flex justify-between px-[44px] text-[10px] tabular-nums text-muted-foreground">
        {ticks.map((t) => <span key={t}>{t}%</span>)}
      </div>
    </div>
  );
}
