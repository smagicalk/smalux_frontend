import { z } from "zod";

import type { RuntimeConfig } from "@/app/config/runtime-config";
import type { Transport, Unsubscribe, NotificationHandler } from "./types";
import type { MockBackend } from "@/shared/api/mock/mock-backend";

/**
 * Transport that dispatches every call to an in-memory mock backend.
 * This is the "mock backend" landing point: the same surface as the real
 * transports, so flipping `app-config.json` transport from `mock` to `ws`
 * swaps the backend without touching hooks or pages.
 *
 * Subscriptions are simulated with setInterval pushing fresh samples.
 */
export class MockTransport implements Transport {
  readonly connected = true;
  private timers = new Set<ReturnType<typeof setInterval>>();

  constructor(
    private readonly runtimeConfig: RuntimeConfig,
    private readonly backend: MockBackend
  ) {}

  async call<TResult>(
    method: string,
    params: unknown,
    schema: z.ZodType<TResult>
  ): Promise<TResult> {
    // Yield to the event loop so callers see async behavior even though the
    // mock is synchronous — keeps loading states realistic.
    await delay(0);
    const result = await this.backend.handle(method, params);
    return schema.parse(result);
  }

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
        // Ignore parse failures on mock push.
      }
    };
    // Deliver the back-log first so charts have history on first paint.
    if (stream.initialBatch) {
      for (const raw of stream.initialBatch()) push(raw);
    }
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
