import { useState, useRef, useEffect } from "react";
import {
  Monitor,
  Moon,
  Sun,
  Search,
  Radio,
  Globe,
  ExternalLink,
  LogOut
} from "lucide-react";
import { Link, Outlet, useLocation } from "@tanstack/react-router";

import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Toaster, toast } from "@/shared/ui/toaster";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/shared/ui/dialog";
import { useThemeStore, ACCENT_PRESETS, type ThemeMode, type AccentColor } from "@/shared/stores/theme-store";
import { useAdminProfileStore } from "@/shared/stores/admin-profile-store";
import { useAuthModalStore } from "@/shared/stores/auth-modal-store";
import { GlobalLoginModal } from "@/shared/ui/auth-modal";
import { navItems, isNavActive } from "./navigation";
import { MobileBottomNav } from "./mobile-bottom-nav";
import { NotificationCenter } from "./notification-center";
import { CommandDialog } from "./command-dialog";

export function AppShell() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [commandOpen, setCommandOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  const adminUsername = useAdminProfileStore((s) => s.username);
  const adminAvatar = useAdminProfileStore((s) => s.avatarUrl);
  const adminRole = useAdminProfileStore((s) => s.role);
  const openLoginModal = useAuthModalStore((s) => s.openLoginModal);

  const handleLogout = () => {
    try {
      localStorage.removeItem("smalux_auth_token");
      localStorage.removeItem("smalux_user_session");
      sessionStorage.clear();
    } catch {}
    setLogoutDialogOpen(false);
    toast.success("已安全退出登录会话");
    // 弹出全局全屏遮罩登录弹窗
    openLoginModal({
      isBlocking: true,
      description: "当前会话已退出，请输入管理员凭据重新登录"
    });
  };

  // Automatically scroll to top whenever pathname or search changes
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.pathname, location.search]);

  return (
    <div className="flex h-full min-h-0 bg-background font-sans">
      {/* Modern Desktop Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-sidebar-border/60">
          <Link to="/admin/overview" className="flex items-center gap-2.5 group">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow-sm transition-transform group-hover:scale-105">
              S
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-sidebar-foreground">smalux</span>
              <span className="text-[10px] text-muted-foreground font-mono leading-none">Console v0.2.0</span>
            </div>
          </Link>

          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
            <span className="size-1.5 rounded-full bg-emerald-500 pulse-dot" />
            Live
          </span>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div>
            <div className="px-2.5 pb-2 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
              控制台工作流
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = isNavActive(currentPath, item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 cursor-pointer",
                      active
                        ? "bg-primary/10 text-primary font-semibold shadow-2xs"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-sidebar-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        active ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-foreground"
                      )}
                    />
                    <span className="truncate flex-1">{item.label}</span>
                    {active && (
                      <span className="size-1.5 rounded-full bg-primary" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Quick System Status Card in Sidebar */}
          <div className="rounded-xl border border-sidebar-border/80 bg-muted/30 p-3 text-xs space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <Radio className="size-3 text-emerald-500 animate-pulse" />
                集群节点状态
              </span>
              <span className="text-[11px] font-mono text-emerald-500">100% 正常</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-emerald-500 w-full" />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground/80 font-mono">
              <span>探针: 12 在线</span>
              <span>丢包: 0.0%</span>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-sidebar-border/60 p-3 space-y-2">
          <button
            onClick={() => setCommandOpen(true)}
            className="flex w-full items-center justify-between rounded-lg border border-sidebar-border/80 bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Search className="size-3.5" />
              快速命令...
            </span>
            <kbd className="rounded border border-border/80 bg-muted px-1.5 py-0.5 text-[10px] font-mono">
              Ctrl+K
            </kbd>
          </button>

          {/* User Profile & Logout Bar */}
          <div className="flex items-center justify-between gap-2 rounded-xl border border-sidebar-border/80 bg-muted/20 p-1.5 text-xs">
            {/* 点击左侧区域直达「设置 -> 账号与安全」 */}
            <Link
              to="/admin/settings"
              search={{ tab: "security" }}
              title="进入账号与安全中心"
              className="flex items-center gap-2 min-w-0 flex-1 group hover:opacity-85 transition-opacity cursor-pointer select-none px-1 py-0.5"
            >
              <div className="relative flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs shadow-xs overflow-hidden">
                {adminAvatar ? (
                  <img src={adminAvatar} alt={adminUsername} className="size-full object-cover" />
                ) : (
                  <span>{adminUsername.charAt(0).toUpperCase() || "A"}</span>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 ring-2 ring-sidebar" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-sidebar-foreground truncate group-hover:text-primary transition-colors">
                  {adminUsername}
                </span>
                <span className="text-[10px] text-muted-foreground/80 truncate font-mono">
                  {adminRole}
                </span>
              </div>
            </Link>

            {/* 退出登录按钮 */}
            <button
              type="button"
              onClick={() => setLogoutDialogOpen(true)}
              title="退出当前登录会话"
              className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-transparent hover:border-rose-500/30 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer shadow-2xs"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>

        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenCommand={() => setCommandOpen(true)} />
        <InsecureHttpBanner />
        <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto pb-16 md:pb-0 bg-background/50">
          <Outlet />
        </main>
      </div>

      <MobileBottomNav />
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen} />

      {/* 退出登录二次确认弹窗 */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <LogOut className="size-4" />
              </div>
              <DialogTitle className="text-sm font-bold text-foreground">
                退出当前登录
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs font-mono text-muted-foreground pt-1">
              确定要退出当前管理员会话吗？退出后需要重新输入凭据以访问控制台。
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex justify-end gap-2 pt-3 border-t border-border/60">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLogoutDialogOpen(false)}
              className="cursor-pointer text-xs"
            >
              取消
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleLogout}
              className="cursor-pointer text-xs font-bold px-4"
            >
              确认退出
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <GlobalLoginModal />
      <Toaster />
    </div>
  );
}


function InsecureHttpBanner() {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    return sessionStorage.getItem("smalux_http_banner_dismissed") === "true";
  });

  if (typeof window === "undefined" || window.location.protocol !== "http:" || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    sessionStorage.setItem("smalux_http_banner_dismissed", "true");
    setDismissed(true);
  };

  return (
    <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-xs text-amber-700 dark:text-amber-300 font-medium shrink-0 transition-all">
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex size-4 items-center justify-center rounded-full bg-amber-500/20 text-amber-500 shrink-0 text-[10px] font-bold">
          !
        </span>
        <span className="truncate">
          <strong>安全提示</strong>：当前正通过未加密的 HTTP 协议访问控制台，管理员凭据存在明文窃听风险，建议配置 SSL/TLS 证书。
        </span>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        title="关闭提示"
        className="rounded-md p-1 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 transition-colors cursor-pointer shrink-0"
      >
        <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function TopBar({ onOpenCommand }: { onOpenCommand: () => void }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-border/80 bg-background/80 px-4 backdrop-blur-md transition-colors duration-200">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenCommand}
          className="hidden sm:flex items-center gap-2 rounded-lg border border-border/80 bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/80 transition-all cursor-pointer shadow-2xs"
        >
          <Search className="size-3.5" />
          <span>搜索功能、主机节点、命令...</span>
          <kbd className="ml-4 rounded border border-border/80 bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            Ctrl + K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden lg:flex items-center gap-2 rounded-full border border-border/80 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
          <span className="size-2 rounded-full bg-emerald-500 pulse-dot" />
          <span className="text-[11px] font-mono">实时数据已同步</span>
        </div>

        {/* 访问公开展示页 (域名根路径 /) */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          title="在新标签页打开公开展示页大盘 (域名根路径 /)"
          className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted hover:border-border transition-all cursor-pointer shadow-2xs font-medium"
        >
          <Globe className="size-3.5 text-primary" />
          <span className="hidden sm:inline">公开展示页</span>
          <ExternalLink className="size-3 opacity-70" />
        </a>

        <div className="h-4 w-px bg-border/80 mx-0.5 hidden sm:block" />

        {/* 顶栏风格与色彩快捷切换器 */}
        <AccentStyleToggle />
        {/* 顶栏明暗模式切换器 */}
        <ThemeToggle />
        <NotificationCenter />
      </div>
    </header>
  );
}

function AccentStyleToggle() {
  const [open, setOpen] = useState(false);
  const accent = useThemeStore((s) => s.accent);
  const setAccent = useThemeStore((s) => s.setAccent);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部自动关闭气泡
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const activePreset = ACCENT_PRESETS.find((p) => p.key === accent) || ACCENT_PRESETS[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`品牌主色风格：当前为 ${activePreset.label}，点击展开快速切换`}
        title={`切换主题风格色 (当前: ${activePreset.label})`}
        onClick={() => setOpen((prev) => !prev)}
        className="text-muted-foreground hover:text-foreground relative"
      >
        <span className={`absolute top-2.5 right-2.5 size-2 rounded-full ${activePreset.dotClass} ring-1 ring-background shadow-xs`} />
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4 7 7 0 017-7h.01M17 21a4 4 0 004-4 7 7 0 00-7-7h-.01M21 7a4 4 0 00-4-4 7 7 0 00-7 7v.01M7 3a4 4 0 00-4 4 7 7 0 007 7v.01" />
        </svg>
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-xl border border-border/80 bg-popover/95 p-2.5 shadow-lg backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
          <div className="px-1.5 pb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/60 flex items-center justify-between">
            <span>主题风格色彩</span>
            <span className="font-mono text-primary font-normal">{activePreset.label.split(" ")[0]}</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-2">
            {ACCENT_PRESETS.map((p) => {
              const isSelected = accent === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => {
                    setAccent(p.key);
                    setOpen(false);
                  }}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors cursor-pointer text-left ${
                    isSelected
                      ? "bg-primary/15 text-primary font-bold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  <span className={`size-3 rounded-full ${p.dotClass} shrink-0 ring-1 ring-background`} />
                  <span className="truncate text-[11px]">{p.label.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ThemeToggle() {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const next: ThemeMode = mode === "light" ? "dark" : mode === "dark" ? "system" : "light";
  const Icon = mode === "dark" ? Moon : mode === "light" ? Sun : Monitor;
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`主题：${mode}（切换至 ${next}）`}
      onClick={() => setMode(next)}
      className="text-muted-foreground hover:text-foreground"
    >
      <Icon className="size-4" />
    </Button>
  );
}
