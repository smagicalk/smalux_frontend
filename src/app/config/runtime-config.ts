import { z } from "zod";

import { isSafeRuntimeEndpoint } from "@/shared/api/url";

/**
 * 运行时端点校验器：确保只能配置合法的相对路径或 http(s)/ws(s) URL
 */
const runtimeEndpointSchema = z.string().min(1).refine(isSafeRuntimeEndpoint, {
  message: "端点必须为相对路径或合法的 http(s)/ws(s) URL"
});

/**
 * 传输层模式枚举：
 * - mock: 本地仿真数据
 * - ws: 生产标准 WebSocket 长连接
 * - http: 纯无状态 HTTP
 */
const transportSchema = z.enum(["mock", "ws", "http"]).default("mock");

/**
 * 全局运行时动态配置 Schema（从 /app-config.json 加载）
 */
const runtimeConfigSchema = z.object({
  /** 应用标题名称 */
  appName: z.string().min(1).default("smalux"),
  /** 传统 API 基础路径 */
  apiBaseUrl: runtimeEndpointSchema.default("/api"),
  /** WebSocket 长连接服务地址 */
  wsBaseUrl: runtimeEndpointSchema.default("/ws"),
  /** JSON-RPC HTTP 基础路径 */
  rpcBaseUrl: runtimeEndpointSchema.default("/rpc"),
  /** 当前启用的通信传输模式 */
  transport: transportSchema,
  /** 主题风格 */
  theme: z.enum(["light", "dark", "system"]).default("system")
});

export type TransportMode = z.infer<typeof transportSchema>;
export type RuntimeConfig = z.infer<typeof runtimeConfigSchema>;

/**
 * 默认基础兜底配置（当 /app-config.json 请求失败或字段不全时采用）
 */
export const defaultRuntimeConfig: RuntimeConfig = {
  appName: "smalux",
  apiBaseUrl: "/api",
  wsBaseUrl: "/ws",
  rpcBaseUrl: "/rpc",
  transport: "mock",
  theme: "system"
};

/**
 * 在应用启动前异步加载运行时配置（/app-config.json）
 * 
 * 禁用浏览器缓存（cache: "no-store"），允许运维人员在不重新编译打包前端静态文件的情况下，
 * 直接修改部署目录下的 app-config.json 变更后端连接地址或切换 Transport。
 * 
 * @param fetcher fetch 请求函数实现（允许测试注入）
 * @returns 解析后的 RuntimeConfig
 */
export async function loadRuntimeConfig(
  fetcher: typeof fetch = fetch
): Promise<RuntimeConfig> {
  try {
    const response = await fetcher("/app-config.json", {
      cache: "no-store"
    });

    if (!response.ok) {
      return defaultRuntimeConfig;
    }

    return runtimeConfigSchema.parse(await response.json());
  } catch {
    return defaultRuntimeConfig;
  }
}
