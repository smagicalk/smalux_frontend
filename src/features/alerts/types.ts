export type AlertSeverity = "critical" | "warning" | "info";
export type AlertOperator = ">" | ">=" | "<" | "<=" | "==" | "!=";
export type ChannelType = "webhook" | "telegram" | "discord" | "email" | "wecom" | "dingtalk" | "feishu";

export interface AlertRuleItem {
  id: string;
  name: string;
  serverId?: string;
  serverName?: string;
  metric: string;
  operator: AlertOperator;
  threshold: number;
  thresholdLabel?: string;
  windowSec: number;
  severity: AlertSeverity;
  enabled: boolean;
  silenced: boolean;
  repeatIntervalSec?: number;
  channelIds?: string[];
  channels: string[];
}

export interface AlertHistoryEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  serverId?: string;
  serverName: string;
  severity: AlertSeverity;
  value: number;
  formattedValue: string;
  message: string;
  triggeredAt: number;
  resolvedAt?: number;
}

export interface NotificationChannelItem {
  id: string;
  name: string;
  type: ChannelType;
  enabled: boolean;
  endpoint: string;
  lastDeliveryAt?: number;
  lastOk?: boolean;
}
