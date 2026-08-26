/**
 * 告警中心与多渠道通知 Mock 响应引擎 (Alerts & Notifications Mock Engine)
 * 
 * 为告警规则增删改查、阈值监控判定、告警事件恢复、多渠道推送通知（Webhook/邮件/Telegram/钉钉等）
 * 提供标准的本地脱机可响应仿真实现，与后端 RESTful API 保持 1:1 严格契约对齐。
 */

import type {
  AlertRule,
  AlertHistory,
  NotificationChannel,
  NotificationEvent,
  AlertListResult,
  NotificationListResult,
  ChannelType
} from "@/shared/api/methods";
import type { AlertRuleItem, AlertHistoryEvent, NotificationChannelItem } from "../types";
import {
  mockAlertRules as initialRules,
  mockAlertHistory as initialHistory,
  mockNotificationChannels as initialChannels,
  mockNotificationEvents as initialEvents
} from "@/shared/api/mock/mock-data";

/**
 * 创建告警规则请求参数
 */
export interface AlertCreateParams {
  /** 告警规则名称（如 "CPU 使用率过高告警"） */
  name: string;
  /** 监控的指标键名（如 "cpu", "mem", "disk", "ping_loss", "load_15m"） */
  metric: string;
  /** 比较运算符（支持大于 ">"、小于 "<"、等于 "=="、不等于 "!="） */
  operator: ">" | "<" | "==" | "!=";
  /** 触发阈值数值（例如 85 代表 85% 或 85ms） */
  threshold: number;
  /** 持续时间窗口（秒，连续超过此时间才触发，防抖动） */
  windowSec: number;
  /** 告警危险等级（"info" 提示 / "warning" 警告 / "critical" 严重致命） */
  severity: "info" | "warning" | "critical";
  /** 指定绑定的单台服务器 ID（可选） */
  serverId?: string;
  /** 指定绑定的多台服务器 ID 列表（可选） */
  serverIds?: string[];
}

/**
 * 更新告警规则请求参数
 */
export interface AlertUpdateParams extends Partial<AlertCreateParams> {
  /** 规则唯一标识 ID */
  id?: string;
  /** 是否启用监控检测 */
  enabled?: boolean;
  /** 是否处于静音勿扰状态 */
  silenced?: boolean;
}

/**
 * 创建通知推送渠道请求参数
 */
export interface NotificationCreateParams {
  /** 渠道名称（如 "运维大群 Webhook 机器人"） */
  name: string;
  /** 渠道类型（"webhook" | "telegram" | "email" | "dingtalk" | "wecom" | "feishu" | "discord"） */
  type: ChannelType;
  /** 推送端点 URL 或邮箱地址 */
  endpoint: string;
  /** 自定义请求头 Headers（JSON 字符串格式，可选） */
  headers?: string;
  /** 自定义通知 Markdown/文本消息模板（可选） */
  template?: string;
}

/**
 * 供 use-alerts-api.ts 兼容回退的初始 Mock 告警规则集合
 */
export const MOCK_ALERT_RULES: AlertRuleItem[] = initialRules.map((r) => ({
  id: r.id,
  name: r.name,
  metric: r.metric,
  operator: r.operator,
  threshold: r.threshold,
  thresholdLabel: `${r.operator} ${r.threshold}`,
  windowSec: r.windowSec,
  severity: r.severity,
  enabled: r.enabled,
  silenced: r.silenced,
  channels: ["chan-1"]
}));

/**
 * 供 use-alerts-api.ts 兼容回退的初始 Mock 告警历史事件集合
 */
export const MOCK_ALERT_HISTORY: AlertHistoryEvent[] = initialHistory.map((h) => ({
  id: h.id,
  ruleId: h.ruleId,
  ruleName: h.ruleName,
  serverId: h.serverId || "srv-default",
  serverName: h.serverName || "host-default",
  severity: h.severity,
  value: h.value,
  formattedValue: typeof h.value === "number" ? `${h.value}` : "异常",
  message: h.message,
  triggeredAt: h.triggeredAt
}));

/**
 * 供 use-alerts-api.ts 兼容回退的初始 Mock 通知渠道集合
 */
export const MOCK_NOTIFICATION_CHANNELS: NotificationChannelItem[] = initialChannels.map((c) => ({
  id: c.id,
  name: c.name,
  type: c.type as any,
  endpoint: c.endpoint,
  target: c.endpoint,
  enabled: c.enabled,
  lastOk: c.lastOk ?? true
}));

/**
 * 告警与通知 Mock 状态机引擎实现类
 */
class AlertsMockEngine {
  /** 告警规则内存集合 */
  private rules: AlertRule[];
  /** 告警历史触发流水 */
  private history: AlertHistory[];
  /** 通知推送渠道集合 */
  private channels: NotificationChannel[];
  /** 渠道推送事件日志 */
  private events: NotificationEvent[];

  constructor() {
    this.rules = [...initialRules];
    this.history = [...initialHistory];
    this.channels = [...initialChannels];
    this.events = [...initialEvents];
  }

  // ─────────────── 1. 告警规则与历史 API (Alerts & Rules) ───────────────

  /**
   * 获取全部告警规则及近期触发历史记录
   * @returns 包含 rules 和 history 的聚合对象
   */
  public getAlerts(): AlertListResult {
    return {
      rules: [...this.rules],
      history: [...this.history]
    };
  }

  /**
   * 创建新的告警检测规则
   * @param params 创建规则所需的指标、运算符、阈值及严重度参数
   * @returns 生成并持久化后的 AlertRule 实体
   */
  public createRule(params: AlertCreateParams): AlertRule {
    const newRule: AlertRule = {
      id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: params.name,
      metric: params.metric,
      operator: params.operator,
      threshold: params.threshold,
      windowSec: params.windowSec,
      severity: params.severity,
      serverId: params.serverId,
      serverIds: params.serverIds,
      enabled: true,
      silenced: false
    };
    this.rules = [newRule, ...this.rules];
    return newRule;
  }

  /**
   * 更新已存在的告警检测规则
   * @param id 目标告警规则唯一 ID
   * @param params 需更新的部分属性
   * @returns 更新后的完整 AlertRule 实体
   */
  public updateRule(id: string, params: AlertUpdateParams): AlertRule {
    const idx = this.rules.findIndex((r) => r.id === id);
    if (idx === -1) {
      throw new Error(`未找到 ID 为 ${id} 的告警规则`);
    }
    const updated: AlertRule = {
      ...this.rules[idx],
      ...params,
      id
    };
    this.rules[idx] = updated;
    return updated;
  }

  /**
   * 启停指定的告警规则
   * @param id 目标规则 ID
   * @param enabled 是否开启监控
   * @returns 操作成功标识 `{ ok: true }`
   */
  public toggleRule(id: string, enabled: boolean): { ok: boolean } {
    const rule = this.rules.find((r) => r.id === id);
    if (rule) {
      rule.enabled = enabled;
    }
    return { ok: true };
  }

  /**
   * 静音/解除静音指定的告警规则
   * @param id 目标规则 ID
   * @param silenced 是否开启静音模式
   * @returns 操作成功标识 `{ ok: true }`
   */
  public silenceRule(id: string, silenced: boolean): { ok: boolean } {
    const rule = this.rules.find((r) => r.id === id);
    if (rule) {
      rule.silenced = silenced;
    }
    return { ok: true };
  }

  /**
   * 删除指定的告警规则
   * @param id 目标规则 ID
   * @returns 操作成功标识 `{ ok: true }`
   */
  public deleteRule(id: string): { ok: boolean } {
    this.rules = this.rules.filter((r) => r.id !== id);
    return { ok: true };
  }

  /**
   * 手动标记解决/消除一条未决告警事件
   * @param eventId 目标告警事件 ID
   * @returns 操作成功标识 `{ ok: true }`
   */
  public resolveEvent(eventId: string): { ok: boolean } {
    const ev = this.history.find((h) => h.id === eventId);
    if (ev) {
      (ev as any).resolved = true;
      (ev as any).resolvedAt = Date.now();
    }
    return { ok: true };
  }

  // ─────────────── 2. 多渠道通知推送 API (Notifications) ───────────────

  /**
   * 获取所有已配置的通知推送渠道及推送日志
   * @returns 包含 channels 和 events 的列表对象
   */
  public getNotifications(): NotificationListResult {
    return {
      channels: [...this.channels],
      events: [...this.events]
    };
  }

  /**
   * 创建新的第三方通知推送渠道
   * @param params 渠道类型、Webhook 地址、请求头及模板
   * @returns 新创建的 NotificationChannel 实体
   */
  public createChannel(params: NotificationCreateParams): NotificationChannel {
    const newChan: NotificationChannel = {
      id: `chan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: params.name,
      type: params.type,
      endpoint: params.endpoint,
      enabled: true,
      lastOk: true,
      lastDeliveryAt: Date.now()
    };
    this.channels = [newChan, ...this.channels];
    return newChan;
  }

  /**
   * 启停指定的通知推送渠道
   * @param id 目标渠道 ID
   * @param enabled 是否启用此渠道
   * @returns 操作成功标识 `{ ok: true }`
   */
  public toggleChannel(id: string, enabled: boolean): { ok: boolean } {
    const chan = this.channels.find((c) => c.id === id);
    if (chan) {
      chan.enabled = enabled;
    }
    return { ok: true };
  }

  /**
   * 发送测试通知包以验证渠道连通性
   * @param id 目标渠道 ID
   * @returns 模拟测试连通结果（延时与成功状态）
   */
  public testChannel(id: string): { ok: boolean; latencyMs: number } {
    const chan = this.channels.find((c) => c.id === id);
    if (chan) {
      chan.lastDeliveryAt = Date.now();
      chan.lastOk = true;
    }
    return {
      ok: true,
      latencyMs: Math.floor(Math.random() * 80) + 20
    };
  }

  /**
   * 删除指定的通知推送渠道
   * @param id 目标渠道 ID
   * @returns 操作成功标识 `{ ok: true }`
   */
  public deleteChannel(id: string): { ok: boolean } {
    this.channels = this.channels.filter((c) => c.id !== id);
    return { ok: true };
  }
}

/** 告警与通知全局单例 Mock 引擎实例 */
export const alertsMockEngine = new AlertsMockEngine();
