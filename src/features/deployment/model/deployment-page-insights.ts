import type { DeploymentTarget } from "@/features/deployment/model/mock-deployment";

export const deploymentScoreSeries = [
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

export const cachePolicyBars = [
  { label: "assets", value: 365 },
  { label: "index", value: 1 },
  { label: "config", value: 1 },
  { label: "api", value: 0 }
];

export const deliveryEffortBars = [
  { label: "静态部署", value: 22 },
  { label: "Nginx", value: 36 },
  { label: "Rust 内置", value: 58 },
  { label: "Headless", value: 48 },
  { label: "容器镜像", value: 30 }
];

export function createRuntimeSegments(targets: readonly DeploymentTarget[]) {
  return [
    {
      label: "已就绪",
      value: targets.filter((target) => target.status === "ready").length,
      color: "var(--chart-1)"
    },
    {
      label: "规划中",
      value: targets.filter((target) => target.status === "planned").length,
      color: "var(--chart-3)"
    }
  ] as const;
}
