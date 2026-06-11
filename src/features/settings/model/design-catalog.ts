import {
  ActivityIcon,
  BellIcon,
  BookOpenIcon,
  ClockIcon,
  CookieIcon,
  FileArchiveIcon,
  FingerprintIcon,
  KeyRoundIcon,
  LockKeyholeIcon,
  PlugIcon,
  PaletteIcon,
  RadioIcon,
  ScrollTextIcon,
  ServerCogIcon,
  ServerIcon,
  SettingsIcon,
  ShieldCheckIcon,
  TerminalIcon,
  UsersIcon,
  type LucideIcon
} from "lucide-react";

import type { BadgeVariant } from "@/shared/ui/badge";

export type DesignCatalogItem = {
  title: string;
  description: string;
  badge: string;
  badgeVariant: BadgeVariant;
  icon: LucideIcon;
};

export const featureDesignItems: DesignCatalogItem[] = [
  {
    title: "监控总览",
    description: "服务器状态、Ping 可用率、告警、执行失败、最近事件",
    badge: "P0",
    badgeVariant: "outline",
    icon: ActivityIcon
  },
  {
    title: "服务器",
    description: "Agent 接入、分组、标签、状态、Token、密钥轮换",
    badge: "P0",
    badgeVariant: "outline",
    icon: ServerIcon
  },
  {
    title: "Ping 监测",
    description: "HTTP/TCP/ICMP 探测、延迟、可用率、告警联动",
    badge: "P0",
    badgeVariant: "outline",
    icon: RadioIcon
  },
  {
    title: "远程执行",
    description: "直接执行、定时执行、命令模板、输出和结果追踪",
    badge: "P1",
    badgeVariant: "warning",
    icon: TerminalIcon
  },
  {
    title: "通知",
    description: "渠道、策略、模板、静默窗口、测试通知、通知历史",
    badge: "P1",
    badgeVariant: "outline",
    icon: BellIcon
  },
  {
    title: "账户",
    description: "用户、角色、权限范围、MFA、Passkey、会话",
    badge: "P1",
    badgeVariant: "outline",
    icon: UsersIcon
  },
  {
    title: "日志",
    description: "审计日志、执行日志、告警日志、通知日志、系统日志",
    badge: "P1",
    badgeVariant: "outline",
    icon: ScrollTextIcon
  },
  {
    title: "主题",
    description: "后台主题变量、公开主题上传、参数表单、预览回滚",
    badge: "P1",
    badgeVariant: "outline",
    icon: PaletteIcon
  },
  {
    title: "系统设置",
    description: "运行时、安全策略、上传限制、探测限制、保留策略",
    badge: "P2",
    badgeVariant: "outline",
    icon: SettingsIcon
  },
  {
    title: "部署适配",
    description: "独立部署、Nginx、Rust 内置、缓存和健康检查",
    badge: "P2",
    badgeVariant: "outline",
    icon: BookOpenIcon
  }
];

export const securityDesignItems: DesignCatalogItem[] = [
  {
    title: "会话认证",
    description: "HttpOnly Cookie、短会话、刷新轮换、MFA/Passkey",
    badge: "核心",
    badgeVariant: "success",
    icon: CookieIcon
  },
  {
    title: "CSRF 防护",
    description: "写操作校验 CSRF token，SameSite 只作为辅助",
    badge: "核心",
    badgeVariant: "success",
    icon: ShieldCheckIcon
  },
  {
    title: "WebSocket",
    description: "WSS、Origin 校验、鉴权、心跳、订阅级权限",
    badge: "核心",
    badgeVariant: "success",
    icon: RadioIcon
  },
  {
    title: "远程执行",
    description: "二次确认、模板授权、任务审计、输出脱敏、并发限制",
    badge: "高风险",
    badgeVariant: "warning",
    icon: TerminalIcon
  },
  {
    title: "Agent 通道",
    description: "一次性 token、HMAC、timestamp、nonce、密钥轮换",
    badge: "高风险",
    badgeVariant: "warning",
    icon: ServerCogIcon
  },
  {
    title: "主题上传",
    description: "zip 限制、manifest 校验、参数表单、公开主题 Cookie 隔离",
    badge: "高风险",
    badgeVariant: "warning",
    icon: FileArchiveIcon
  },
  {
    title: "Ping/通知外联",
    description: "目标校验、防 SSRF、频率限制、Webhook token 加密",
    badge: "高风险",
    badgeVariant: "warning",
    icon: RadioIcon
  },
  {
    title: "敏感配置",
    description: "密码 Argon2id，Webhook/SMTP/Agent secret 加密存储",
    badge: "核心",
    badgeVariant: "success",
    icon: KeyRoundIcon
  },
  {
    title: "安全响应头",
    description: "CSP、HSTS、nosniff、Referrer-Policy、Permissions-Policy",
    badge: "部署",
    badgeVariant: "outline",
    icon: LockKeyholeIcon
  },
  {
    title: "审计日志",
    description: "登录、Token、主题、服务器、远程执行、通知变更全记录",
    badge: "治理",
    badgeVariant: "outline",
    icon: ScrollTextIcon
  },
  {
    title: "定时任务",
    description: "创建人、修改人、启用状态、执行窗口和失败策略可追踪",
    badge: "治理",
    badgeVariant: "outline",
    icon: ClockIcon
  },
  {
    title: "权限边界",
    description: "JSON-RPC method、远程执行、日志查看和主题上传独立鉴权",
    badge: "治理",
    badgeVariant: "outline",
    icon: FingerprintIcon
  },
  {
    title: "Headless 主控",
    description: "Dashboard 可单独部署，主控接入必须走 HTTPS/WSS 与受控 Token",
    badge: "部署",
    badgeVariant: "outline",
    icon: PlugIcon
  }
];
