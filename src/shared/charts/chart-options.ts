/**
 * Barrel for the chart-option factories. Each chart family lives in its own
 * module so a 700-line monolith doesn't have to be edited as one file:
 *   - chart-base           shared animation baseline + neonDivider re-export
 *   - trend-options        time-series (cpu/throughput/area trends)
 *   - progress-options     gauges / rings / liquid / status water-level
 *   - distribution-options region rose + polar bar
 *   - comparison-options   radar + bubble scatter
 *   - categorical-options  stacked/grouped/rainbow/horizontal bars + funnel + heatmap
 *
 * Public import path stays `@/shared/charts/chart-options` — callers are
 * unaffected; this file only re-exports.
 */
export { S, neonDivider } from "./chart-base";
export {
  clusterCpuTrendOption,
  clusterThroughputTrendOption,
  areaTrendOption,
  pingLatencyOption,
  diskIoOption,
  metricBreakdownOption
} from "./trend-options";
export {
  gaugeOption,
  liquidOption,
  ringProgressOption,
  statusDistributionOption
} from "./progress-options";
export {
  regionDistributionOption,
  polarBarOption
} from "./distribution-options";
export {
  radarAxisLabel,
  radarOption,
  bubbleOption
} from "./comparison-options";
export {
  stackedBarOption,
  groupedBarOption,
  rainbowBarOption,
  horizontalBarOption,
  funnelOption,
  heatmapOption
} from "./categorical-options";
