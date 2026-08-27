import {
  LayoutDashboard,
  Server,
  Terminal,
  BellRing,
  Settings,
  Sparkles
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: string;
}

/**
 * 6 Core Workflows of smalux Modern Cloud Console
 */
export const navItems: NavItem[] = [
  { label: "总览大盘", path: "/admin/overview", icon: LayoutDashboard },
  { label: "基础设施", path: "/admin/infrastructure", icon: Server },
  { label: "自动化运维", path: "/admin/automation", icon: Terminal },
  { label: "告警中心", path: "/admin/alerts", icon: BellRing },
  { label: "表单设计器", path: "/admin/form-designer", icon: Sparkles, badge: "LowCode" },
  { label: "系统与安全", path: "/admin/settings", icon: Settings }
];

/** Check if current route matches nav item */
export function isNavActive(currentPath: string, navPath: string): boolean {
  if (navPath === "/admin/overview") {
    return currentPath === "/admin" || currentPath === "/admin/" || currentPath.startsWith("/admin/overview");
  }
  return currentPath.startsWith(navPath);
}
