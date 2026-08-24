import { z } from "zod";

import type { RuntimeConfig } from "@/app/config/runtime-config";
import type { Transport, Unsubscribe, NotificationHandler } from "./types";
import type { MockBackend } from "@/shared/api/mock/mock-backend";

/**
 * 内存 Mock 仿真传输层（MockTransport）
 * 
 * 将所有 RPC 调用和推流订阅直接分发给内存中的 `MockBackend` 仿真后端。
 * 
 * 核心设计：
 * 1. **完全等价的协议表面**：与真实 WsTransport / HttpTransport 拥有完全相同的抽象契约，
 *    使切换 `app-config.json` 中的 `transport: "mock" | "ws"` 能在前端零改动下平滑无缝切换。
 * 2. **异步时序模拟**：调用内部通过 `delay(0)` 产生事件循环让步，模拟真实网络请求的异步边界与 Loading 状态。
 * 3. **严格契约校验**：Mock 数据同样必须通过调用方提供的 Zod Schema 强类型校验，避免本地 Mock 数据结构过时与真实后端漂移。
 * 4. **推流与历史回放模拟**：订阅时同步回放 `initialBatch` 历史数据，并通过内部定时器按周期推送增量监控帧。
 */
export class MockTransport implements Transport {
  readonly connected = true;
  private timers = new Set<ReturnType<typeof setInterval>>();

  constructor(
    private readonly runtimeConfig: RuntimeConfig,
    private readonly backend: MockBackend
  ) {}

  /**
   * 执行 Mock 请求分发并进行 Zod 校验
   */
  async call<TResult>(
    method: string,
    params: unknown,
    schema: z.ZodType<TResult>
  ): Promise<TResult> {
    // 模拟微任务微延迟，使得组件的 Loading 与缓存生命周期行为与真实网络请求一致
    await delay(0);
    const result = await this.backend.handle(method, params);
    return schema.parse(result);
  }

  /**
   * 注册 Mock 实时推流
   */
  subscribe<TResult>(
    method: string,
    params: unknown,
    schema: z.ZodType<TResult>,
    handler: NotificationHandler<TResult>
  ): Unsubscribe {
    const stream = this.backend.subscribe(method, params);
    if (!stream) {
      return () => {};
    }

    const push = (raw: unknown) => {
      try {
        handler(schema.parse(raw));
      } catch {
        // 忽略单帧 Mock 样本解析失败
      }
    };

    // 1. 同步推送历史回放数据（使图表初次渲染即有连续折线）
    if (stream.initialBatch) {
      for (const raw of stream.initialBatch()) push(raw);
    }

    // 2. 启动周期性定时器模拟实时推流
    const timer = setInterval(() => {
      if (stream.sampleBatch) {
        for (const raw of stream.sampleBatch()) push(raw);
      } else if (stream.sample) {
        push(stream.sample());
      }
    }, stream.intervalMs);

    this.timers.add(timer);

    return () => {
      clearInterval(timer);
      this.timers.delete(timer);
    };
  }

  /**
   * 清理并销毁所有正在运行的 Mock 推流定时器
   */
  dispose() {
    for (const timer of this.timers) {
      clearInterval(timer);
    }
    this.timers.clear();
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
