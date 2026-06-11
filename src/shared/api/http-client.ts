import { z } from "zod";

import type { RuntimeConfig } from "@/app/config/runtime-config";
import { joinUrl } from "@/shared/api/url";

type HttpRequestOptions<TResponse> = Omit<RequestInit, "body"> & {
  schema?: z.ZodType<TResponse>;
  json?: unknown;
  body?: BodyInit | null;
};

export class HttpClient {
  constructor(private readonly runtimeConfig: RuntimeConfig) {}

  async request<TResponse = unknown>(
    path: string,
    options: HttpRequestOptions<TResponse> = {}
  ): Promise<TResponse> {
    const { schema, json, body, headers, ...requestOptions } = options;
    const requestHeaders = new Headers(headers);
    const requestBody = json === undefined ? body : JSON.stringify(json);

    if (!(requestBody instanceof FormData) && !requestHeaders.has("Content-Type")) {
      requestHeaders.set("Content-Type", "application/json");
    }

    const response = await fetch(joinUrl(this.runtimeConfig.apiBaseUrl, path), {
      credentials: "include",
      ...requestOptions,
      headers: requestHeaders,
      body: requestBody
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (response.status === 204) {
      return undefined as TResponse;
    }

    const payload = (await response.json()) as unknown;
    return schema ? schema.parse(payload) : (payload as TResponse);
  }
}
