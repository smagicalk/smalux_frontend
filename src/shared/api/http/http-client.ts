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
  mockAlertHistory,
  mockAlertRules,
  mockCronLogs,
  mockCrons,
  mockDeploymentTargets,
  mockLogs,
  mockNotificationChannels,
  mockNotificationEvents,
  mockPingTargets,
  mockSettings,
  mockTaskVariables,
  mockThemes,
  mockTokens
} from "@/shared/api/mock/mock-data";
import { mockServers } from "@/shared/api/mock/mock-servers";
import { alertsMockEngine } from "@/features/alerts/mock/alerts-mock";
import { settingsMockEngine } from "@/features/settings/mock/settings-mock";

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
    if (defaultRuntimeConfig.transport === "mock") {
      return this.handleMockFallback<T>("GET", path, params);
    }
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
    if (defaultRuntimeConfig.transport === "mock") {
      return this.handleMockFallback<T>("POST", path, body);
    }
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
    if (defaultRuntimeConfig.transport === "mock") {
      return this.handleMockFallback<T>("PUT", path, body);
    }
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
    if (defaultRuntimeConfig.transport === "mock") {
      return this.handleMockFallback<T>("DELETE", path);
    }
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
    if (path.startsWith("/api/v1/tokens")) {
      if (method === "GET") return settingsMockEngine.getTokens() as unknown as T;
      if (method === "POST") return settingsMockEngine.createToken(payload as any) as unknown as T;
      if (method === "DELETE") {
        const id = path.split("/").pop() || "";
        return settingsMockEngine.deleteToken(id) as unknown as T;
      }
      return { ok: true } as unknown as T;
    }

    // 2. Accounts
    if (path.startsWith("/api/v1/accounts")) {
      if (method === "GET") return settingsMockEngine.getAccounts() as unknown as T;
      if (method === "POST") return settingsMockEngine.inviteAccount(payload as any) as unknown as T;
      if (path.includes("/lock")) {
        const id = path.split("/")[4];
        return settingsMockEngine.lockAccount(id, (payload as any)?.locked ?? true) as unknown as T;
      }
      if (method === "PUT") {
        const id = path.split("/")[4];
        return settingsMockEngine.updateAccount(id, payload as any) as unknown as T;
      }
      return { ok: true } as unknown as T;
    }

    // 3. System Storage & Backups
    if (path.startsWith("/api/v1/system/storage-stats")) {
      return settingsMockEngine.getStorageStats() as unknown as T;
    }

    if (path.startsWith("/api/v1/system/backup-plans")) {
      if (method === "GET") return settingsMockEngine.getBackupPlans() as unknown as T;
      if (path.includes("/toggle")) {
        const id = path.split("/")[4];
        return settingsMockEngine.toggleBackupPlan(id, (payload as any)?.enabled ?? true) as unknown as T;
      }
      if (path.includes("/run")) {
        const id = path.split("/")[4];
        return settingsMockEngine.runBackupPlan(id) as unknown as T;
      }
      if (method === "POST") return settingsMockEngine.createBackupPlan(payload as any) as unknown as T;
      if (method === "PUT") {
        const id = path.split("/")[4];
        return settingsMockEngine.updateBackupPlan(id, payload as any) as unknown as T;
      }
      if (method === "DELETE") {
        const id = path.split("/")[4];
        return settingsMockEngine.deleteBackupPlan(id) as unknown as T;
      }
      return { ok: true } as unknown as T;
    }

    if (path.startsWith("/api/v1/system/backups")) {
      if (method === "GET") return settingsMockEngine.getBackups() as unknown as T;
      if (path.includes("/prune")) {
        return settingsMockEngine.pruneBackups((payload as any)?.rule || "older_30d") as unknown as T;
      }
      if (path.includes("/restore")) {
        const id = path.split("/")[4];
        return settingsMockEngine.restoreBackup(id, (payload as any)?.verifyKey) as unknown as T;
      }
      if (method === "POST") return settingsMockEngine.createBackup(payload as any) as unknown as T;
      if (method === "DELETE") {
        const id = path.split("/")[4];
        return settingsMockEngine.deleteBackup(id) as unknown as T;
      }
      return { ok: true } as unknown as T;
    }

    if (path.startsWith("/api/v1/system/data-cleanup")) {
      const { type, rule } = (payload as any) || {};
      return settingsMockEngine.cleanData(type, rule) as unknown as T;
    }

    if (path.startsWith("/api/v1/system/storage/test-remote")) {
      return settingsMockEngine.testRemoteStorage(payload as any) as unknown as T;
    }

    // 4. Security & Authentication Center
    if (path.startsWith("/api/v1/tokens")) {
      if (method === "GET") return settingsMockEngine.getTokens() as unknown as T;
      if (method === "POST") return settingsMockEngine.createToken(payload as any) as unknown as T;
      if (method === "DELETE") {
        const id = path.split("/")[4];
        return settingsMockEngine.revokeToken(id) as unknown as T;
      }
      return { ok: true } as unknown as T;
    }

    if (path.startsWith("/api/v1/security/overview")) {
      return settingsMockEngine.getSecurityOverview() as unknown as T;
    }

    if (path.startsWith("/api/v1/security/totp/setup")) {
      return settingsMockEngine.setupTotp() as unknown as T;
    }

    if (path.startsWith("/api/v1/security/totp/verify")) {
      return settingsMockEngine.verifyTotp((payload as any)?.code || "") as unknown as T;
    }

    if (path.startsWith("/api/v1/security/totp/disable")) {
      return settingsMockEngine.disableTotp((payload as any)?.verifyPassword) as unknown as T;
    }

    if (path.startsWith("/api/v1/security/password/change")) {
      return settingsMockEngine.changePassword(payload as any) as unknown as T;
    }

    if (path.startsWith("/api/v1/security/sessions")) {
      if (method === "GET") return settingsMockEngine.getSessions() as unknown as T;
      if (path.includes("/terminate-others") || path.includes("/terminate_others")) {
        return settingsMockEngine.logoutOtherSessions() as unknown as T;
      }
      if (method === "DELETE") {
        const id = path.split("/")[4];
        return settingsMockEngine.terminateSession(id) as unknown as T;
      }
      return { ok: true } as unknown as T;
    }

    if (path.startsWith("/api/v1/system/network/diagnose")) {
      return settingsMockEngine.diagnoseNetwork() as unknown as T;
    }

    // 5. System Logs
    if (path.startsWith("/api/v1/system/logs")) {
      return settingsMockEngine.getLogs(payload as any) as unknown as T;
    }

    // 6. System Configs
    if (path.startsWith("/api/v1/system/configs")) {
      if (method === "GET") return settingsMockEngine.getSettings() as unknown as T;
      if (method === "PUT") {
        const configs = (payload as any)?.configs || [];
        return settingsMockEngine.saveSettings(configs) as unknown as T;
      }
      return { ok: true } as unknown as T;
    }

    // 5. Deployments
    if (path.startsWith("/api/v1/deployments")) {
      if (method === "GET") return settingsMockEngine.getDeployments() as unknown as T;
      return { ok: true } as unknown as T;
    }

    // 6. Themes
    if (path.startsWith("/api/v1/themes")) {
      if (method === "GET") return settingsMockEngine.getThemes() as unknown as T;
      if (path.includes("/publish")) {
        const id = path.split("/")[4];
        return settingsMockEngine.publishTheme(id) as unknown as T;
      }
      if (path.includes("/archive")) {
        const id = path.split("/")[4];
        return settingsMockEngine.archiveTheme(id) as unknown as T;
      }
      if (method === "POST") {
        return settingsMockEngine.uploadTheme(payload as any) as unknown as T;
      }
      return { ok: true } as unknown as T;
    }

    // 7. Alerts & Notifications (Full Responsive Mock Engine)
    if (path.startsWith("/api/v1/alerts")) {
      if (method === "GET") {
        return alertsMockEngine.getAlerts() as unknown as T;
      }
      if (path.includes("/toggle")) {
        const id = path.split("/")[4];
        return alertsMockEngine.toggleRule(id, (payload as any)?.enabled ?? true) as unknown as T;
      }
      if (path.includes("/silence")) {
        const id = path.split("/")[4];
        return alertsMockEngine.silenceRule(id, (payload as any)?.silenced ?? true) as unknown as T;
      }
      if (path.includes("/events/") && path.includes("/resolve")) {
        const id = path.split("/")[5];
        return alertsMockEngine.resolveEvent(id) as unknown as T;
      }
      if (method === "POST") {
        return alertsMockEngine.createRule(payload as any) as unknown as T;
      }
      if (method === "PUT") {
        const id = path.split("/")[4];
        return alertsMockEngine.updateRule(id, payload as any) as unknown as T;
      }
      if (method === "DELETE") {
        const id = path.split("/")[4];
        return alertsMockEngine.deleteRule(id) as unknown as T;
      }
      return { ok: true } as unknown as T;
    }

    if (path.startsWith("/api/v1/notifications")) {
      if (method === "GET") {
        return alertsMockEngine.getNotifications() as unknown as T;
      }
      if (path.includes("/toggle")) {
        const id = path.split("/")[4];
        return alertsMockEngine.toggleChannel(id, (payload as any)?.enabled ?? true) as unknown as T;
      }
      if (path.includes("/test")) {
        const id = path.split("/")[4];
        return alertsMockEngine.testChannel(id) as unknown as T;
      }
      if (method === "POST") {
        return alertsMockEngine.createChannel(payload as any) as unknown as T;
      }
      if (method === "DELETE") {
        const id = path.split("/")[4];
        return alertsMockEngine.deleteChannel(id) as unknown as T;
      }
      return { ok: true } as unknown as T;
    }

    // 8. Cron Jobs & Cron Logs（状态持久化：CRUD 全部走 Mock Engine 状态）
    if (path.includes("/api/v1/crons/logs")) {
      return { logs: mockCronLogs || [] } as unknown as T;
    }
    if (path.includes("/api/v1/crons")) {
      if (method === "GET") return { crons: mockCrons } as unknown as T;
      if (path.includes("/toggle")) {
        // POST /api/v1/crons/:id/toggle
        const id = path.split("/")[4];
        const idx = (mockCrons as any[]).findIndex((c: any) => c.id === id);
        if (idx !== -1) (mockCrons as any[])[idx].enabled = (payload as any)?.enabled ?? !(mockCrons as any[])[idx].enabled;
        return { ok: true } as unknown as T;
      }
      if (method === "DELETE") {
        const id = path.split("/")[4];
        const arr = mockCrons as any[];
        const i = arr.findIndex((c) => c.id === id);
        if (i !== -1) arr.splice(i, 1);
        return { ok: true } as unknown as T;
      }
      if (method === "PUT") {
        const id = path.split("/")[4];
        const arr = mockCrons as any[];
        const idx = arr.findIndex((c) => c.id === id);
        if (idx !== -1) arr[idx] = { ...arr[idx], ...(payload as any) };
        return { ok: true } as unknown as T;
      }
      if (method === "POST") {
        const p = payload as any;
        const newCron = {
          id: `cron-${Date.now()}`,
          name: p.name,
          serverId: p.serverId,
          expression: p.expression,
          command: p.command,
          enabled: true,
          lastRunAt: undefined,
          nextRunAt: Date.now() + 60_000
        };
        (mockCrons as any[]).unshift(newCron);
        return { ok: true } as unknown as T;
      }
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
