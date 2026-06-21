import type { BadgeVariant } from "@/shared/ui/badge";

import type { PingStatus } from "@/features/ping/model/mock-ping";

export const pingStatusMeta: Record<PingStatus, { label: string; variant: BadgeVariant }> = {
  ok: { label: "正常", variant: "success" },
  degraded: { label: "降级", variant: "warning" },
  down: { label: "不可用", variant: "danger" }
};

export const pingTargetGroups = [
  ["Public", "公开状态页、对外入口", "可展示"],
  ["Control", "API / JSON-RPC / WSS", "仅后台"],
  ["Notify", "SMTP / Webhook 通道", "仅告警"],
  ["Private", "内网与管理端口", "默认拒绝"]
] as const;

export const pingProtocolHealth = [
  ["HTTP", "证书、状态码、响应时间"],
  ["TCP", "端口连通、超时、握手耗时"],
  ["ICMP", "丢包、抖动、宿主权限"],
  ["WSS", "握手、Origin、心跳间隔"]
] as const;

export const pingDisplayBoundaries = [
  "公开页只展示已标记 public 的目标，不暴露内网域名、端口和告警策略名称",
  "API / WSS / JSON-RPC 健康检查默认仅后台可见，公开页只展示聚合状态",
  "目标新增、导入和批量修改必须先经过服务端地址校验与频率限制"
] as const;

export const pingSecurityRules = [
  "目标地址由服务端校验，并限制私网与回环地址策略",
  "最小探测间隔、最大重试次数和超时时间必须受系统设置控制",
  "Webhook 与 Ping 目标共用外联审计和频率限制边界",
  "ICMP 是否启用取决于部署权限与宿主环境能力",
  ...pingDisplayBoundaries
] as const;
