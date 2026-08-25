import { useMemo, useState } from "react";
import { useAlerts, useCreateAlertRule, useSilenceAlert, useDeleteAlert } from "../hooks/use-alerts";
import { useNotifications, useCreateChannel, useToggleChannel } from "../hooks/use-notifications";
import type { AlertRuleItem, AlertHistoryEvent, NotificationChannelItem } from "../types";
import type { AlertRule, AlertHistory } from "@/shared/api/methods";
import {
  MOCK_ALERT_RULES,
  MOCK_ALERT_HISTORY,
  MOCK_NOTIFICATION_CHANNELS
} from "../mock/alerts-mock";

export function useAlertsData() {
  const { data: rpcAlertsData, isLoading: alertsLoading, refetch: refetchAlerts } = useAlerts();
  const { data: rpcNotificationsData, isLoading: notificationsLoading, refetch: refetchNotifications } = useNotifications();

  const createRule = useCreateAlertRule();
  const silenceRule = useSilenceAlert();
  const deleteRule = useDeleteAlert();

  const createChannel = useCreateChannel();
  const toggleChannel = useToggleChannel();

  const [channels] = useState<NotificationChannelItem[]>(MOCK_NOTIFICATION_CHANNELS);

  // 1. 规整并映射告警规则
  const rules: AlertRuleItem[] = useMemo(() => {
    const rpcRules: AlertRule[] = rpcAlertsData?.rules ?? [];
    if (!rpcRules || rpcRules.length === 0) {
      return MOCK_ALERT_RULES;
    }

    return rpcRules.map((r: AlertRule) => ({
      id: r.id,
      name: r.name,
      serverId: r.serverId,
      metric: r.metric,
      operator: r.operator as AlertRuleItem["operator"],
      threshold: r.threshold,
      thresholdLabel: `${r.operator} ${r.threshold}`,
      windowSec: r.windowSec,
      severity: r.severity as AlertRuleItem["severity"],
      enabled: r.enabled,
      silenced: r.silenced,
      channels: ["chan-1"]
    }));
  }, [rpcAlertsData]);

  // 2. 规整并映射历史触发事件
  const history: AlertHistoryEvent[] = useMemo(() => {
    const rpcHistory: AlertHistory[] = rpcAlertsData?.history ?? [];
    if (!rpcHistory || rpcHistory.length === 0) {
      return MOCK_ALERT_HISTORY;
    }

    return rpcHistory.map((h: AlertHistory) => ({
      id: h.id,
      ruleId: h.ruleId,
      ruleName: h.ruleName,
      serverName: h.serverName || "集群节点",
      severity: h.severity as AlertHistoryEvent["severity"],
      value: h.value,
      formattedValue: `${Math.round(h.value * 100)}%`,
      message: h.message,
      triggeredAt: h.triggeredAt,
      resolvedAt: h.resolvedAt
    }));
  }, [rpcAlertsData]);

  return {
    rules,
    history,
    channels,
    isLoading: alertsLoading || notificationsLoading,
    refetch: () => {
      refetchAlerts();
      refetchNotifications();
    },
    createRule,
    silenceRule,
    deleteRule,
    createChannel,
    toggleChannel
  };
}
