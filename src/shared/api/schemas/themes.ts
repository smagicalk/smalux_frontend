import { z } from "zod";

/**
 * 状态页模板的单个可配置参数字段 Schema
 */
export const themeSchemaFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(["string", "text", "boolean", "number", "select"]),
  defaultValue: z.unknown(),
  description: z.string().optional(),
  options: z.array(z.object({ label: z.string(), value: z.string() })).optional()
});
export type ThemeSchemaField = z.infer<typeof themeSchemaFieldSchema>;

/**
 * 前端外观主题包（Theme Package）数据契约 Schema
 * 后端完整存储主题的全量数据，包括配置 Schema 与可选的自定义 HTML
 */
export const themeSchema = z.object({
  /** 主题唯一 ID */
  id: z.string(),
  /** 主题显示名称（如 "Smalux Dark Neon", "Classic Obsidian"） */
  name: z.string(),
  /**
   * 主题发布生命周期状态：
   * - draft: 草稿调试中
   * - published: 已发布，是当前公开状态页展示的大盘（所有人可见）
   * - archived: 已归档下线，不再展示
   */
  status: z.enum(["draft", "published", "archived"]),
  /** 是否向未登录访客公开展示该主题 */
  publicVisible: z.boolean(),
  /** 主题版本号（语义化版本，如 "1.2.0"） */
  version: z.string(),
  /** 最近一次更新打包的时间戳（毫秒） */
  updatedAt: z.number(),
  /** 主题设计创作者/作者名 */
  author: z.string(),
  /** 是否为系统内置主题（内置主题不可删除） */
  isBuiltin: z.boolean().default(false),
  /** 主题功能说明与简介 */
  description: z.string().default(""),
  /** 主题动态配置参数 Schema 字段列表（决定参数配置弹窗的表单项） */
  configSchema: z.array(themeSchemaFieldSchema).default([]),
  /** 上传的第三方独立 HTML 页面源码（内置主题无此字段） */
  customHtml: z.string().optional()
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
 * 上传新主题包入参契约（含完整 schema，后端全量存储）
 */
export const themeUploadParamsSchema = z.object({
  /** 主题名称 */
  name: z.string(),
  /** 主题版本号（默认 "0.1.0"） */
  version: z.string().default("0.1.0"),
  /** 主题说明 */
  description: z.string().optional(),
  /** 参数配置 Schema 字段列表 */
  configSchema: z.array(themeSchemaFieldSchema).optional(),
  /** 第三方自定义 HTML 页面源码 */
  customHtml: z.string().optional()
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
