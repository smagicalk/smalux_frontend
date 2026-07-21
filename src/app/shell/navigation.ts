import {
  LayoutGrid,
  Server,
  TerminalSquare,
  Clock,
  Activity,
  Siren,
  Bell,
  ScrollText,
  KeyRound,
  Users,
  Palette,
  Settings,
  Rocket
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

/**
 * Flat module index — the sidebar is a nav list, not a brand-card stack.
 * Servers are the core entity, so they sit at the top. Governance pages
 * (themes/deployment/settings) live lower and are intentionally quieter.
 */
export const navItems: NavItem[] = [
  { label: "总览", path: "/admin", icon: LayoutGrid },
  { label: "服务器", path: "/admin/servers", icon: Server },
  { label: "远程执行", path: "/admin/tasks", icon: TerminalSquare },
  { label: "计划任务", path: "/admin/cron", icon: Clock },
  { label: "服务监控", path: "/admin/ping", icon: Activity },
  { label: "告警", path: "/admin/alerts", icon: Siren },
  { label: "通知", path: "/admin/notifications", icon: Bell },
  { label: "日志", path: "/admin/logs", icon: ScrollText },
  { label: "Token / 权限", path: "/admin/tokens", icon: KeyRound },
  { label: "账户", path: "/admin/accounts", icon: Users },
  { label: "主题", path: "/admin/themes", icon: Palette },
  { label: "设置", path: "/admin/settings", icon: Settings },
  { label: "部署", path: "/admin/deployment", icon: Rocket }
];

/** Whether a nav path is the active match (exact, with index special-case). */
export function isNavActive(currentPath: string, navPath: string): boolean {
  if (navPath === "/admin") {
    return currentPath === "/admin";
  }
  return currentPath === navPath || currentPath.startsWith(`${navPath}/`);
}
