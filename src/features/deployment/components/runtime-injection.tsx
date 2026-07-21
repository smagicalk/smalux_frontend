import { CheckCircle2, XCircle } from "lucide-react";

import { Badge } from "@/shared/ui/badge";

/** Runtime-injection panel: which env keys are injected at runtime vs hard-coded.
 *  Static demo data — the point is to show the "inject, don't bake" posture. */
export function RuntimeInjection() {
  const rows: [string, string, boolean][] = [
    ["API_BASE", "https://api.smalux.example.com", true],
    ["TRANSPORT", "ws", true],
    ["PUBLIC_BASE", "https://smalux.example.com", true],
    ["SENTRY_DSN", "https://…@sentry.io/…", false]
  ];
  return (
    <section className="glass cornered relative overflow-hidden rounded-md border border-border">
      <span className="absolute inset-x-0 top-0 h-px opacity-60" style={{ background: "linear-gradient(90deg, transparent, var(--primary), transparent)" }} />
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-sm font-semibold">运行时注入</span>
        <Badge variant="outline">注入而非硬编码</Badge>
      </div>
      <ul className="divide-y divide-border">
        {rows.map(([k, v, set]) => (
          <li key={k} className="flex items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-muted/30">
            <span
              className="size-1.5 shrink-0 rounded-full"
              style={{ background: set ? "var(--success)" : "var(--muted-foreground)", boxShadow: set ? "0 0 6px var(--success)" : "none" }}
              title={set ? "已注入" : "未注入"}
            />
            <code className="w-32 shrink-0 text-xs text-muted-foreground">{k}</code>
            <code className="truncate font-mono text-xs">{v}</code>
            {set ? <CheckCircle2 className="ml-auto size-3.5 text-success" /> : <XCircle className="ml-auto size-3.5 text-muted-foreground" />}
          </li>
        ))}
      </ul>
    </section>
  );
}
