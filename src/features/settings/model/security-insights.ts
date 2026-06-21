import { securityDesignItems } from "@/features/settings/model/design-catalog";

export const securityCoverage = [
  { label: "认证", value: 92 },
  { label: "传输", value: 88 },
  { label: "上传", value: 76 },
  { label: "审计", value: 84 },
  { label: "Agent", value: 81 },
  { label: "WSS", value: 86 },
  { label: "Token", value: 78 }
];

export const riskSegments = [
  { label: "核心", value: 4, color: "var(--chart-1)" },
  { label: "高风险", value: 4, color: "var(--chart-3)" },
  { label: "治理", value: 3, color: "var(--chart-2)" },
  { label: "部署", value: 2, color: "var(--chart-4)" }
];

export const limitRiskBars = [
  { label: "主题上传", value: 78 },
  { label: "远程执行", value: 92 },
  { label: "Ping 外联", value: 84 },
  { label: "通知 Webhook", value: 74 },
  { label: "Agent 注册", value: 88 },
  { label: "Token Scope", value: 82 },
  { label: "插件 Worker", value: 80 }
];

export function createSecurityInsightSummary() {
  const hardenedItems = securityDesignItems.filter((item) => item.badgeVariant === "success").length;

  return {
    hardenedItems,
    totalItems: securityDesignItems.length,
    hardeningPercent: Math.round((hardenedItems / securityDesignItems.length) * 100)
  };
}
