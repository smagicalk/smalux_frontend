import { z } from "zod";

import type { RuntimeConfig } from "@/app/config/runtime-config";
import { joinUrl } from "@/shared/api/url";

const rpcErrorSchema = z.object({
  code: z.number(),
  message: z.string(),
  data: z.unknown().optional()
});

const rpcResponseSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.union([z.string(), z.number(), z.null()]).optional(),
  result: z.unknown().optional(),
  error: rpcErrorSchema.optional()
});

type RpcId = string | number;

export class RpcClient {
  constructor(private readonly runtimeConfig: RuntimeConfig) {}

  async call<TResult>(
    method: string,
    params: unknown,
    schema: z.ZodType<TResult>
  ): Promise<TResult> {
    const response = await fetch(this.runtimeConfig.rpcBaseUrl, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: createRpcId(),
        method,
        params
      })
    });

    if (!response.ok) {
      throw new Error(`RPC HTTP ${response.status}: ${response.statusText}`);
    }

    const payload = rpcResponseSchema.parse(await response.json());

    if (payload.error) {
      throw new Error(`RPC ${payload.error.code}: ${payload.error.message}`);
    }

    return schema.parse(payload.result);
  }
}

function createRpcId(): RpcId {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return Date.now();
}

export function buildRpcMethodUrl(runtimeConfig: RuntimeConfig, method: string) {
  return joinUrl(runtimeConfig.rpcBaseUrl, method);
}
