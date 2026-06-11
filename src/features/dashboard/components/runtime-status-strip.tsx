import {
  KeyRoundIcon,
  LockKeyholeIcon,
  RadioIcon,
  ServerCogIcon,
  ShieldCheckIcon,
  WifiIcon
} from "lucide-react";
import { toast } from "sonner";
import { InteractiveCardButton } from "@/shared/ui/card";

import { Badge } from "@/shared/ui/badge";

const runtimeItems = [
  {
    label: "HTTP API",
    value: "ready",
    note: "聚合接口正常",
    icon: ServerCogIcon,
    tone: "success"
  },
  {
    label: "WebSocket",
    value: "mock live",
    note: "实时流占位",
    icon: WifiIcon,
    tone: "outline"
  },
  {
    label: "JSON-RPC",
    value: "ready",
    note: "动作通道已留口",
    icon: RadioIcon,
    tone: "success"
  },
  {
    label: "CSRF",
    value: "required",
    note: "写操作保护",
    icon: ShieldCheckIcon,
    tone: "warning"
  },
  {
    label: "Cookie",
    value: "HttpOnly",
    note: "隔离会话边界",
    icon: LockKeyholeIcon,
    tone: "success"
  },
  {
    label: "Token Scope",
    value: "scoped",
    note: "细粒度权限预留",
    icon: KeyRoundIcon,
    tone: "outline"
  }
] as const;

export function RuntimeStatusStrip() {
  return (
    <section className="grid gap-2 md:grid-cols-2 xl:grid-cols-6">
      {runtimeItems.map((item) => (
        <InteractiveCardButton
          key={item.label}
          tone="default"
          padding="md"
          onClick={() =>
            toast.info(item.label, {
              description: `${item.value} · ${item.note}`
            })
          }
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--surface-muted)] text-muted-foreground dark:bg-white/6">
                <item.icon className="size-4" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {item.label}
                </p>
                <p className="truncate text-sm font-semibold tracking-[-0.02em]">{item.value}</p>
              </div>
            </div>
            <Badge variant={item.tone === "outline" ? "outline" : item.tone}>
              {item.tone === "outline" ? "live" : item.value}
            </Badge>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{item.note}</p>
        </InteractiveCardButton>
      ))}
    </section>
  );
}
