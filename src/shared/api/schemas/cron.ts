import { z } from "zod";
import { taskStatusSchema } from "./tasks";

/**
 * 分布式定时计划任务（Cron Job）数据契约 Schema
 * 
 * 对应 `cron.*` API 实体，定义在目标 Linux 节点上周期性触发的 Shell 调度规则。
 */
export const cronSchema = z.object({
  /** 定时任务唯一标识 ID（如 "cron-backup-01"） */
  id: z.string(),
  /** 任务可读名称（如 "每日全量冷备", "Nginx日志轮转"） */
  name: z.string(),
  /** 绑定的目标执行主机 ID（如 "srv-hkg-01"） */
  serverId: z.string(),
  /** 绑定的目标执行主机可读名称（如 "香港网关节点"） */
  serverName: z.string(),
  /** 标准 5 段 Cron 定时表达式（例如 "0 2 * * *" 表示每天凌晨2点执行） */
  expression: z.string(),
  /** 在远程节点执行的 Shell 命令行或脚本路径 */
  command: z.string(),
  /** 任务是否处于启用激活状态（true 为激活自动调度，false 为暂停挂起） */
  enabled: z.boolean(),
  /** 上一次执行触发的 Unix 时间戳（毫秒） */
  lastRunAt: z.number().optional(),
  /** 下一次预计执行触发的 Unix 时间戳（毫秒） */
  nextRunAt: z.number().optional(),
  /** 上一次执行的结果状态（success / failure / running / pending / cancelled） */
  lastStatus: taskStatusSchema.optional()
});
export type Cron = z.infer<typeof cronSchema>;

/**
 * 定时任务列表查询入参契约
 */
export const cronListParamsSchema = z.object({
  /** 搜索关键词（匹配任务名、表达式、指令、主机等） */
  search: z.string().optional(),
  /** 启用状态筛选 */
  enabled: z.boolean().optional(),
  /** 目标执行主机 ID 筛选 */
  serverId: z.string().optional(),
  /** 当前页码 */
  page: z.number().optional(),
  /** 每页条数 */
  pageSize: z.number().optional()
}).optional();
export type CronListParams = z.infer<typeof cronListParamsSchema>;

/**
 * 定时任务列表查询响应契约
 */
export const cronListResultSchema = z.object({
  /** 计划任务规则数组 */
  crons: z.array(cronSchema),
  /** 计划任务总数 */
  total: z.number().optional().default(0)
});

/**
 * 定时任务历史调度执行流水记录（Cron Execution Log）数据契约
 */
export const cronLogSchema = z.object({
  /** 单次执行流水唯一记录 ID */
  id: z.string(),
  /** 归属的父级 Cron 任务 ID */
  cronId: z.string(),
  /** 归属的父级 Cron 任务名称 */
  cronName: z.string(),
  /** 调度执行批次 ID（用于聚合跨多节点的同一次批次调度） */
  batchId: z.string().optional(),
  /** 历次调度批次编号（第 N 次调度，如 128） */
  runNumber: z.number().optional(),
  /** 触发时生效的 Cron 表达式 */
  expression: z.string(),
  /** 执行的目标主机 ID */
  serverId: z.string(),
  /** 执行的目标主机名称 */
  serverName: z.string(),
  /** 实际执行的 Shell 指令 */
  command: z.string(),
  /** 执行结果状态（success: 成功, failure: 失败, running: 执行中） */
  status: taskStatusSchema,
  /** 触发方式：cron (定时时钟自动触发) 或 manual (管理员在控制台手动即时触发) */
  triggerType: z.enum(["cron", "manual"]).default("cron"),
  /** 执行启动的 Unix 时间戳（毫秒） */
  startedAt: z.number(),
  /** 执行结束完成的 Unix 时间戳（毫秒） */
  finishedAt: z.number().optional(),
  /** 执行耗时（毫秒，durationMs） */
  durationMs: z.number().optional(),
  /** 进程退出码（Exit Code，0 为成功退出，非 0 为异常退出） */
  exitCode: z.number().optional(),
  /** 终端标准输出与错误输出（stdout / stderr）文本 */
  output: z.string().optional()
});
export type CronLog = z.infer<typeof cronLogSchema>;

/**
 * 定时任务执行流水日志查询入参契约
 */
export const cronLogListParamsSchema = z.object({
  /** 归属的 Cron 任务 ID */
  cronId: z.string().optional(),
  /** 目标执行主机 ID */
  serverId: z.string().optional(),
  /** 调度批次 ID */
  batchId: z.string().optional(),
  /** 触发类型筛选 */
  triggerType: z.enum(["all", "cron", "manual"]).optional(),
  /** 执行状态筛选 */
  status: z.string().optional(),
  /** 搜索关键词（任务名、命令、主机等） */
  search: z.string().optional(),
  /** 当前页码 */
  page: z.number().optional(),
  /** 每页条数 */
  pageSize: z.number().optional()
}).optional();
export type CronLogListParams = z.infer<typeof cronLogListParamsSchema>;

/**
 * 定时任务执行流水日志列表响应契约
 */
export const cronLogListResultSchema = z.object({
  /** 执行日志记录数组 */
  logs: z.array(cronLogSchema),
  /** 流水日志总记录数 */
  total: z.number().optional().default(0)
});

/**
 * 新增定时任务入参契约
 */
export const cronCreateParamsSchema = z.object({
  /** 任务名称 */
  name: z.string(),
  /** 目标执行主机 ID */
  serverId: z.string(),
  /** Cron 周期表达式 */
  expression: z.string(),
  /** 待执行的 Shell 命令行 */
  command: z.string()
});

/**
 * 更新定时任务入参契约
 */
export const cronUpdateParamsSchema = cronCreateParamsSchema.extend({
  /** 任务 ID */
  id: z.string()
});

/**
 * 启用/禁用定时任务入参契约
 */
export const cronToggleParamsSchema = z.object({
  /** 任务 ID */
  id: z.string(),
  /** 启用状态 */
  enabled: z.boolean()
});

/**
 * 删除定时任务入参契约
 */
export const cronDeleteParamsSchema = z.object({
  /** 任务 ID */
  id: z.string()
});
