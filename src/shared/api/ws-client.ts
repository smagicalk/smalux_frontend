import type { RuntimeConfig } from "@/app/config/runtime-config";
import { joinUrl } from "@/shared/api/url";

export function createWebSocketUrl(runtimeConfig: RuntimeConfig, path: string) {
  const url = new URL(joinUrl(runtimeConfig.wsBaseUrl, path), window.location.origin);

  if (url.protocol === "https:") {
    url.protocol = "wss:";
  }

  if (url.protocol === "http:") {
    url.protocol = "ws:";
  }

  return url.toString();
}

export function openSmaluxSocket(runtimeConfig: RuntimeConfig, path: string) {
  return new WebSocket(createWebSocketUrl(runtimeConfig, path));
}
