import { z } from "zod";

/**
 * 全局系统运行配置项（Setting）数据契约 Schema
 */
export const settingSchema = z.object({
  /** 配置项键名（如 "site.name", "security.csrfProtection", "limits.taskConcurrency"） */
  key: z.string(),
  /** 配置项中文可读标签名称（如 "站点名称", "任务并发上限"） */
  label: z.string(),
  /** 配置项当前取值（字符串序列化存储） */
  value: z.string(),
  /**
   * 配置项所属功能分组：
   * - general: 常规基础设置（站点名称、默认语言等）
   * - security: 安全与防护设置（HTTPS 强制、CSRF、Cookie策略）
   * - limits: 阈值与容量配额限制（任务并发、Token TTL、上传限制）
   * - network: 网络通信参数（Ping 间隔、监控遥测上报步长）
   */
  group: z.enum(["general", "security", "limits", "network"]),
  /** 该配置项是否允许在前端控制台直接编辑修改 */
  editable: z.boolean().default(true)
});
export type Setting = z.infer<typeof settingSchema>;

/**
 * 系统配置列表查询响应契约
 */
export const settingListResultSchema = z.object({
  /** 配置项数组 */
  settings: z.array(settingSchema)
});

/**
 * 保存/更新配置项入参契约
 */
export const configUpdateParamsSchema = z.object({
  /** 配置键名 */
  key: z.string(),
  /** 新的配置值 */
  value: z.string()
});
