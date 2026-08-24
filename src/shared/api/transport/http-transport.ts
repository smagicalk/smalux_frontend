import { z } from "zod";

import type { RuntimeConfig } from "@/app/config/runtime-config";
import { joinUrl } from "@/shared/api/url";
import type { Transport, Unsubscribe, NotificationHandler } from "./types";
import { RpcError } from "./types";

/**
 * JSON-RPC 2.0 基础响应信封 Schema
 * 
 * 先校验协议格式（信封），再校验具体的 `result` 业务数据，明确区分协议故障与业务数据不匹配。
 */
const rpcResponseSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.union([z.string(), z.number(), z.null()]).optional(),
  result: z.unknown().optional(),
  error: z
    .object({
      code: z.number(),
      message: z.string(),
      data: z.unknown().optional()
    })
    .optional()
});

/**
 * 创建单次无状态请求的随机关联 ID
 */
function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * 无状态 HTTP 传输层（HttpTransport）
 * 
 * 每次 `call()` 发起一次标准的 HTTP POST 请求到配置的 RPC 端点。
 * 
 * 适用场景：
 * 1. 独立 HTTP 模式（transport = "http"）
 * 2. 作为 WebSocket 传输层断线时的只读/容灾降级通道（Fallback）
 * 
 * 特性说明：
 * - `connected`: 恒为 true，因为 fetch 属于无状态请求，无需持久连接。
 * - `subscribe()`: HTTP 无法接收服务端主动推流，返回空清理函数，上层业务 Hook 可降级为轮询。
 */
export class HttpTransport implements Transport {
  readonly connected = true;

  constructor(private readonly runtimeConfig: RuntimeConfig) {}

  /**
   * 执行单个无状态 HTTP POST 请求
   * 
   * @param method RPC 方法名
   * @param params 请求入参
   * @param schema 结果校验 Schema
   */
  async call<TResult>(
    method: string,
    params: unknown,
    schema: z.ZodType<TResult>
  ): Promise<TResult> {
    const url = joinUrl(this.runtimeConfig.rpcBaseUrl, "");
    const response = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: createId(), method, params })
    });

    // HTTP 状态码异常视为网络传输层错误
    if (!response.ok) {
      throw new Error(`RPC HTTP ${response.status}: ${response.statusText}`);
    }

    const payload = rpcResponseSchema.parse(await response.json());
    // 处理服务端返回的明确业务错误
    if (payload.error) {
      throw new RpcError(payload.error.code, payload.error.message, payload.error.data);
    }
    // 强制进行 Zod Schema 校验后返回
    return schema.parse(payload.result);
  }

  /**
   * HTTP 模式不支持服务端推流，返回空清理函数
   */
  subscribe<TResult>(
    _method: string,
    _params: unknown,
    _schema: z.ZodType<TResult>,
    _handler: NotificationHandler<TResult>
  ): Unsubscribe {
    return () => {};
  }

  dispose() {
    // fetch 无需特殊销毁
  }
}
