import { z } from "zod";

/**
 * 告警严重级别枚举
 * - info: 提示（通知类消息）
 * - warning: 警告（指标超出常规，建议介入排查）
 * - critical: 紧急/严重（严重影响服务，需值班人员立即响应）
 */
export const alertSeveritySchema = z.enum(["info", "warning", "critical"]);
export type AlertSeverity = z.infer<typeof alertSeveritySchema>;

/**
 * 告警策略规则（Alert Rule）数据契约 Schema
 */
export const alertRuleSchema = z.object({
  /** 告警规则唯一 ID */
  id: z.string(),
  /** 规则名称（如 "CPU 使用率过高报警", "磁盘剩余低于10%"） */
  name: z.string(),
  /** 作用的目标主机 ID 列表（多选，若为空表示作用于全集群所有节点） */
  serverIds: z.array(z.string()).optional(),
  /** 作用的目标主机 ID（单机兼容字段） */
  serverId: z.string().optional(),
  /** 监控指标项（如 "cpu", "memory", "disk", "net_drop"） */
  metric: z.string(),
  /** 阈值比较运算符 */
  operator: z.enum([">", "<", "==", "!="]),
  /** 触发告警的阈值数值（如 85 表示 85%） */
  threshold: z.number(),
  /** 连续持续时间窗口（秒，如 300 秒表示持续 5 分钟超标才触发） */
  windowSec: z.number(),
  /** 告警级别 */
  severity: alertSeveritySchema,
  /** 规则是否处于开启状态 */
  enabled: z.boolean(),
  /** 当前是否已被值班人员临时静默 */
  silenced: z.boolean().default(false),
  /** 持续未静默时的循环重复通知间隔（秒，如 1800 表示每 30 分钟重复通知一次，0 为不重复通知） */
  repeatIntervalSec: z.number().default(0).optional(),
  /** 关联的通知推送渠道 ID 列表 */
  channelIds: z.array(z.string()).default([]).optional()
});
export type AlertRule = z.infer<typeof alertRuleSchema>;

/**
 * 告警历史触发事件（Alert History Event）数据契约 Schema
 */
export const alertHistorySchema = z.object({
  /** 触发事件记录唯一 ID */
  id: z.string(),
  /** 关联触发的告警规则 ID */
  ruleId: z.string(),
  /** 关联触发的告警规则名称 */
  ruleName: z.string(),
  /** 触发告警的故障主机 ID */
  serverId: z.string().optional(),
  /** 触发告警的故障主机名称 */
  serverName: z.string().optional(),
  /** 告警严重级别 */
  severity: alertSeveritySchema,
  /** 触发时间戳（毫秒） */
  triggeredAt: z.number(),
  /** 恢复解决时间戳（毫秒，若为空表示仍在持续报警中） */
  resolvedAt: z.number().optional(),
  /** 触发时的瞬时指标采样值（如 0.92） */
  value: z.number(),
  /** 告警通知具体文本说明 */
  message: z.string()
});
export type AlertHistory = z.infer<typeof alertHistorySchema>;

/**
 * 告警规则与触发历史查询入参契约
 */
export const alertListParamsSchema = z.object({
  /** 搜索关键词（匹配规则名、指标项、主机名等） */
  search: z.string().optional(),
  /** 严重级别过滤 */
  severity: z.string().optional(),
  /** 作用范围过滤 */
  scope: z.enum(["all", "global", "custom"]).optional(),
  /** 当前页码 */
  page: z.number().optional(),
  /** 每页条数 */
  pageSize: z.number().optional()
}).optional();
export type AlertListParams = z.infer<typeof alertListParamsSchema>;

/**
 * 告警规则与触发历史查询响应契约
 */
export const alertListResultSchema = z.object({
  /** 告警规则列表 */
  rules: z.array(alertRuleSchema),
  /** 告警触发历史记录列表 */
  history: z.array(alertHistorySchema),
  /** 匹配的规则总数 */
  totalRules: z.number().optional(),
  /** 匹配的历史记录总数 */
  totalHistory: z.number().optional()
});

/**
 * 创建告警规则入参契约
 */
export const alertCreateParamsSchema = z.object({
  /** 规则名称 */
  name: z.string(),
  /** 监控指标项 */
  metric: z.string(),
  /** 比较运算符 */
  operator: z.enum([">", "<", "==", "!="]),
  /** 阈值数值 */
  threshold: z.number(),
  /** 持续判定窗口（秒，默认 300） */
  windowSec: z.number().default(300),
  /** 持续未静默时的循环重复通知间隔（秒，默认 0） */
  repeatIntervalSec: z.number().default(0).optional(),
  /** 告警严重级别 */
  severity: alertSeveritySchema,
  /** 关联的通知推送渠道 ID 列表 */
  channelIds: z.array(z.string()).optional(),
  /** 目标主机 ID 列表（多选，可选） */
  serverIds: z.array(z.string()).optional(),
  /** 目标主机 ID（单机兼容，可选） */
  serverId: z.string().optional()
});

/**
 * 静默/解除静默告警入参契约
 */
export const alertSilenceParamsSchema = z.object({
  /** 规则 ID */
  id: z.string(),
  /** 是否静默 */
  silenced: z.boolean()
});

/**
 * 删除告警规则入参契约
 */
export const alertDeleteParamsSchema = z.object({
  /** 规则 ID */
  id: z.string()
});
