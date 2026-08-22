/**
 * Mock data for every non-server domain. Servers live in mock-servers.ts
 * (they feed the live monitoring stream too); everything else is static
 * fixture data here, shaped by the schemas in methods.ts.
 */
import type {
  Account,
  AlertHistory,
  AlertRule,
  Cron,
  DeploymentTarget,
  Log,
  NotificationChannel,
  NotificationEvent,
  PingTarget,
  Setting,
  Task,
  TaskTemplate,
  Theme,
  Token
} from "@/shared/api/methods";

const now = Date.now();
const min = 60_000;
const hr = 3_600_000;
const day = 86_400_000;

export const mockTasks: Task[] = [
  { id: "t1", serverId: "srv-hkg-01", serverName: "edge-hkg-01", command: "systemctl restart nginx", status: "success", risk: "medium", scope: "node:exec", startedAt: now - 2 * hr, finishedAt: now - 2 * hr + 3200, durationMs: 3200, exitCode: 0, output: "nginx restarted", approver: "admin" },
  { id: "t2", serverId: "srv-tok-01", serverName: "edge-tok-01", command: "df -h", status: "success", risk: "low", scope: "node:read", startedAt: now - 90 * min, finishedAt: now - 90 * min + 800, durationMs: 800, exitCode: 0 },
  { id: "t3", serverId: "srv-sgp-02", serverName: "worker-sgp-02", command: "apt update && apt upgrade -y", status: "running", risk: "high", scope: "node:exec", startedAt: now - 5 * min, approver: "admin" },
  { id: "t4", serverId: "srv-fra-02", serverName: "edge-fra-02", command: "rm -rf /tmp/cache", status: "approved", risk: "high", scope: "node:exec", approver: "operator" },
  { id: "t5", serverId: "srv-lax-01", serverName: "db-lax-01", command: "pg_dump main", status: "pending", risk: "medium", scope: "node:exec" },
  { id: "t6", serverId: "srv-sha-01", serverName: "worker-sha-01", command: "docker logs app", status: "failed", risk: "low", scope: "node:read", startedAt: now - 3 * hr, finishedAt: now - 3 * hr + 1500, durationMs: 1500, exitCode: 1, output: "container not found" },
  { id: "t7", serverId: "srv-hkg-02", serverName: "core-hkg-02", command: "uptime", status: "timeout", risk: "low", scope: "node:read", startedAt: now - 4 * hr, finishedAt: now - 4 * hr + 30_000, durationMs: 30_000, exitCode: 124 }
];

export const mockTaskTemplates: TaskTemplate[] = [
  { id: "tp1", name: "重启服务", command: "systemctl restart {service}", risk: "medium", scope: "node:exec", requiresApproval: true },
  { id: "tp2", name: "系统诊断", command: "uname -a && df -h && free -m", risk: "low", scope: "node:read", requiresApproval: false },
  { id: "tp3", name: "内核参数采集", command: "sysctl -a | grep net", risk: "low", scope: "node:read", requiresApproval: false },
  { id: "tp4", name: "Agent 重启", command: "systemctl restart smalux-agent", risk: "high", scope: "node:exec", requiresApproval: true },
  { id: "tp5", name: "网络诊断", command: "ping -c 4 {host} && traceroute {host}", risk: "low", scope: "node:read", requiresApproval: false }
];

export const mockCrons: Cron[] = [
  { id: "c1", name: "每日备份", serverId: "srv-lax-01", serverName: "db-lax-01", expression: "0 3 * * *", command: "pg_dump main | gzip > /backup/main.sql.gz", enabled: true, lastRunAt: now - 20 * hr, nextRunAt: now + 4 * hr, lastStatus: "success" },
  { id: "c2", name: "日志清理", serverId: "srv-hkg-01", serverName: "edge-hkg-01", expression: "0 4 * * 0", command: "find /var/log -mtime +30 -delete", enabled: true, lastRunAt: now - 2 * day, nextRunAt: now + 5 * day, lastStatus: "success" },
  { id: "c3", name: "证书续期检查", serverId: "srv-fra-01", serverName: "core-fra-01", expression: "0 0 * * *", command: "certbot renew --dry-run", enabled: false, lastRunAt: now - day, lastStatus: "success" },
  { id: "c4", name: "流量统计上报", serverId: "srv-sgp-01", serverName: "cache-sgp-01", expression: "*/30 * * * *", command: "vnstat --json", enabled: true, lastRunAt: now - 25 * min, nextRunAt: now + 5 * min, lastStatus: "success" },
  { id: "c5", name: "磁盘巡检", serverId: "srv-tok-01", serverName: "edge-tok-01", expression: "0 */6 * * *", command: "df -h | mail ops@smalux", enabled: true, lastRunAt: now - 3 * hr, nextRunAt: now + 3 * hr, lastStatus: "failed" }
];

export const mockPingTargets: PingTarget[] = [
  { id: "p-pending", name: "新机房骨干专线测试 (Pending)", address: "18.176.99.100", protocol: "icmp", group: "private", enabled: true, latencyMs: undefined, uptime: undefined as unknown as number, lastCheckAt: 0, lastOk: true },
  { id: "p1", name: "主站 HTTPS", address: "https://smalux.example.com", protocol: "http", group: "public", enabled: true, latencyMs: 45, uptime: 0.999, lastCheckAt: now - 30_000, lastOk: true },
  { id: "p2", name: "API 网关", address: "https://api.smalux.example.com/health", protocol: "http", group: "control", enabled: true, latencyMs: 82, uptime: 0.995, lastCheckAt: now - 30_000, lastOk: true },
  { id: "p3", name: "WSS 终端", address: "wss://api.smalux.example.com/ws", protocol: "wss", group: "control", enabled: true, latencyMs: 120, uptime: 0.998, lastCheckAt: now - 30_000, lastOk: true },
  { id: "p4", name: "数据库端口", address: "db-lax-01:5432", protocol: "tcp", group: "private", enabled: true, latencyMs: 8, uptime: 1, lastCheckAt: now - 30_000, lastOk: true },
  { id: "p5", name: "Redis 入口", address: "cache-sgp-01:6379", protocol: "tcp", group: "private", enabled: true, latencyMs: 3, uptime: 0.999, lastCheckAt: now - 30_000, lastOk: true },
  { id: "p6", name: "ICMP 探测 HK", address: "edge-hkg-01", protocol: "icmp", group: "notify", enabled: true, latencyMs: 12, uptime: 0.997, lastCheckAt: now - 30_000, lastOk: true },
  { id: "p7", name: "私网拒绝样例", address: "10.0.0.99:22", protocol: "tcp", group: "private", enabled: false, latencyMs: undefined, uptime: 0, lastCheckAt: now - 30_000, lastOk: false }
];

export const mockAlertRules: AlertRule[] = [
  { id: "a1", name: "CPU 持续高负载", serverId: "srv-tok-01", metric: "cpuUsage", operator: ">", threshold: 0.85, windowSec: 300, severity: "warning", enabled: true, silenced: false },
  { id: "a2", name: "内存不足", serverId: "srv-hkg-02", metric: "memUsed/memTotal", operator: ">", threshold: 0.9, windowSec: 120, severity: "critical", enabled: true, silenced: false },
  { id: "a3", name: "磁盘空间告警", metric: "diskUsed/diskTotal", operator: ">", threshold: 0.9, windowSec: 600, severity: "critical", enabled: true, silenced: true },
  { id: "a4", name: "节点离线", metric: "status", operator: "==", threshold: 0, windowSec: 60, severity: "critical", enabled: true, silenced: false },
  { id: "a5", name: "网络出站异常", serverId: "srv-fra-01", metric: "netTxSpeed", operator: ">", threshold: 100_000_000, windowSec: 300, severity: "info", enabled: false, silenced: false }
];

export const mockAlertHistory: AlertHistory[] = [
  { id: "ah1", ruleId: "a1", ruleName: "CPU 持续高负载", serverName: "edge-tok-01", severity: "warning", triggeredAt: now - 35 * min, resolvedAt: now - 30 * min, value: 0.92, message: "CPU 92% 持续 5 分钟" },
  { id: "ah2", ruleId: "a4", ruleName: "节点离线", serverName: "worker-sgp-02", severity: "critical", triggeredAt: now - 2 * hr, resolvedAt: undefined, value: 0, message: "agent 失联超过 60s" },
  { id: "ah3", ruleId: "a4", ruleName: "节点离线", serverName: "worker-sha-01", severity: "critical", triggeredAt: now - 30 * min, resolvedAt: undefined, value: 0, message: "agent 失联超过 60s" },
  { id: "ah4", ruleId: "a2", ruleName: "内存不足", serverName: "core-hkg-02", severity: "critical", triggeredAt: now - 5 * hr, resolvedAt: now - 5 * hr + 8 * min, value: 0.94, message: "内存 94%" }
];

export const mockNotificationChannels: NotificationChannel[] = [
  { id: "n1", name: "运维 Telegram", type: "telegram", enabled: true, endpoint: "@smalux_ops", lastDeliveryAt: now - 35 * min, lastOk: true },
  { id: "n2", name: "Discord 频道", type: "discord", enabled: true, endpoint: "#alerts", lastDeliveryAt: now - 2 * hr, lastOk: true },
  { id: "n3", name: "邮件通知", type: "email", enabled: true, endpoint: "ops@smalux.example.com", lastDeliveryAt: now - 5 * hr, lastOk: true },
  { id: "n4", name: "企业微信", type: "wecom", enabled: false, endpoint: "smalux群", lastDeliveryAt: now - day, lastOk: false },
  { id: "n5", name: "通用 Webhook", type: "webhook", enabled: true, endpoint: "https://hooks.example.com/smalux", lastDeliveryAt: now - 30 * min, lastOk: true }
];

export const mockNotificationEvents: NotificationEvent[] = [
  { id: "ne1", channelName: "运维 Telegram", severity: "critical", message: "worker-sgp-02 节点离线", deliveredAt: now - 2 * hr, ok: true },
  { id: "ne2", channelName: "Discord 频道", severity: "warning", message: "edge-tok-01 CPU 92%", deliveredAt: now - 35 * min, ok: true },
  { id: "ne3", channelName: "企业微信", severity: "critical", message: "worker-sha-01 节点离线", deliveredAt: now - 30 * min, ok: false },
  { id: "ne4", channelName: "邮件通知", severity: "critical", message: "core-hkg-02 内存 94%", deliveredAt: now - 5 * hr, ok: true },
  { id: "ne5", channelName: "通用 Webhook", severity: "info", message: "每日备份完成", deliveredAt: now - 20 * hr, ok: true }
];

export const mockLogs: Log[] = [
  { id: "l1", ts: now - 2 * min, actor: "admin", module: "task", action: "task.dispatch", result: "success", target: "srv-sgp-02", ip: "203.0.113.5", detail: "apt update && apt upgrade -y" },
  { id: "l2", ts: now - 15 * min, actor: "operator", module: "terminal", action: "terminal.open", result: "success", target: "srv-fra-01", ip: "203.0.113.5", detail: "WSS session 4f2a" },
  { id: "l3", ts: now - 30 * min, actor: "admin", module: "token", action: "token.create", result: "success", target: "deploy-bot", detail: "scopes: node:read,node:exec" },
  { id: "l4", ts: now - 45 * min, actor: "viewer", module: "auth", action: "auth.login", result: "failure", target: "viewer", ip: "198.51.100.7", detail: "密码错误 3 次" },
  { id: "l5", ts: now - 2 * hr, actor: "system", module: "alert", action: "alert.trigger", result: "success", target: "a4", detail: "worker-sgp-02 离线" },
  { id: "l6", ts: now - 3 * hr, actor: "admin", module: "theme", action: "theme.upload", result: "success", target: "dark-pro", detail: "sandbox build ok" },
  { id: "l7", ts: now - 4 * hr, actor: "admin", module: "config", action: "config.edit", result: "success", target: "limits.taskConcurrency", detail: "8 -> 16" },
  { id: "l8", ts: now - 5 * hr, actor: "admin", module: "cron", action: "cron.update", result: "success", target: "c3", detail: "enabled=false" },
  { id: "l9", ts: now - 6 * hr, actor: "auditor", module: "auth", action: "auth.login", result: "success", target: "auditor", ip: "203.0.113.5" },
  { id: "l10", ts: now - 7 * hr, actor: "admin", module: "task", action: "task.approve", result: "success", target: "t3", detail: "high-risk approved" }
];

export const mockTokens: Token[] = [
  { id: "tk1", name: "deploy-bot", scopes: ["node:read", "node:exec", "theme:read"], createdAt: now - 30 * day, expiresAt: now + 60 * day, lastUsedAt: now - hr, createdBy: "admin", revoked: false },
  { id: "tk2", name: "monitoring-readonly", scopes: ["node:read", "log:read"], createdAt: now - 90 * day, lastUsedAt: now - 10 * min, createdBy: "admin", revoked: false },
  { id: "tk3", name: "ci-pipeline", scopes: ["config:read", "deployment:read"], createdAt: now - 10 * day, lastUsedAt: now - day, createdBy: "operator", revoked: false },
  { id: "tk4", name: "old-agent-key", scopes: ["node:exec", "node:terminal"], createdAt: now - 180 * day, lastUsedAt: now - 60 * day, createdBy: "admin", revoked: true },
  { id: "tk5", name: "audit-export", scopes: ["log:read"], createdAt: now - 5 * day, expiresAt: now + 25 * day, lastUsedAt: undefined, createdBy: "auditor", revoked: false }
];

export const mockAccounts: Account[] = [
  { id: "u1", username: "admin", role: "admin", status: "active", mfaEnabled: true, passkeyEnabled: true, lastLoginAt: now - 2 * min, sessions: 2 },
  { id: "u2", username: "operator", role: "operator", status: "active", mfaEnabled: true, passkeyEnabled: false, lastLoginAt: now - 3 * hr, sessions: 1 },
  { id: "u3", username: "viewer", role: "viewer", status: "active", mfaEnabled: false, passkeyEnabled: false, lastLoginAt: now - day, sessions: 0 },
  { id: "u4", username: "auditor", role: "auditor", status: "active", mfaEnabled: true, passkeyEnabled: true, lastLoginAt: now - 6 * hr, sessions: 1 },
  { id: "u5", username: "intern", role: "viewer", status: "invited", mfaEnabled: false, passkeyEnabled: false, lastLoginAt: undefined, sessions: 0 },
  { id: "u6", username: "old-admin", role: "admin", status: "locked", mfaEnabled: true, passkeyEnabled: false, lastLoginAt: now - 60 * day, sessions: 0 }
];

export const mockThemes: Theme[] = [
  { id: "th1", name: "default", status: "published", publicVisible: true, version: "1.0.0", updatedAt: now - 30 * day, author: "system" },
  { id: "th2", name: "dark-pro", status: "published", publicVisible: true, version: "2.1.0", updatedAt: now - 3 * hr, author: "admin" },
  { id: "th3", name: "enterprise-blue", status: "published", publicVisible: false, version: "1.4.2", updatedAt: now - 10 * day, author: "admin" },
  { id: "th4", name: "neon-draft", status: "draft", publicVisible: false, version: "0.3.0", updatedAt: now - 2 * hr, author: "operator" },
  { id: "th5", name: "legacy-light", status: "archived", publicVisible: false, version: "0.9.1", updatedAt: now - 120 * day, author: "system" }
];

export const mockSettings: Setting[] = [
  { key: "site.name", label: "站点名称", value: "smalux", group: "general", editable: true },
  { key: "site.locale", label: "默认语言", value: "zh-CN", group: "general", editable: true },
  { key: "security.httpsOnly", label: "强制 HTTPS", value: "true", group: "security", editable: true },
  { key: "security.cookieHttpOnly", label: "HttpOnly Cookie", value: "true", group: "security", editable: false },
  { key: "security.csrfProtection", label: "CSRF 防护", value: "true", group: "security", editable: true },
  { key: "limits.taskConcurrency", label: "任务并发上限", value: "16", group: "limits", editable: true },
  { key: "limits.agentRegisterTokenTtl", label: "注册 Token 有效期(秒)", value: "300", group: "limits", editable: true },
  { key: "limits.themeUploadSizeMb", label: "主题上传上限(MB)", value: "8", group: "limits", editable: true },
  { key: "limits.logRetentionDays", label: "日志保留(天)", value: "90", group: "limits", editable: true },
  { key: "network.pingIntervalSec", label: "Ping 间隔(秒)", value: "30", group: "network", editable: true },
  { key: "network.monitoringCadenceSec", label: "监控上报间隔(秒)", value: "1", group: "network", editable: true }
];

export const mockDeploymentTargets: DeploymentTarget[] = [
  { id: "d1", mode: "static", name: "纯静态 CDN", status: "ready", updatedAt: now - 2 * day, complexity: "low" },
  { id: "d2", mode: "nginx", name: "Nginx 反代", status: "ready", updatedAt: now - day, complexity: "medium" },
  { id: "d3", mode: "rust-embed", name: "Rust 内置 embed", status: "building", updatedAt: now - 30 * min, complexity: "high" }
];

/**
 * Per-server ping probe targets for the detail-page latency chart. Each box
 * pings its own set of targets (gateway / DNS / public ingress / neighbor
 * nodes), and the count is intentionally arbitrary — 0..n, different per
 * server — so the multi-line chart and its "未配置探测点" empty state both have
 * live data to render against. A server with no entry (or an empty array)
 * emits samples with an empty `probes` list.
 *
 * Targets double as their own label; the address is what the agent probes and
 * what the legend shows.
 */
export const mockPingProbes: Record<string, string[]> = {
  "srv-hkg-01": ["网关 10.0.0.1", "DNS 1.1.1.1", "公网 baidu.com", "邻近 tok-01"],
  "srv-hkg-02": ["网关 10.0.0.1", "DNS 8.8.8.8", "公网 google.com"],
  "srv-tok-01": ["网关 10.0.1.1", "DNS 1.1.1.1", "公网 yahoo.co.jp", "邻近 hkg-01", "邻近 lax-01"],
  "srv-sgp-01": ["网关 10.0.2.1", "DNS 1.1.1.1", "公网 baidu.com"],
  "srv-sgp-02": ["DNS 8.8.8.8"],
  "srv-lax-01": ["网关 10.0.3.1", "DNS 8.8.8.8", "公网 cloudflare.com", "邻近 tok-01"],
  "srv-sha-01": ["网关 10.0.4.1", "DNS 223.5.5.5", "公网 baidu.com", "邻近 hkg-01", "邻近 sgp-01"],
  "srv-fra-01": ["网关 10.0.5.1", "DNS 1.1.1.1", "公网 google.com"],
  "srv-syd-01": ["网关 10.0.6.1", "公网 cloudflare.com"],
  "srv-unknown": []
};
