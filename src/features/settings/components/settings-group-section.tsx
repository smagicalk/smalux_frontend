import { Gauge, Globe, Lock, SlidersHorizontal } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import type { Setting } from "@/shared/api/methods";

const GROUP_LABEL: Record<Setting["group"], string> = {
  general: "通用",
  security: "安全",
  limits: "限制项",
  network: "网络"
};

const GROUP_META: Record<Setting["group"], { icon: React.ReactNode; color: string }> = {
  general: { icon: <SlidersHorizontal className="size-3.5" />, color: "var(--primary)" },
  security: { icon: <Lock className="size-3.5" />, color: "var(--danger)" },
  limits: { icon: <Gauge className="size-3.5" />, color: "var(--warning)" },
  network: { icon: <Globe className="size-3.5" />, color: "var(--violet)" }
};

/** Renders one settings group and reports draft edits back to the page. */
export function SettingsGroupSection({
  group,
  items,
  draft,
  onDraftChange
}: {
  group: Setting["group"];
  items: Setting[];
  draft: Record<string, string>;
  onDraftChange: (key: string, value: string) => void;
}) {
  const meta = GROUP_META[group];

  return (
    <section className="glass relative overflow-hidden rounded-md border border-border">
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: meta.color, boxShadow: `0 0 10px ${meta.color}` }} />
      <div className="flex items-center gap-2 border-b border-border px-3 py-2 pl-4">
        <span className="flex size-5 items-center justify-center rounded" style={{ background: `color-mix(in oklch, ${meta.color} 18%, transparent)`, color: meta.color }}>
          {meta.icon}
        </span>
        <span className="text-sm font-semibold">{GROUP_LABEL[group]}</span>
        <span className="text-xs text-muted-foreground">{items.length} 项</span>
      </div>
      <ul className="divide-y divide-border">
        {items.map((setting) => {
          const value = draft[setting.key] ?? setting.value;
          const changed = draft[setting.key] != null && draft[setting.key] !== setting.value;
          return (
            <li key={setting.key} className="flex items-center gap-3 px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="text-sm">{setting.label}</div>
                <code className="text-xs text-muted-foreground">{setting.key}</code>
              </div>
              <input
                value={value}
                disabled={!setting.editable}
                onChange={(event) => onDraftChange(setting.key, event.target.value)}
                className={cn(
                  "h-8 w-56 rounded-md border border-border bg-card px-2 text-right font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  !setting.editable && "cursor-not-allowed opacity-60",
                  changed && "border-primary"
                )}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
