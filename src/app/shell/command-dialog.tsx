import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Search,
  LayoutDashboard,
  Server,
  Terminal,
  BellRing,
  Settings,
  Plus,
  Shield,
  Zap
} from "lucide-react";
import { Dialog, DialogContent } from "@/shared/ui/dialog";

interface CommandItem {
  id: string;
  title: string;
  category: "导航" | "快捷操作" | "基础设施";
  icon: typeof LayoutDashboard;
  action: () => void;
  shortcut?: string;
}

export function CommandDialog({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  // Listen for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const items: CommandItem[] = [
    {
      id: "nav-overview",
      title: "前往 总览大盘",
      category: "导航",
      icon: LayoutDashboard,
      action: () => { navigate({ to: "/admin/overview" }); onOpenChange(false); }
    },
    {
      id: "nav-infra",
      title: "前往 基础设施 (主机与网络探针)",
      category: "导航",
      icon: Server,
      action: () => { navigate({ to: "/admin/infrastructure" }); onOpenChange(false); }
    },
    {
      id: "nav-automation",
      title: "前往 自动化运维 (任务与Cron)",
      category: "导航",
      icon: Terminal,
      action: () => { navigate({ to: "/admin/automation" }); onOpenChange(false); }
    },
    {
      id: "nav-alerts",
      title: "前往 告警与通知中心",
      category: "导航",
      icon: BellRing,
      action: () => { navigate({ to: "/admin/alerts" }); onOpenChange(false); }
    },
    {
      id: "nav-settings",
      title: "前往 系统与安全设置",
      category: "导航",
      icon: Settings,
      action: () => { navigate({ to: "/admin/settings" }); onOpenChange(false); }
    },
    {
      id: "act-add-server",
      title: "接入新主机 (Agent 安装脚本)",
      category: "快捷操作",
      icon: Plus,
      action: () => { navigate({ to: "/admin/infrastructure" }); onOpenChange(false); }
    },
    {
      id: "act-dispatch",
      title: "快速下发远程运维命令",
      category: "快捷操作",
      icon: Zap,
      action: () => { navigate({ to: "/admin/automation" }); onOpenChange(false); }
    },
    {
      id: "act-tokens",
      title: "管理 API Access Tokens",
      category: "快捷操作",
      icon: Shield,
      action: () => { navigate({ to: "/admin/settings" }); onOpenChange(false); }
    }
  ];

  const filtered = items.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden border border-border bg-card/95 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center border-b border-border px-3.5 py-3">
          <Search className="size-4 text-muted-foreground mr-2.5 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索控制台功能、主机节点、快捷指令... (ESC 退出)"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center rounded border border-border/80 bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              未找到匹配的功能或命令
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-xs font-medium text-foreground transition-all hover:bg-muted cursor-pointer group"
                  >
                    <div className="flex size-7 items-center justify-center rounded-md border border-border/80 bg-muted/60 text-muted-foreground group-hover:text-primary group-hover:border-primary/40">
                      <Icon className="size-3.5" />
                    </div>
                    <div className="flex-1 truncate">
                      <div className="text-foreground">{item.title}</div>
                    </div>
                    <span className="rounded bg-muted/80 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      {item.category}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
