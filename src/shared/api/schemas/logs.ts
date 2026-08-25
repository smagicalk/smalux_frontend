import { z } from "zod";

/**
 * 全局系统操作审计流水日志（Audit Log）数据契约 Schema
 */
export const logSchema = z.object({
  /** 审计日志唯一 ID */
  id: z.string(),
  /** 发生事件的时间戳（毫秒） */
  ts: z.number(),
  /** 执行操作的人员/发起方主体（如 "admin", "system", "devops_user"） */
  actor: z.string(),
  /**
   * 触发操作的子系统模块：
   * - auth: 身份认证与登录登出
   * - task: 远程命令执行与分发
   * - cron: 定时调度规则修改与触发
   * - token: API 令牌签发与吊销
   * - theme: 系统外观与主题上传
   * - config: 系统级全局配置项修改
   * - terminal: 网页终端 WebShell 登录操作
   * - alert: 告警策略与通知渠道变更
   */
  module: z.enum([
    "auth",
    "task",
    "cron",
    "token",
    "theme",
    "config",
    "terminal",
    "alert"
  ]),
  /** 操作行为描述（如 "更新告警规则", "下发远程脚本", "生成新Token"） */
  action: z.string(),
  /** 操作执行结果（success: 成功, failure: 失败/被拒绝） */
  result: z.enum(["success", "failure"]),
  /** 被操作的目标实体对象（如 "srv-hkg-01", "cron-backup-01"） */
  target: z.string().optional(),
  /** 发起请求的操作者来源 IP 地址（如 "192.168.1.100"） */
  ip: z.string().optional(),
  /** 异常详情或操作附加参数说明 */
  detail: z.string().optional()
});
export type Log = z.infer<typeof logSchema>;

/**
 * 审计日志列表筛选过滤入参契约
 */
export const logListParamsSchema = z
  .object({
    /** 模糊搜索关键词（匹配操作者、行为或目标） */
    search: z.string().optional(),
    /** 按子系统模块过滤 */
    module: z.string().optional(),
    /** 按执行结果过滤 */
    result: z.enum(["success", "failure"]).optional()
  })
  .default({});

/**
 * 审计日志列表查询响应契约
 */
export const logListResultSchema = z.object({
  /** 审计日志列表数组 */
  logs: z.array(logSchema),
  /** 匹配的总日志记录条数 */
  total: z.number()
});
