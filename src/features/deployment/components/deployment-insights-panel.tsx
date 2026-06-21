import { DeploymentChartsPanel } from "@/features/deployment/components/deployment-charts-panel";
import { DeploymentNginxCard } from "@/features/deployment/components/deployment-nginx-card";
import { DeploymentRustEmbedCard } from "@/features/deployment/components/deployment-rust-embed-card";
import type { DeploymentChartDatum, DeploymentSeries } from "@/features/deployment/model/deployment-insights";

type DeploymentInsightsPanelProps = {
  deploymentScoreSeries: readonly DeploymentSeries[];
  runtimeSegments: readonly { label: string; value: number; color: string }[];
  deliveryEffortBars: readonly DeploymentChartDatum[];
  cachePolicyBars: readonly DeploymentChartDatum[];
};

export function DeploymentInsightsPanel({
  deploymentScoreSeries,
  runtimeSegments,
  deliveryEffortBars,
  cachePolicyBars
}: DeploymentInsightsPanelProps) {
  return (
    <>
      <DeploymentChartsPanel
        deploymentScoreSeries={deploymentScoreSeries}
        runtimeSegments={runtimeSegments}
        deliveryEffortBars={deliveryEffortBars}
        cachePolicyBars={cachePolicyBars}
      />

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <DeploymentNginxCard />
        <DeploymentRustEmbedCard />
      </div>
    </>
  );
}
