import { z } from "zod";

/**
 * 前端外观主题包（Theme Package）数据契约 Schema
 */
export const themeSchema = z.object({
  /** 主题唯一 ID */
  id: z.string(),
  /** 主题显示名称（如 "Smalux Dark Neon", "Classic Obsidian"） */
  name: z.string(),
  /**
   * 主题发布生命周期状态：
   * - draft: 草稿调试中
   * - published: 已发布并设为当前生效主题
   * - archived: 已归档下线
   */
  status: z.enum(["draft", "published", "archived"]),
  /** 是否向未登录访客公开展示该主题 */
  publicVisible: z.boolean(),
  /** 主题版本号（语义化版本，如 "1.2.0"） */
  version: z.string(),
  /** 最近一次更新打包的时间戳（毫秒） */
  updatedAt: z.number(),
  /** 主题设计创作者/作者名 */
  author: z.string()
});
export type Theme = z.infer<typeof themeSchema>;

/**
 * 主题包列表查询响应契约
 */
export const themeListResultSchema = z.object({
  /** 主题包列表数组 */
  themes: z.array(themeSchema)
});

/**
 * 上传新主题包入参契约
 */
export const themeUploadParamsSchema = z.object({
  /** 主题名称 */
  name: z.string(),
  /** 主题版本号（默认 "0.1.0"） */
  version: z.string().default("0.1.0")
});

/**
 * 发布激活主题入参契约
 */
export const themePublishParamsSchema = z.object({
  /** 主题 ID */
  id: z.string()
});

/**
 * 归档下架主题入参契约
 */
export const themeArchiveParamsSchema = z.object({
  /** 主题 ID */
  id: z.string()
});
