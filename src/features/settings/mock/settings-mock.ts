import type {
  SystemConfigItem,
  AccountUserItem,
  ApiTokenItem,
  ThemeItem,
  DeploymentTargetItem
} from "../types";

const now = Date.now();
const min = 60_000;
const hr = 3_600_000;
const day = 86_400_000;

export const MOCK_SYSTEM_CONFIGS: SystemConfigItem[] = [
  { key: "site.name", label: "平台站点名称", value: "smalux 控制台", group: "general", editable: true, description: "控制台顶栏与浏览器标题" },
  { key: "site.locale", label: "默认显示语言", value: "zh-CN", group: "general", editable: true, description: "全站界面缺省语言" },
  { key: "security.httpsOnly", label: "全站强制 HTTPS", value: "true", group: "security", editable: true, description: "自动将所有 HTTP 请求 301 重定向至 HTTPS" },
  { key: "security.cookieHttpOnly", label: "HttpOnly 严格 Cookie", value: "true", group: "security", editable: false, description: "防止 XSS 窃取鉴权 Session" },
  { key: "security.csrfProtection", label: "CSRF 防护 Token", value: "true", group: "security", editable: true, description: "开启双重提交 Cookie 校验" },
  { key: "limits.taskConcurrency", label: "自动化任务并发上限", value: "16", group: "limits", editable: true, description: "单次批量分发最大并行节点数" },
  { key: "limits.agentRegisterTokenTtl", label: "Agent 注册 Token 有效期 (秒)", value: "3600", group: "limits", editable: true, description: "生成的安装指令令牌有效时间" },
  { key: "limits.logRetentionDays", label: "审计日志保留天数", value: "90", group: "limits", editable: true, description: "超期日志自动归档清理" },
  { key: "network.pingIntervalSec", label: "探针拨测周期 (秒)", value: "30", group: "network", editable: true, description: "HTTP / TCP / ICMP 探针采样频率" },
  { key: "network.monitoringCadenceSec", label: "Agent 遥测上报间隔 (秒)", value: "1", group: "network", editable: true, description: "WebSocket 高频遥测推送节奏" }
];

export const MOCK_ACCOUNT_USERS: AccountUserItem[] = [
  { id: "u-1", username: "admin", role: "admin", status: "active", mfaEnabled: true, passkeyEnabled: true, lastLoginAt: now - 2 * min, sessions: 2 },
  { id: "u-2", username: "sre_lead", role: "operator", status: "active", mfaEnabled: true, passkeyEnabled: false, lastLoginAt: now - 3 * hr, sessions: 1 },
  { id: "u-3", username: "dev_viewer", role: "viewer", status: "active", mfaEnabled: false, passkeyEnabled: false, lastLoginAt: now - day, sessions: 0 },
  { id: "u-4", username: "sec_auditor", role: "auditor", status: "active", mfaEnabled: true, passkeyEnabled: true, lastLoginAt: now - 6 * hr, sessions: 1 },
  { id: "u-5", username: "intern_guest", role: "viewer", status: "invited", mfaEnabled: false, passkeyEnabled: false, sessions: 0 }
];

export const MOCK_API_TOKENS: ApiTokenItem[] = [
  { id: "tk-1", name: "cicd-deploy-pipeline", scopes: ["node:read", "node:exec", "task:exec"], createdAt: now - 30 * day, expiresAt: now + 60 * day, lastUsedAt: now - hr, createdBy: "admin", revoked: false },
  { id: "tk-2", name: "prometheus-exporter-key", scopes: ["node:read", "log:read"], createdAt: now - 90 * day, lastUsedAt: now - 10 * min, createdBy: "admin", revoked: false },
  { id: "tk-3", name: "old-agent-v1-key", scopes: ["node:exec"], createdAt: now - 180 * day, lastUsedAt: now - 60 * day, createdBy: "admin", revoked: true }
];

export const MOCK_THEMES: ThemeItem[] = [
  { id: "th-1", name: "Obsidian Dark (黑曜石极客黑)", status: "published", publicVisible: true, version: "2.4.0", updatedAt: now - 2 * hr, author: "smalux core", description: "原生支持深色高对比度、发光边框与平滑微动效" },
  { id: "th-2", name: "Cyberpunk Neon (赛博霓虹)", status: "published", publicVisible: true, version: "1.2.0", updatedAt: now - 3 * day, author: "community", description: "高饱和度发光绿与品红撞色风格" },
  { id: "th-3", name: "Minimal Light (极简明亮)", status: "published", publicVisible: false, version: "1.0.0", updatedAt: now - 30 * day, author: "smalux core", description: "高通透纸感白与清爽字体" }
];

export const MOCK_DEPLOYMENT_TARGETS: DeploymentTargetItem[] = [
  { id: "dep-1", mode: "static", name: "纯静态 Cloudflare Pages / Vercel", status: "ready", updatedAt: now - 2 * day, complexity: "low" },
  { id: "dep-2", mode: "nginx", name: "Nginx / Caddy 独立宿主反代", status: "ready", updatedAt: now - day, complexity: "medium" },
  { id: "dep-3", mode: "rust-embed", name: "Rust 二进制 Single-Binary 内置嵌入", status: "ready", updatedAt: now - 30 * min, complexity: "high" }
];
