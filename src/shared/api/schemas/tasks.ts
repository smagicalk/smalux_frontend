import { z } from "zod";

/**
 * 远程运维命令执行状态枚举
 * - pending: 待审批（高危命令需管理员审批方可执行）
 * - approved: 已审批通过，等待下发调度
 * - running: 正在远程节点执行中
 * - success: 执行完毕且退出码为 0
 * - failed: 执行完毕且退出码非 0（异常报错）
 * - timeout: 远程执行超时被系统强制中断
 */
export const taskStatusSchema = z.enum([
  "pending",
  "approved",
  "running",
  "success",
  "failed",
  "timeout"
]);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

/**
 * 远程批量运维命令执行记录（Task）数据契约 Schema
 */
export const taskSchema = z.object({
  /** 任务唯一记录 ID */
  id: z.string(),
  /** 批量分发批次 ID（一键向多台机器下发时共享相同的 batchId） */
  batchId: z.string().optional(),
  /** 目标执行主机 ID */
  serverId: z.string(),
  /** 目标执行主机可读名称 */
  serverName: z.string(),
  /** 实际执行的 Shell 命令文本 */
  command: z.string(),
  /** 当前任务状态 */
  status: taskStatusSchema,
  /**
   * 命令安全风险等级：
   * - low: 低风险（如查看状态、内存负载等只读命令）
   * - medium: 中风险（如重启服务、清理缓存）
   * - high: 高风险（如 rm -rf、格式化磁盘、修改内核参数，需二次确认或审批）
   */
  risk: z.enum(["low", "medium", "high"]),
  /** 授权操作作用域（如 "node:exec", "cluster:admin"） */
  scope: z.string(),
  /** 执行开始时间戳（毫秒） */
  startedAt: z.number().optional(),
  /** 执行结束时间戳（毫秒） */
  finishedAt: z.number().optional(),
  /** 执行耗时（毫秒） */
  durationMs: z.number().optional(),
  /** 进程退出码（Exit Code） */
  exitCode: z.number().optional(),
  /** 终端回显输出内容（stdout / stderr） */
  output: z.string().optional(),
  /** 高危审批人用户名 */
  approver: z.string().optional()
});
export type Task = z.infer<typeof taskSchema>;

/**
 * 任务列表查询入参契约
 */
export const taskListParamsSchema = z.object({
  /** 搜索关键词（匹配指令、主机名等） */
  search: z.string().optional(),
  /** 执行状态筛选 */
  status: z.string().optional(),
  /** 目标主机 ID 筛选 */
  serverId: z.string().optional(),
  /** 批次 ID 筛选 */
  batchId: z.string().optional(),
  /** 当前页码 */
  page: z.number().optional(),
  /** 每页条数 */
  pageSize: z.number().optional()
}).optional();
export type TaskListParams = z.infer<typeof taskListParamsSchema>;

/**
 * 任务列表查询响应契约
 */
export const taskListResultSchema = z.object({
  /** 任务记录数组 */
  tasks: z.array(taskSchema),
  /** 总任务数 */
  total: z.number()
});

/**
 * 常用命令模板（Task Template）数据契约 Schema
 */
export const taskTemplateSchema = z.object({
  /** 模板唯一 ID */
  id: z.string(),
  /** 模板名称（如 "Docker系统清理", "Nginx配置热重载"） */
  name: z.string(),
  /** 预置的 Shell 执行命令 */
  command: z.string(),
  /** 预估风险等级 */
  risk: z.enum(["low", "medium", "high"]),
  /** 作用域标识 */
  scope: z.string(),
  /** 执行时是否强制需要审批 */
  requiresApproval: z.boolean().optional(),
  /** 模板作用说明与描述 */
  description: z.string().optional()
});
export type TaskTemplate = z.infer<typeof taskTemplateSchema>;

/**
 * 模板列表查询响应契约
 */
export const taskTemplateListResultSchema = z.object({
  /** 模板列表数组 */
  templates: z.array(taskTemplateSchema)
});

/**
 * 动态运维注入变量字典（Task Variable）数据契约 Schema
 */
export const taskVariableSchema = z.object({
  /** 变量占位符键名（如 "$SERVER_ID", "$NOW_TIMESTAMP"） */
  key: z.string(),
  /**
   * 变量分类：
   * - host: 主机元数据（主机名、IP、地域、机房）
   * - time: 时间与周期（当前时间戳、格式化日期）
   * - env: 系统环境变量与自定义配置
   */
  category: z.enum(["host", "time", "env"]),
  /** 变量可读标签显示名称 */
  label: z.string(),
  /** 变量作用详细说明 */
  desc: z.string(),
  /** 运行时代入后的示例取值（如 "srv-tok-01", "2026-08-25"） */
  example: z.string()
});
export type TaskVariable = z.infer<typeof taskVariableSchema>;

/**
 * 动态变量字典查询响应契约
 */
export const taskVariablesResultSchema = z.object({
  /** 变量字典数组 */
  variables: z.array(taskVariableSchema)
});

/**
 * 下发执行命令入参契约
 */
export const taskDispatchParamsSchema = z.object({
  /** 目标服务器 ID */
  serverId: z.string(),
  /** 待执行的 Shell 命令 */
  command: z.string(),
  /** 分发批次 ID */
  batchId: z.string().optional(),
  /** 命令风险评级（默认 low） */
  risk: z.enum(["low", "medium", "high"]).default("low"),
  /** 操作权限作用域（默认 "node:exec"） */
  scope: z.string().default("node:exec")
});

/**
 * 审批高危命令入参契约
 */
export const taskApproveParamsSchema = z.object({
  /** 待审批任务 ID */
  id: z.string()
});
