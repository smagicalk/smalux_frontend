import type { NodeStatus } from "@/shared/domain/node";

export const nodeStatusColor: Record<NodeStatus, string> = {
  online: "var(--chart-2)",
  warning: "var(--chart-3)",
  offline: "var(--chart-4)"
};

export const nodeAgentAccessItems = [
  ["接入通道", "WSS / 443", "Agent 只向主控发起出站连接，便于单独部署与 Nginx 反代。"],
  ["注册 Token", "一次性", "创建后只展示一次，绑定分组、区域、过期时间和 Scope。"],
  ["密钥轮换", "分批执行", "按区域错峰轮换，失败节点保留旧密钥到安全窗口结束。"]
] as const;

export const nodeTokenScopes = [
  ["node:read", "读取指标、心跳和基础资产信息"],
  ["node:exec", "受控远程执行，不含终端提权"],
  ["node:terminal", "Web 终端会话，必须单独审批"],
  ["theme:public", "公开页主题资源读取，不接触后台配置"]
] as const;

export const nodeRegionPolicies = [
  ["Tokyo", "Core", "主控优先，严格限流"],
  ["Singapore", "Edge / Cache", "异常优先，允许降级展示"],
  ["Frankfurt", "Database", "只读默认，写操作审批"],
  ["San Francisco", "Edge", "公开页可展示，隐藏内部标签"]
] as const;

export function createNodeStatusSegments(
  statuses: readonly NodeStatus[],
  getCount: (status: NodeStatus) => number,
  getColor: (status: NodeStatus) => string
) {
  return statuses.map((status) => ({
    label: status === "online" ? "在线" : status === "warning" ? "预警" : "离线",
    value: getCount(status),
    color: getColor(status)
  }));
}
