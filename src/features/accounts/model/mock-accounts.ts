export type AccountStatus = "active" | "locked" | "invited";

export type AccountUser = {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Operator" | "Viewer";
  status: AccountStatus;
  mfa: boolean;
  passkey: boolean;
  scope: string;
  lastLoginAt: string;
};

export type RolePolicy = {
  role: AccountUser["role"];
  description: string;
  permissions: string[];
};

export type ActiveSession = {
  id: string;
  user: string;
  device: string;
  ip: string;
  createdAt: string;
  expiresAt: string;
  current: boolean;
};

export const mockUsers: AccountUser[] = [
  {
    id: "user-owner",
    name: "Root Owner",
    email: "owner@example.com",
    role: "Owner",
    status: "active",
    mfa: true,
    passkey: true,
    scope: "全部资源",
    lastLoginAt: "2026-06-09T09:20:00.000Z"
  },
  {
    id: "user-admin",
    name: "Ops Admin",
    email: "admin@example.com",
    role: "Admin",
    status: "active",
    mfa: true,
    passkey: false,
    scope: "Core / Edge",
    lastLoginAt: "2026-06-09T08:15:00.000Z"
  },
  {
    id: "user-operator",
    name: "Night Operator",
    email: "operator@example.com",
    role: "Operator",
    status: "active",
    mfa: false,
    passkey: false,
    scope: "Cache / Ping",
    lastLoginAt: "2026-06-08T22:10:00.000Z"
  },
  {
    id: "user-viewer",
    name: "Read Only",
    email: "viewer@example.com",
    role: "Viewer",
    status: "invited",
    mfa: false,
    passkey: false,
    scope: "公开状态",
    lastLoginAt: "尚未登录"
  },
  {
    id: "user-auditor",
    name: "Security Auditor",
    email: "audit@example.com",
    role: "Viewer",
    status: "active",
    mfa: true,
    passkey: true,
    scope: "审计日志 / 只读",
    lastLoginAt: "2026-06-09T06:30:00.000Z"
  },
  {
    id: "user-locked",
    name: "Former Operator",
    email: "locked@example.com",
    role: "Operator",
    status: "locked",
    mfa: false,
    passkey: false,
    scope: "已停用",
    lastLoginAt: "2026-06-06T18:40:00.000Z"
  },
  {
    id: "user-theme",
    name: "Theme Maintainer",
    email: "theme@example.com",
    role: "Admin",
    status: "invited",
    mfa: false,
    passkey: false,
    scope: "主题 / 公开页",
    lastLoginAt: "尚未登录"
  }
];

export const mockRolePolicies: RolePolicy[] = [
  {
    role: "Owner",
    description: "拥有所有后台权限和安全设置权限。",
    permissions: ["账户管理", "系统设置", "远程执行", "主题上传", "审计导出"]
  },
  {
    role: "Admin",
    description: "管理服务器、通知策略和常规运行配置。",
    permissions: ["服务器管理", "通知配置", "Ping 监测", "命令模板"]
  },
  {
    role: "Operator",
    description: "执行授权模板、查看日志和处理告警。",
    permissions: ["授权执行", "日志查看", "告警确认"]
  },
  {
    role: "Viewer",
    description: "只读查看监控、状态和有限日志。",
    permissions: ["监控查看", "状态查看"]
  }
];

export const mockActiveSessions: ActiveSession[] = [
  {
    id: "sess-current",
    user: "owner@example.com",
    device: "Windows / Chrome",
    ip: "192.0.2.18",
    createdAt: "2026-06-09T08:30:00.000Z",
    expiresAt: "2026-06-09T20:30:00.000Z",
    current: true
  },
  {
    id: "sess-admin",
    user: "admin@example.com",
    device: "macOS / Safari",
    ip: "198.51.100.42",
    createdAt: "2026-06-09T07:44:00.000Z",
    expiresAt: "2026-06-09T19:44:00.000Z",
    current: false
  },
  {
    id: "sess-operator",
    user: "operator@example.com",
    device: "Linux / Firefox",
    ip: "203.0.113.77",
    createdAt: "2026-06-09T00:15:00.000Z",
    expiresAt: "2026-06-09T12:15:00.000Z",
    current: false
  },
  {
    id: "sess-audit",
    user: "audit@example.com",
    device: "iPadOS / Safari",
    ip: "198.51.100.88",
    createdAt: "2026-06-09T06:32:00.000Z",
    expiresAt: "2026-06-09T18:32:00.000Z",
    current: false
  }
];
