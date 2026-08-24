import type { z } from "zod";

/**
 * 取消订阅回调函数
 * 
 * 调用此函数将停止接收特定服务端推送流（Notification）的数据通知
 */
export type Unsubscribe = () => void;

/**
 * 服务端推送通知（Notification）的处理函数
 * 
 * 当服务端推送匹配已订阅方法的消息（不含 JSON-RPC id 的通知帧）时被调用
 * 
 * @template T 推送的数据类型
 * @param params 解析验证后的推送参数数据
 */
export type NotificationHandler<T = unknown> = (params: T) => void;

/**
 * 底层通信传输抽象接口（Transport）
 * 
 * 这是前端 RPC 客户端交互的唯一通信抽象。它统一屏蔽了底层通信介质的差异：
 * - 真实 WebSocket 长连接（WsTransport）：支持双向请求/响应与高频推流
 * - HTTP 无状态接口（HttpTransport）：降级与纯无状态请求/响应
 * - 内存 Mock 仿真（MockTransport）：用于本地开发、测试与离线演示
 * 
 * 核心方法：
 * - `call()`: 请求/响应模型，返回经过 Zod Schema 校验解析后的业务结果
 * - `subscribe()`: 服务端主动推送流订阅模型，返回取消订阅函数
 * 
 * 所有 Transport 实现均具有完全相同的接口契约，因此在真实后端与 Mock 间切换仅需修改运行配置（app-config.json），无需改动业务代码。
 */
export interface Transport {
  /**
   * 执行单次 JSON-RPC 请求并校验响应结果
   * 
   * 实现类必须在返回数据前完成通信失败拦截、JSON-RPC 错误解析及 Zod Schema 契约校验，
   * 确保进入 React Query 缓存及业务 Hook 的数据 100% 结构合法。
   * 
   * @template TResult 期望的返回数据类型
   * @param method JSON-RPC 方法名（如 "agent.list", "overview.stats"）
   * @param params 请求参数
   * @param schema 用于运行时校验返回结果的 Zod Schema
   * @returns 校验后的业务结果 Promise
   */
  call<TResult>(
    method: string,
    params: unknown,
    schema: z.ZodType<TResult>
  ): Promise<TResult>;

  /**
   * 注册服务端推送方法监听器
   * 
   * 返回的清理函数仅管理本地订阅状态，具有幂等性（在 React StrictMode 下多次调用亦安全）。
   * 不支持推送能力的传输层（如纯 HTTP）可返回空操作清理函数。
   * 
   * @template TResult 期望接收的推送数据类型
   * @param method 订阅的方法名（如 "agent.summary.subscribe"）
   * @param params 订阅附带参数（如过滤的 serverIds）
   * @param schema 用于运行时校验推送数据的 Zod Schema
   * @param handler 接收到推送数据时的业务回调函数
   * @returns 取消订阅函数
   */
  subscribe<TResult>(
    method: string,
    params: unknown,
    schema: z.ZodType<TResult>,
    handler: NotificationHandler<TResult>
  ): Unsubscribe;

  /**
   * 当前传输层是否可用
   * - 对于 WebSocket：表示 socket 是否处于 OPEN 状态
   * - 对于无状态 HTTP / Mock：表示是否具备发请求能力
   */
  readonly connected: boolean;

  /**
   * 释放底层资源（包括关闭 WebSocket、清理心跳定时器、终止重连任务等）
   */
  dispose(): void;
}

/**
 * JSON-RPC 服务端业务/协议错误
 * 
 * 明确区分于底层网络断连或本地解码错误。
 * RpcClient 不应对 RpcError 盲目进行传输层重试（例如不能降级重放写操作），
 * 避免造成变更重复提交或掩盖服务端权威业务校验失败。
 */
export class RpcError extends Error {
  /** JSON-RPC 错误码（如 -32600: 无效请求, -32601: 方法不存在, 自定义业务错误码等） */
  code: number;
  /** 附加错误数据对象 */
  data?: unknown;

  constructor(code: number, message: string, data?: unknown) {
    super(message);
    this.name = "RpcError";
    this.code = code;
    this.data = data;
  }
}
