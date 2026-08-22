import { useState, useMemo } from "react";
import { useAlerts as useRpcAlerts } from "../hooks/use-alerts";
import type { AlertRuleItem, AlertHistoryEvent, NotificationChannelItem } from "../types";
import {
  MOCK_ALERT_RULES,
  MOCK_ALERT_HISTORY,
  MOCK_NOTIFICATION_CHANNELS
} from "../mock/alerts-mock";

/**
 * Isolated alerts feature hook for rules, history, and notification channels.
 */
export function useAlertsData() {
  const { data: rpcAlertsData, isLoading, refetch } = useRpcAlerts();

  const [channels] = useState<NotificationChannelItem[]>(MOCK_NOTIFICATION_CHANNELS);

  // 1. Transform Rules
  const rules: AlertRuleItem[] = useMemo(() => {
    const rpcRules = rpcAlertsData?.rules ?? [];
    if (!rpcRules || rpcRules.length === 0) {
      return MOCK_ALERT_RULES;
    }

    return rpcRules.map((r) => ({
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

  // 2. Transform Alert History
  const history: AlertHistoryEvent[] = useMemo(() => {
    const rpcHistory = rpcAlertsData?.history ?? [];
    if (!rpcHistory || rpcHistory.length === 0) {
      return MOCK_ALERT_HISTORY;
    }

    return rpcHistory.map((h) => ({
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
    isLoading,
    refetch
  };
}
