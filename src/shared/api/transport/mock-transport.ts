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
 * Calls deliberately yield once before dispatch so query loading states and
 * cancellation timing resemble a remote transport. Results and push samples
 * still pass through caller-provided Zod schemas, preventing mock fixtures from
 * becoming a less strict contract than HTTP or WebSocket data.
 *
 * Subscriptions deliver any back-dated `initialBatch` synchronously, then use a
 * transport-owned interval for live samples. Invalid samples are isolated and
 * skipped; they do not terminate the stream or block other valid samples.
 */
export class MockTransport implements Transport {
  readonly connected = true;
  private timers = new Set<ReturnType<typeof setInterval>>();

  constructor(
    // Retained in the transport signature for parity with real transports and
    // future latency/scenario settings, even though the current backend needs
    // no endpoint from runtime config.
    private readonly runtimeConfig: RuntimeConfig,
    private readonly backend: MockBackend
  ) {}

  async call<TResult>(
    method: string,
    params: unknown,
    schema: z.ZodType<TResult>
  ): Promise<TResult> {
    // Yield to the event loop so callers observe the same asynchronous boundary
    // as fetch/WebSocket even when the in-memory handler returns immediately.
    await delay(0);
    const result = await this.backend.handle(method, params);
    // Match real transports: unvalidated fixture data never reaches hooks or
    // the TanStack Query cache.
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
    // Parse each item independently so one corrupt simulated sample creates a
    // chart gap instead of stopping the entire live stream.
    const push = (raw: unknown) => {
      try {
        handler(schema.parse(raw));
      } catch {
        // Ignore parse failures on mock push.
      }
    };
    // Deliver history before scheduling live ticks. Consumers can therefore
    // render a stable initial series and append future samples in timestamp order.
    if (stream.initialBatch) {
      for (const raw of stream.initialBatch()) push(raw);
    }
    const timer = setInterval(() => {
      // Batch takes precedence when both factories exist: it represents one
      // coherent tick across several servers and must not be mixed with sample().
      if (stream.sampleBatch) {
        for (const raw of stream.sampleBatch()) push(raw);
      } else if (stream.sample) {
        push(stream.sample());
      }
    }, stream.intervalMs);
    this.timers.add(timer);
    return () => {
      // Cleanup is idempotent and removes this timer from transport ownership,
      // which makes React Strict Mode effect cleanup safe.
      clearInterval(timer);
      this.timers.delete(timer);
    };
  }

  dispose() {
    // A client may own several active feature subscriptions. Dispose clears all
    // of them so application teardown cannot leave background simulation work.
    for (const timer of this.timers) {
      clearInterval(timer);
    }
    this.timers.clear();
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
