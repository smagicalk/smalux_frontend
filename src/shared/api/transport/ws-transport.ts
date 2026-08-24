import { z } from "zod";

import { createWebSocketUrl } from "@/shared/api/url";
import type { RuntimeConfig } from "@/app/config/runtime-config";
import type { Transport, Unsubscribe, NotificationHandler } from "./types";
import { RpcError } from "./types";

/**
 * 传输层时钟策略配置：
 * - HEARTBEAT_INTERVAL_MS: 心跳探测间隔（30秒），主动发现半开连接并触发重连
 * - CALL_TIMEOUT_MS: 单次 RPC 请求超时时间（10秒），防止 Socket 假死挂起查询
 * - RECONNECT_DELAY_MS: 断线重连等待延迟（1秒）
 */
const HEARTBEAT_INTERVAL_MS = 30_000;
const CALL_TIMEOUT_MS = 10_000;
const RECONNECT_DELAY_MS = 1_000;

/**
 * JSON-RPC 2.0 基础报文接口
 */
interface RpcResponse {
  jsonrpc: "2.0";
  id?: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
  method?: string;
  params?: unknown;
}

/**
 * 等待响应中的挂起请求（用于单 Socket 多路复用请求应答关联）
 */
interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

/**
 * 本地活跃订阅项
 */
interface Subscription {
  method: string;
  /** 注册时的原始参数，用于重连后的订阅重放（Replay） */
  params: unknown;
  /** 业务分发回调 */
  handler: NotificationHandler;
  /** 推送数据校验 Schema */
  schema: z.ZodType;
}

/**
 * 生成唯一的请求 ID（优先使用标准 crypto.randomUUID）
 */
function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * 单长连接多路复用 WebSocket 传输层（WsTransport）
 * 
 * 核心架构特性：
 * 1. **单连接多路复用（Multiplexing）**：整个应用共享单个 WebSocket 实例，通过唯一的 JSON-RPC `id` 进行请求与响应的关联匹配。
 * 2. **服务端主动推流路由（Server-Push Routing）**：服务端无 `id` 的通知帧按 `method` 分发给所有已注册订阅者。
 * 3. **并发安全与懒加载**：初次请求时建立连接，并发发起的请求共享同一个连接建立 Promise，不会产生重复 Socket。
 * 4. **心跳保活与异常自愈**：定时下发 `system.ping` 探测链路健康，断线时立即 Reject 挂起请求并自动触发延迟重连。
 * 5. **断线重连订阅自动恢复（Subscription Replay）**：Socket 重连成功后自动重新下发流订阅控制命令。
 * 6. **严格数据隔离校验**：每个请求和推送均使用独立的 Zod Schema 运行时校验，解析错误不会干扰其他请求或导致崩溃。
 */
export class WsTransport implements Transport {
  private ws: WebSocket | null = null;
  private connectPromise: Promise<void> | null = null;
  /** 挂起请求表：Key 为请求 id */
  private pending = new Map<string, PendingRequest>();
  /** 活跃订阅表：Key 为本地生成的 subId */
  private subscriptions = new Map<string, Subscription>();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private hasOpened = false;
  private disposed = false;

  constructor(private readonly runtimeConfig: RuntimeConfig) {}

  /**
   * 检查 WebSocket 是否处于就绪打开状态
   */
  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * 发起请求/响应式的 JSON-RPC 调用
   */
  async call<TResult>(
    method: string,
    params: unknown,
    schema: z.ZodType<TResult>
  ): Promise<TResult> {
    await this.ensureConnected();
    return new Promise<TResult>((resolve, reject) => {
      const id = createId();
      // 请求超时控制：超时自动清理 pending 记录并拒绝
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`RPC ${method} timed out`));
      }, CALL_TIMEOUT_MS);

      this.pending.set(id, {
        resolve: (value) => {
          // safeParse 确保仅此 Promise 捕获校验失败，不破坏共享连接
          const parsed = schema.safeParse(value);
          if (parsed.success) {
            resolve(parsed.data);
          } else {
            reject(parsed.error);
          }
        },
        reject,
        timeout
      });

      this.send({ jsonrpc: "2.0", id, method, params });
    });
  }

  /**
   * 注册服务端推送数据订阅
   */
  subscribe<TResult>(
    method: string,
    params: unknown,
    schema: z.ZodType<TResult>,
    handler: NotificationHandler<TResult>
  ): Unsubscribe {
    const subId = createId();
    this.subscriptions.set(subId, {
      method,
      params,
      handler: handler as NotificationHandler,
      schema: schema as z.ZodType
    });

    // 向后端发送流开启控制命令（如 "agent.summary.subscribe.start"）
    this.startSubscription(method, params);

    return () => {
      // 本地注销该订阅者的分发
      this.subscriptions.delete(subId);
    };
  }

  /**
   * 确保底层 WebSocket 连接已就绪
   */
  private ensureConnected(): Promise<void> {
    if (this.disposed) {
      return Promise.reject(new Error("transport disposed"));
    }
    if (this.ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }
    if (this.connectPromise) {
      // 多个组件并发调用时，复用同一个建立连接的 Promise
      return this.connectPromise;
    }
    this.connectPromise = this.connect();
    return this.connectPromise;
  }

  /**
   * 建立真实底层 WebSocket 实例并挂载生命周期监听
   */
  private connect(): Promise<void> {
    const url = createWebSocketUrl(this.runtimeConfig.wsBaseUrl, "");
    this.ws = new WebSocket(url);

    return new Promise<void>((resolve, reject) => {
      const ws = this.ws!;
      let opened = false;
      ws.addEventListener("open", () => {
        opened = true;
        this.startHeartbeat();
        this.connectPromise = null;
        const shouldResumeSubscriptions = this.hasOpened;
        this.hasOpened = true;
        resolve();
        // 若之前曾建立过连接，说明此为断线重连，自动重放历史订阅
        if (shouldResumeSubscriptions) {
          this.resumeSubscriptions();
        }
      });
      ws.addEventListener("error", () => {
        this.connectPromise = null;
        reject(new Error("WebSocket connection failed"));
      });
      ws.addEventListener("message", (event) => this.onMessage(event));
      ws.addEventListener("close", () => {
        this.onClose();
        // 尚未 open 就 close 的场景显式 reject，避免连接泄露
        if (!opened) {
          reject(new Error("WebSocket closed before opening"));
        }
      });
    });
  }

  /**
   * 处理接收到的所有 WebSocket 帧
   */
  private onMessage(event: MessageEvent) {
    let payload: RpcResponse;
    try {
      payload = JSON.parse(event.data as string);
    } catch {
      // 忽略无法解析的脏数据帧，不中断整体连接
      return;
    }

    // 场景 A：服务端主动推送的通知（Notification，无 id，带 method）
    if (payload.id === undefined || payload.id === null) {
      if (payload.method) {
        for (const sub of this.subscriptions.values()) {
          if (sub.method === payload.method) {
            try {
              sub.handler(sub.schema.parse(payload.params));
            } catch {
              // 单个订阅者的解析失败予以隔离，不影响其他订阅者
            }
          }
        }
      }
      return;
    }

    // 场景 B：针对之前发出的 RPC 请求的响应回复
    const pending = this.pending.get(String(payload.id));
    if (!pending) return;
    this.pending.delete(String(payload.id));
    clearTimeout(pending.timeout);

    if (payload.error) {
      pending.reject(
        new RpcError(payload.error.code, payload.error.message, payload.error.data)
      );
    } else {
      pending.resolve(payload.result);
    }
  }

  /**
   * 处理 WebSocket 断开连接事件
   */
  private onClose() {
    this.stopHeartbeat();
    this.ws = null;
    this.connectPromise = null;

    // 连接已断开，立即失败所有正在挂起等待响应的请求
    for (const [, req] of this.pending) {
      clearTimeout(req.timeout);
      req.reject(new Error("WebSocket closed"));
    }
    this.pending.clear();

    if (this.disposed) return;

    // 安排自动重连
    this.reconnectTimer = setTimeout(() => {
      this.ensureConnected().catch(() => {
        // 重连失败，等待下一次重试周期
      });
    }, RECONNECT_DELAY_MS);
  }

  /**
   * 启动定时链路健康探测心跳
   */
  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState !== WebSocket.OPEN) {
        this.stopHeartbeat();
        return;
      }
      // 发送轻量 system.ping 保持长连接活跃并及时探测静默断线
      this.call("system.ping", [], z.unknown()).catch(() => {
        this.ws?.close();
      });
    }, HEARTBEAT_INTERVAL_MS);
  }

  /**
   * 重连成功后自动重播本地所有活跃订阅
   */
  private resumeSubscriptions() {
    for (const subscription of this.subscriptions.values()) {
      this.startSubscription(subscription.method, subscription.params);
    }
  }

  /**
   * 向服务端下发流开启命令（Best-effort 机制）
   */
  private startSubscription(method: string, params: unknown) {
    void this.call(`${method}.start`, params, z.unknown()).catch(() => {
      // 某些后端可能使用隐式订阅模式，失败时不阻断本地路由
    });
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 序列化并发送 WebSocket 文本帧
   */
  private send(message: unknown) {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not open");
    }
    this.ws.send(JSON.stringify(message));
  }

  /**
   * 终结并销毁传输层实例
   */
  dispose() {
    this.disposed = true;
    this.stopHeartbeat();
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    for (const [, req] of this.pending) {
      clearTimeout(req.timeout);
      req.reject(new Error("transport disposed"));
    }
    this.pending.clear();
    this.subscriptions.clear();
    this.ws?.close();
    this.ws = null;
  }
}
