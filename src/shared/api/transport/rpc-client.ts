import type { z } from "zod";

import type { RuntimeConfig } from "@/app/config/runtime-config";
import type { Transport, Unsubscribe, NotificationHandler } from "./types";
import { RpcError } from "./types";
import { WsTransport } from "./ws-transport";
import { HttpTransport } from "./http-transport";
import { MockTransport } from "./mock-transport";
import { createMockBackend } from "@/shared/api/mock/mock-backend";

/**
 * 全局统一 RPC 客户端（RPC Client）
 * 
 * 这是整个前端所有数据请求与订阅交互的唯一入口点。
 * 业务 Hook 仅需调用：
 * - `rpcClient.call(method, params, schema)` 发起单次请求
 * - `rpcClient.subscribe(method, params, schema, handler)` 订阅实时流
 * 
 * 核心特性：
 * 1. 运行时传输层自适应：根据 RuntimeConfig 自动装配 Mock / WebSocket / HTTP。
 * 2. 智能容灾降级（Fallback）：在 WS 模式下，若 Socket 未连接或断开，且错误非服务端权威业务拒绝（RpcError），
 *    自动通过 HTTP Fallback 尝试发送请求，对业务上层透明，避免页面直接白屏或完全不可用。
 * 3. 严格数据契约：所有经过的数据必须通过 Zod Schema 强类型校验。
 */
export class RpcClient {
  /** 当前主传输层实例 */
  private transport: Transport;
  /** 显式注入的传输层（用于测试隔离） */
  private explicit: Transport | null = null;
  /** WS 模式下的 HTTP 降级备选通道 */
  private readonly httpFallback: HttpTransport | null;

  constructor(private readonly runtimeConfig: RuntimeConfig) {
    this.transport = this.buildTransport();
    this.httpFallback = runtimeConfig.transport === "ws"
      ? new HttpTransport(runtimeConfig)
      : null;
  }

  /**
   * 手动注入/覆盖传输层（主要用于单元测试或独立环境集成）
   * 
   * 显式设置后将禁用自动 HTTP Fallback，确保测试行为具有确定性。
   */
  setTransport(transport: Transport) {
    this.explicit = transport;
    this.transport = transport;
  }

  /**
   * 当前主传输层是否连通
   */
  get connected(): boolean {
    return this.transport.connected;
  }

  /**
   * 执行 JSON-RPC 请求并校验响应
   * 
   * @template TResult 响应数据类型
   * @param method 方法名（如 "agent.list"）
   * @param params 请求参数
   * @param schema 校验返回值的 Zod Schema
   * @returns 校验通过的数据 Promise
   */
  async call<TResult>(
    method: string,
    params: unknown,
    schema: z.ZodType<TResult>
  ): Promise<TResult> {
    try {
      return await this.transport.call(method, params, schema);
    } catch (error) {
      // 仅在主 Socket 确实未连通、且错误不是明确的服务端业务拒绝（RpcError）时，尝试 HTTP 降级。
      // 如果 Socket 连通但返回 Schema 校验失败，说明前后端契约不匹配，必须暴露错误，绝不能盲目重发。
      const canFallback =
        this.explicit === null &&
        this.httpFallback !== null &&
        !this.transport.connected &&
        !(error instanceof RpcError);
      if (!canFallback) throw error;
      return this.httpFallback.call(method, params, schema);
    }
  }

  /**
   * 订阅服务端推送流（如遥测监控 "agent.summary.subscribe"）
   * 
   * @template TResult 推送数据类型
   * @param method 订阅方法名
   * @param params 订阅参数
   * @param schema 校验推送数据的 Zod Schema
   * @param handler 接收推送的回调函数
   * @returns 取消订阅函数
   */
  subscribe<TResult>(
    method: string,
    params: unknown,
    schema: z.ZodType<TResult>,
    handler: NotificationHandler<TResult>
  ): Unsubscribe {
    // 订阅行为由具体传输层承载：WebSocket 支持双向推流；HTTP 模式下为 no-op，业务层可结合 refetchInterval 轮询。
    return this.transport.subscribe(method, params, schema, handler);
  }

  /**
   * 释放客户端占用的全部底层资源（Socket、定时器、降级通道等）
   */
  dispose() {
    this.transport.dispose();
    this.httpFallback?.dispose();
  }

  /**
   * 根据运行时配置初始化底层通信通道
   */
  private buildTransport(): Transport {
    switch (this.runtimeConfig.transport) {
      case "ws":
        return new WsTransport(this.runtimeConfig);
      case "http":
        return new HttpTransport(this.runtimeConfig);
      case "mock":
      default:
        return new MockTransport(this.runtimeConfig, createMockBackend());
    }
  }
}
