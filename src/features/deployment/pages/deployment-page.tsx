import { FileCode2Icon, RocketIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { mockDeploymentTargets, type DeploymentTarget } from "@/features/deployment/model/mock-deployment";
import { DeploymentBoundaryPanel } from "@/features/deployment/components/deployment-boundary-panel";
import { DeploymentInsightsPanel } from "@/features/deployment/components/deployment-insights-panel";
import { DeploymentOverviewStats } from "@/features/deployment/components/deployment-overview-stats";
import { DeploymentTargetsPanel } from "@/features/deployment/components/deployment-targets-panel";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";

const deploymentScoreSeries = [
  {
    name: "静态部署",
    color: "var(--chart-1)",
    values: [95, 90, 78, 72, 86]
  },
  {
    name: "Nginx",
    color: "var(--chart-2)",
    values: [88, 96, 90, 86, 91]
  },
  {
    name: "Rust 内置",
    color: "var(--chart-3)",
    values: [78, 84, 92, 96, 88]
  }
] as const;

const cachePolicyBars = [
  { label: "assets", value: 365 },
  { label: "index", value: 1 },
  { label: "config", value: 1 },
  { label: "api", value: 0 }
];

const deliveryEffortBars = [
  { label: "静态部署", value: 22 },
  { label: "Nginx", value: 36 },
  { label: "Rust 内置", value: 58 },
  { label: "Headless", value: 48 },
  { label: "容器镜像", value: 30 }
];

export function DeploymentPage() {
  const [selectedTargetId, setSelectedTargetId] = useState(mockDeploymentTargets[0]?.id ?? "");

  const runtimeSegments = [
    {
      label: "已就绪",
      value: mockDeploymentTargets.filter((target) => target.status === "ready").length,
      color: "var(--chart-1)"
    },
    {
      label: "规划中",
      value: mockDeploymentTargets.filter((target) => target.status === "planned").length,
      color: "var(--chart-3)"
    }
  ] as const;

  const announceTarget = (target: DeploymentTarget) => {
    toast.info("已选择部署模式", {
      description: `${target.name} · ${target.status === "ready" ? "可用于当前构建" : "仍在规划中"}`
    });
  };

  return (
    <>
      <PageHeader
        eyebrow="Delivery Surface"
        title="部署"
        description="部署页不是一组说明卡，而是交付策略面。它要回答同一份前端产物如何在静态托管、Nginx 反代和 Rust 内置三种模式下稳定落地。"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.info("运行时配置预览", {
                  description: "public/app-config.json · api/ws/rpc endpoint ready"
                })
              }
            >
              <FileCode2Icon data-icon="inline-start" aria-hidden />
              查看配置
            </Button>
            <Button
              size="sm"
              onClick={() =>
                toast.success("构建任务已完成", {
                  description: "mock build: dist/ 已生成，可用于静态/Nginx/Rust 内置。"
                })
              }
            >
              <RocketIcon data-icon="inline-start" aria-hidden />
              构建产物
            </Button>
          </>
        }
      />

      <DeploymentOverviewStats />
      <DeploymentBoundaryPanel />
      <DeploymentTargetsPanel
        targets={mockDeploymentTargets}
        selectedTargetId={selectedTargetId}
        onTargetSelect={setSelectedTargetId}
        onTargetInspect={announceTarget}
      />
      <DeploymentInsightsPanel
        deploymentScoreSeries={deploymentScoreSeries}
        runtimeSegments={runtimeSegments}
        deliveryEffortBars={deliveryEffortBars}
        cachePolicyBars={cachePolicyBars}
      />
    </>
  );
}
