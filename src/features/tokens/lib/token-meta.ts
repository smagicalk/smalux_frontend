/** All scopes a token can carry — single source for the create-dialog picker. */
export const SCOPES = [
  "node:read",
  "node:exec",
  "node:terminal",
  "log:read",
  "config:read",
  "theme:read",
  "deployment:read"
] as const;

export type Filter = "all" | "active" | "expiring" | "revoked";
export const FILTER_OPTS: ReadonlyArray<{ key: Filter; label: string }> = [
  { key: "all", label: "全部" },
  { key: "active", label: "有效" },
  { key: "expiring", label: "即将过期" },
  { key: "revoked", label: "已吊销" }
];

/** One week in ms — the "expiring soon" threshold. */
export const WEEK_MS = 7 * 86_400_000;
