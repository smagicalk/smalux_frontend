import { z } from "zod";
import { alertSeveritySchema } from "./alerts";

/**
 * 告警通知外发推送渠道类型枚举
 * - webhook: 自定义 HTTP Webhook POST
 * - telegram: Telegram Bot 频道 (TG Bot)
 * - email: SMTP 邮件外发通知
 * - js: JavaScript 自定义处理脚本 (JS Hook)
 */
export const channelTypeSchema = z.enum([
  "webhook",
  "telegram",
  "email",
  "js",
  "tgbot"
]);
export type ChannelType = z.infer<typeof channelTypeSchema>;

/**
 * 告警通知渠道（Notification Channel）数据契约 Schema
 */
export const notificationChannelSchema = z.object({
  /** 渠道唯一 ID */
  id: z.string(),
  /** 渠道名称（如 "运维大群 Webhook", "紧急呼叫 TG"） */
  name: z.string(),
  /** 渠道类型 */
  type: channelTypeSchema,
  /** 是否启用该推送渠道 */
  enabled: z.boolean(),
  /** 推送端点地址或 Webhook URL */
  endpoint: z.string(),
  /** 自定义请求头认证或 Token（如 "Authorization: Bearer xxx" 或 "X-Webhook-Token: xxx"） */
  headers: z.string().optional(),
  /** 自定义消息渲染模板或 POST Body JSON 参数（支持 {{SERVER_NAME}}, {{RULE_NAME}}, {{VALUE}} 等动态插值） */
  template: z.string().optional(),
  /** 最近一次推送发送的时间戳（毫秒） */
  lastDeliveryAt: z.number().optional(),
  /** 最近一次推送是否成功送达 */
  lastOk: z.boolean().optional()
});
export type NotificationChannel = z.infer<typeof notificationChannelSchema>;

/**
 * 渠道通知推送历史事件（Notification Event）数据契约 Schema
 */
export const notificationEventSchema = z.object({
  /** 投递记录唯一 ID */
  id: z.string(),
  /** 目标通知渠道名称 */
  channelName: z.string(),
  /** 对应的告警严重级别 */
  severity: alertSeveritySchema,
  /** 推送的通知正文内容 */
  message: z.string(),
  /** 投递时间戳（毫秒） */
  deliveredAt: z.number(),
  /** 投递结果状态（true: 成功, false: 失败） */
  ok: z.boolean()
});
export type NotificationEvent = z.infer<typeof notificationEventSchema>;

/**
 * 通知渠道与投递历史列表查询响应契约
 */
export const notificationListResultSchema = z.object({
  /** 配置的通知渠道列表 */
  channels: z.array(notificationChannelSchema),
  /** 最近通知外发记录列表 */
  events: z.array(notificationEventSchema)
});

/**
 * 创建通知渠道入参契约
 */
export const notificationCreateParamsSchema = z.object({
  /** 渠道名称 */
  name: z.string(),
  /** 渠道类型 */
  type: channelTypeSchema,
  /** Webhook 或目标推送端点 URL */
  endpoint: z.string(),
  /** 自定义 Header Token 鉴权头（可选） */
  headers: z.string().optional(),
  /** 自定义消息渲染模板或 POST Body JSON 参数（可选） */
  template: z.string().optional()
});

/**
 * 启用/禁用通知渠道入参契约
 */
export const notificationToggleParamsSchema = z.object({
  /** 渠道 ID */
  id: z.string(),
  /** 启用状态 */
  enabled: z.boolean()
});
