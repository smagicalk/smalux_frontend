import {
  BellIcon,
  Globe2Icon,
  LayoutDashboardIcon,
  PaletteIcon,
  ScrollTextIcon,
  ServerIcon,
  SettingsIcon,
  TerminalIcon,
  UserRoundIcon,
  WaypointsIcon,
  type LucideIcon
} from "lucide-react";

export type NavigationPath =
  | "/admin"
  | "/admin/nodes"
  | "/admin/ping"
  | "/admin/executions"
  | "/admin/notifications"
  | "/admin/accounts"
  | "/admin/logs"
  | "/admin/themes"
  | "/admin/settings"
  | "/admin/deployment";

export type NavigationItem = {
  label: string;
  to: NavigationPath;
  icon: LucideIcon;
  description: string;
  keywords: string[];
};

export type NavigationSection = {
  label: string;
  items: NavigationItem[];
};

export const navigationSections: NavigationSection[] = [
  {
    label: "监控",
    items: [
      {
        label: "总览",
        to: "/admin",
        icon: LayoutDashboardIcon,
        description: "整体状态、异常、资源趋势和最近事件",
        keywords: ["dashboard", "overview", "总览", "状态", "异常"]
      },
      {
        label: "服务器",
        to: "/admin/nodes",
        icon: ServerIcon,
        description: "Agent、分组、密钥、标签和资源状态",
        keywords: ["node", "server", "agent", "token", "scope", "wss", "rotate", "服务器", "节点", "密钥", "注册", "轮换"]
      },
      {
        label: "Ping",
        to: "/admin/ping",
        icon: Globe2Icon,
        description: "HTTP/TCP/ICMP 可用性、延迟和丢包",
        keywords: ["ping", "tcp", "http", "icmp", "wss", "json-rpc", "public", "target", "可用率", "延迟", "丢包", "公开", "目标组"]
      }
    ]
  },
  {
    label: "运维",
    items: [
      {
        label: "执行",
        to: "/admin/executions",
        icon: TerminalIcon,
        description: "直接执行、定时任务、模板和输出记录",
        keywords: ["exec", "command", "cron", "approval", "terminal", "token", "wss", "json-rpc", "执行", "命令", "定时", "模板", "审批", "终端", "批量"]
      },
      {
        label: "通知",
        to: "/admin/notifications",
        icon: BellIcon,
        description: "渠道、策略、模板、静默窗口和发送历史",
        keywords: ["alert", "notify", "webhook", "email", "通知", "告警", "静默"]
      },
      {
        label: "日志",
        to: "/admin/logs",
        icon: ScrollTextIcon,
        description: "审计、执行、告警、通知和系统日志",
        keywords: ["log", "audit", "日志", "审计", "导出"]
      }
    ]
  },
  {
    label: "治理",
    items: [
      {
        label: "账户",
        to: "/admin/accounts",
        icon: UserRoundIcon,
        description: "用户、角色、权限范围、MFA 和会话",
        keywords: ["account", "user", "role", "mfa", "passkey", "账户", "用户", "权限"]
      },
      {
        label: "主题",
        to: "/admin/themes",
        icon: PaletteIcon,
        description: "后台主题变量、公开主题上传、预览和回滚",
        keywords: ["theme", "palette", "upload", "public", "sandbox", "主题", "颜色", "上传", "公开", "回滚", "隔离"]
      },
      {
        label: "设置",
        to: "/admin/settings",
        icon: SettingsIcon,
        description: "运行时配置、安全策略、限制项和保留策略",
        keywords: ["settings", "config", "security", "csrf", "httponly", "token", "wss", "设置", "配置", "安全", "限制", "审计"]
      },
      {
        label: "部署",
        to: "/admin/deployment",
        icon: WaypointsIcon,
        description: "静态部署、Nginx 和 Rust Web 内置交付",
        keywords: ["deploy", "nginx", "rust", "static", "headless", "cdn", "runtime", "部署", "构建", "内置"]
      }
    ]
  }
];

export const navigationItems = navigationSections.flatMap((section) => section.items);

export const primaryMobileNavigationItems = navigationItems.filter((item) =>
  ["/admin", "/admin/nodes", "/admin/ping", "/admin/executions", "/admin/settings"].includes(item.to)
);

export const secondaryMobileNavigationItems = navigationItems.filter(
  (item) => !primaryMobileNavigationItems.includes(item)
);
