/**
 * Centralized TanStack Query keys. Keeping them in one place prevents drift
 * between invalidations and the queries they target.
 *
 * Collection prefixes such as `tasks` are intentionally retained alongside
 * filtered factories such as `taskList(params)`: mutations invalidate the
 * stable prefix, while each distinct filter receives its own cache entry.
 * Factory parameters must stay serializable and deterministic because TanStack
 * Query hashes their values as part of cache identity.
 */
export const queryKeys = {
  overviewStats: ["overview-stats"] as const,
  servers: (params?: Record<string, unknown>) =>
    ["servers", params ?? {}] as const,
  server: (id: string) => ["server", id] as const,
  tokens: ["tokens"] as const,
  /** Broad task prefix used for mutation invalidation. */
  tasks: ["tasks"] as const,
  /** Concrete task-list cache key, including active UI filters. */
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
