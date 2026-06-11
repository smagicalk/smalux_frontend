import type { RuntimeConfig } from "@/app/config/runtime-config";
import { HttpClient } from "@/shared/api/http-client";
import { RpcClient } from "@/shared/api/rpc-client";
import { createWebSocketUrl, openSmaluxSocket } from "@/shared/api/ws-client";

export type ApiClients = {
  http: HttpClient;
  rpc: RpcClient;
  socket: {
    createUrl: (path: string) => string;
    open: (path: string) => WebSocket;
  };
};

export function createApiClients(runtimeConfig: RuntimeConfig): ApiClients {
  return {
    http: new HttpClient(runtimeConfig),
    rpc: new RpcClient(runtimeConfig),
    socket: {
      createUrl: (path) => createWebSocketUrl(runtimeConfig, path),
      open: (path) => openSmaluxSocket(runtimeConfig, path)
    }
  };
}
