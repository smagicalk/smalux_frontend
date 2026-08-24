import { useState, useMemo } from "react";
import { useAlerts as useRpcAlerts } from "../hooks/use-alerts";
import type { AlertRuleItem, AlertHistoryEvent, NotificationChannelItem } from "../types";
import {
  MOCK_ALERT_RULES,
  MOCK_ALERT_HISTORY,
  MOCK_NOTIFICATION_CHANNELS
} from "../mock/alerts-mock";

/**
 * 告警中心聚合数据 Hook（Alerts Page 专用）
 * 
 * 职责：
 * 1. 规整 RPC `useAlerts` 获取的规则列表，映射为前端 UI 视图模型。
 * 2. 转换告警历史事件流，格式化数值百分比与触发时间。
 * 3. 关联通知渠道（Notification Channels）。
 */
export function useAlertsData() {
  const { data: rpcAlertsData, isLoading, refetch } = useRpcAlerts();

  const [channels] = useState<NotificationChannelItem[]>(MOCK_NOTIFICATION_CHANNELS);

  // 1. 规整并映射告警规则
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

  // 2. 规整并映射历史触发事件
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
