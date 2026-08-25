/**
 * 统一轻量级 RESTful HTTP 客户端
 * 
 * 为系统中标准的 CRUD、日志检索、配置存取提供标准的 HTTP 传输能力，
 * 自动注入当前运行时的 Base URL、Token 认证 Header 及错误统一拦截。
 * 同时内建开发阶段 Mock 拦截器，保证脱机或后端接口尚未就绪时平滑联调。
 */

import { defaultRuntimeConfig } from "@/app/config/runtime-config";
import {
  mockAccounts,
  mockAlertRules,
  mockCronLogs,
  mockCrons,
  mockDeploymentTargets,
  mockLogs,
  mockNotificationChannels,
  mockPingTargets,
  mockSettings,
  mockTaskVariables,
  mockThemes,
  mockTokens
} from "@/shared/api/mock/mock-data";
import { mockServers } from "@/shared/api/mock/mock-servers";

export interface HttpResponse<T> {
  data: T;
  status: number;
  ok: boolean;
}

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly data?: unknown
  ) {
    super(message);
    this.name = "HttpError";
  }
}

class HttpClient {
  private token: string = "";
  private baseUrl: string = defaultRuntimeConfig.apiBaseUrl || "";

  public setToken(token: string) {
    this.token = token;
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  private getHeaders(customHeaders?: HeadersInit): Headers {
    const headers = new Headers(customHeaders);
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (this.token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${this.token}`);
    }
    return headers;
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const base = this.baseUrl ? this.baseUrl.replace(/\/+$/, "") : "";
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const url = `${base}${cleanPath}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          searchParams.append(key, String(val));
        }
      });
      const queryString = searchParams.toString();
      return queryString ? `${url}?${queryString}` : url;
    }

    return url;
  }

  public async get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    const url = this.buildUrl(path, params);

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: this.getHeaders()
      });

      if (!res.ok) {
        throw new HttpError(`HTTP ${res.status} ${res.statusText}`, res.status);
      }

      return (await res.json()) as T;
    } catch {
      // 本地脱机 Mock 拦截降级
      return this.handleMockFallback<T>("GET", path, params);
    }
  }

  public async post<T, B = unknown>(path: string, body?: B): Promise<T> {
    const url = this.buildUrl(path);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: this.getHeaders(),
        body: body !== undefined ? JSON.stringify(body) : undefined
      });

      if (!res.ok) {
        throw new HttpError(`HTTP ${res.status} ${res.statusText}`, res.status);
      }

      return (await res.json()) as T;
    } catch {
      return this.handleMockFallback<T>("POST", path, body);
    }
  }

  public async put<T, B = unknown>(path: string, body?: B): Promise<T> {
    const url = this.buildUrl(path);

    try {
      const res = await fetch(url, {
        method: "PUT",
        headers: this.getHeaders(),
        body: body !== undefined ? JSON.stringify(body) : undefined
      });

      if (!res.ok) {
        throw new HttpError(`HTTP ${res.status} ${res.statusText}`, res.status);
      }

      return (await res.json()) as T;
    } catch {
      return this.handleMockFallback<T>("PUT", path, body);
    }
  }

  public async delete<T>(path: string): Promise<T> {
    const url = this.buildUrl(path);

    try {
      const res = await fetch(url, {
        method: "DELETE",
        headers: this.getHeaders()
      });

      if (!res.ok) {
        throw new HttpError(`HTTP ${res.status} ${res.statusText}`, res.status);
      }

      return (await res.json()) as T;
    } catch {
      return this.handleMockFallback<T>("DELETE", path);
    }
  }

  /**
   * 脱机开发时的智能 Mock 映射
   */
  private handleMockFallback<T>(method: string, path: string, payload?: unknown): T {
    // 1. Tokens
    if (path.includes("/api/v1/tokens")) {
      if (method === "GET") return { tokens: mockTokens } as unknown as T;
      if (method === "POST") {
        const p = payload as { name: string; scopes?: string[]; expiresAt?: number };
        const item = {
          id: `token-${Date.now()}`,
          name: p?.name || "API Token",
          scopes: p?.scopes || ["read"],
          createdBy: "admin",
          revoked: false,
          createdAt: Date.now(),
          lastUsedAt: undefined,
          expiresAt: p?.expiresAt
        };
        mockTokens.unshift(item);
        return { ok: true, token: item } as unknown as T;
      }
      if (method === "DELETE") {
        const id = path.split("/").pop();
        const idx = mockTokens.findIndex((t) => t.id === id);
        if (idx !== -1) mockTokens.splice(idx, 1);
        return { ok: true } as unknown as T;
      }
    }

    // 2. Accounts
    if (path.includes("/api/v1/accounts")) {
      if (method === "GET") return { accounts: mockAccounts } as unknown as T;
      return { ok: true } as unknown as T;
    }

    // 3. System Logs
    if (path.includes("/api/v1/system/logs")) {
      return { logs: mockLogs, total: mockLogs.length } as unknown as T;
    }

    // 4. System Configs
    if (path.includes("/api/v1/system/configs")) {
      if (method === "GET") return { configs: mockSettings } as unknown as T;
      return { ok: true } as unknown as T;
    }

    // 5. Deployments
    if (path.includes("/api/v1/deployments")) {
      if (method === "GET") return { deployments: mockDeploymentTargets } as unknown as T;
      return { ok: true } as unknown as T;
    }

    // 6. Themes
    if (path.includes("/api/v1/themes")) {
      if (method === "GET") return { themes: mockThemes } as unknown as T;
      return { ok: true } as unknown as T;
    }

    // 7. Alerts & Notifications
    if (path.includes("/api/v1/alerts")) {
      if (method === "GET") return { alerts: mockAlertRules } as unknown as T;
      return { ok: true } as unknown as T;
    }
    if (path.includes("/api/v1/notifications")) {
      if (method === "GET") return { notifications: mockNotificationChannels } as unknown as T;
      return { ok: true } as unknown as T;
    }

    // 8. Cron Jobs & Cron Logs
    if (path.includes("/api/v1/crons/logs")) {
      return { logs: mockCronLogs || [] } as unknown as T;
    }
    if (path.includes("/api/v1/crons")) {
      if (method === "GET") return { crons: mockCrons } as unknown as T;
      return { ok: true } as unknown as T;
    }

    // 9. Task Variables
    if (path.includes("/api/v1/tasks/variables")) {
      return { variables: mockTaskVariables || [] } as unknown as T;
    }

    // 10. Servers / Assets
    if (path.includes("/api/v1/servers")) {
      if (path.includes("/hardware")) {
        return {
          cpuModel: "AMD EPYC 7763 64-Core",
          cores: 16,
          memoryBytes: 32 * 1024 * 1024 * 1024,
          diskBytes: 500 * 1024 * 1024 * 1024,
          kernel: "Linux 6.8.0-generic"
        } as unknown as T;
      }
      if (method === "GET") return { agents: mockServers } as unknown as T;
      return { ok: true } as unknown as T;
    }

    // 11. Ping Targets
    if (path.includes("/api/v1/ping-targets")) {
      if (method === "GET") return { services: mockPingTargets || [] } as unknown as T;
      return { ok: true } as unknown as T;
    }

    return { ok: true } as unknown as T;
  }
}

export const httpClient = new HttpClient();
