import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { defaultRuntimeConfig } from "@/app/config/runtime-config";
import { RpcContext } from "@/app/providers/rpc-context";
import type { RpcClient } from "@/shared/api/transport/rpc-client";

import { useTasks } from "./use-tasks";

describe("useTasks", () => {
  it("refetches when task filters change", async () => {
    const call = vi.fn().mockResolvedValue({ tasks: [], total: 0 });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <RpcContext.Provider
        value={{
          config: defaultRuntimeConfig,
          client: { call } as unknown as RpcClient
        }}
      >
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </RpcContext.Provider>
    );

    const { rerender } = renderHook(
      ({ search }: { search: string }) => useTasks({ search }),
      { initialProps: { search: "" }, wrapper }
    );

    await waitFor(() => expect(call).toHaveBeenCalledTimes(1));

    rerender({ search: "nginx" });

    await waitFor(() => expect(call).toHaveBeenCalledTimes(2));
    expect(call.mock.calls[1]?.[1]).toEqual({ search: "nginx" });
  });
});
