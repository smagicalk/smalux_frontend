/**
 * Centralized TanStack Query keys. Keeping them in one place prevents
 * drift between invalidations and the queries they target.
 */
export const queryKeys = {
  servers: (params?: { region?: string; status?: string; search?: string }) =>
    ["servers", params ?? {}] as const,
  server: (id: string) => ["server", id] as const,
  tokens: ["tokens"] as const,
  tasks: ["tasks"] as const,
  taskList: (params?: { status?: string; search?: string }) =>
    ["tasks", params ?? {}] as const,
  cron: ["cron"] as const,
  ping: ["ping"] as const,
  pingHistory: (serverId: string, range: string) => ["ping-history", serverId, range] as const,
  alerts: ["alerts"] as const,
  notifications: ["notifications"] as const,
  accounts: ["accounts"] as const,
  themes: ["themes"] as const,
  deployment: ["deployment"] as const,
  logs: (params?: Record<string, unknown>) => ["logs", params ?? {}] as const,
  settings: ["settings"] as const
} as const;
