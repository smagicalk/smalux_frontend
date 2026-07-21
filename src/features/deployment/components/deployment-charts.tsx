import { useMemo } from "react";

import { EChart, type EChartsOption } from "@/shared/charts/echart";
import { radarOption } from "@/shared/charts/chart-options";
import type { DeploymentTarget } from "@/shared/api/methods";

import { COMPLEXITY_SCORE, MODE_LABEL } from "../lib/deployment-meta";

/** Radar comparing delivery modes across 5 axes (perf / simplicity / monolith / control / build speed). */
export function ComparisonRadar({ targets }: { targets: DeploymentTarget[] }) {
  const option = useMemo<EChartsOption>(
    () => {
      return radarOption(
        [
          { name: "性能", max: 10 },
          { name: "简易度", max: 10 },
          { name: "单体性", max: 10 },
          { name: "可控性", max: 10 },
          { name: "构建速度", max: 10 }
        ],
        targets.map((t) => {
          const c = COMPLEXITY_SCORE[t.complexity];
          return {
            name: MODE_LABEL[t.mode],
            values: [
              10 - c,            // 性能：复杂度低性能高
              10 - c,            // 简易度
              t.mode === "rust-embed" ? 10 : t.mode === "static" ? 3 : 6, // 单体性
              t.mode === "nginx" ? 9 : t.mode === "rust-embed" ? 7 : 5,   // 可控性
              10 - c             // 构建速度
            ]
          };
        })
      );
    },
    [targets]
  );
  return <EChart option={option} height={220} />;
}
