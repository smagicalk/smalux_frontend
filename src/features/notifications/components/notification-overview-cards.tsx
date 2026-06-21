import {
  BellIcon,
  ClockIcon,
  MessageSquareIcon,
  ShieldCheckIcon
} from "lucide-react";

import { StatCard } from "@/shared/ui/stat-card";

type NotificationOverviewCardsProps = {
  enabledChannels: number;
  channelCount: number;
  activePolicies: number;
  quietWindowCount: number;
};

export function NotificationOverviewCards({
  enabledChannels,
  channelCount,
  activePolicies,
  quietWindowCount
}: NotificationOverviewCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="通知渠道"
        value={`${enabledChannels}/${channelCount}`}
        description="启用渠道与备份渠道的关系决定告警扩散能力。"
        icon={MessageSquareIcon}
        tone="primary"
      />
      <StatCard
        label="告警策略"
        value={`${activePolicies}`}
        description="真正起作用的是当前未静默的策略，而不是配置总数。"
        icon={BellIcon}
        tone="warning"
      />
      <StatCard
        label="静默窗口"
        value={`${quietWindowCount}`}
        description="维护窗口和临时静默都应该被显式记录。"
        icon={ClockIcon}
        tone="info"
      />
      <StatCard
        label="敏感配置"
        value="加密"
        description="Webhook token、SMTP 密码和外联密钥都不能在前端明文暴露。"
        icon={ShieldCheckIcon}
        tone="success"
      />
    </div>
  );
}
