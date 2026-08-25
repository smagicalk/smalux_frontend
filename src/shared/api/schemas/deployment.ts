import { z } from "zod";

/**
 * 前端与系统部署运行架构模式枚举
 * - static: 纯静态资源 CDN 托管（Nginx/OSS）
 * - nginx: Nginx 反向代理与动态 API 分流
 * - rust-embed: Rust 原生单二进制内置静态资源打包
 */
export const deploymentModeSchema = z.enum(["static", "nginx", "rust-embed"]);
export type DeploymentMode = z.infer<typeof deploymentModeSchema>;

/**
 * 发布部署目标环境（Deployment Target）数据契约 Schema
 */
export const deploymentTargetSchema = z.object({
  /** 部署目标唯一 ID */
  id: z.string(),
  /** 运行架构模式 */
  mode: deploymentModeSchema,
  /** 部署架构名称（如 "纯静态 CDN", "Nginx 反代", "Rust 内置 embed"） */
  name: z.string(),
  /** 部署产物构建状态（ready: 就绪可用, building: 正在编译打包, failed: 构建失败） */
  status: z.enum(["ready", "building", "failed"]),
  /** 最近构建或切换的时间戳（毫秒） */
  updatedAt: z.number(),
  /** 维护复杂度（low: 低, medium: 中, high: 高） */
  complexity: z.enum(["low", "medium", "high"])
});
export type DeploymentTarget = z.infer<typeof deploymentTargetSchema>;

/**
 * 部署架构列表查询响应契约
 */
export const deploymentListResultSchema = z.object({
  /** 各部署模式构建状态列表 */
  targets: z.array(deploymentTargetSchema),
  /** 当前正在运行的部署模式 */
  current: deploymentModeSchema.optional()
});

/**
 * 切换系统部署发布模式入参契约
 */
export const deploymentSwitchParamsSchema = z.object({
  /** 目标部署模式 */
  mode: deploymentModeSchema
});
