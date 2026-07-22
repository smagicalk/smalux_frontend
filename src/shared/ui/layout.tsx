import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type AccentTone = "neutral" | "primary" | "cyan" | "violet" | "magenta" | "success" | "warning" | "danger";

const STAT_TONES: Record<AccentTone, { text: string; panel: string; color: string }> = {
  neutral: { text: "text-foreground", panel: "border-border", color: "var(--muted-foreground)" },
  primary: { text: "text-primary", panel: "border-primary/20 bg-primary/5", color: "var(--primary)" },
  cyan: { text: "text-cyan", panel: "border-cyan/20 bg-cyan/5", color: "var(--cyan)" },
  violet: { text: "text-violet", panel: "border-violet/20 bg-violet/5", color: "var(--violet)" },
  magenta: { text: "text-magenta", panel: "border-magenta/20 bg-magenta/5", color: "var(--magenta)" },
  success: { text: "text-success", panel: "border-success/20 bg-success/5", color: "var(--success)" },
  warning: { text: "text-warning", panel: "border-warning/20 bg-warning/5", color: "var(--warning)" },
  danger: { text: "text-danger", panel: "border-danger/20 bg-danger/5", color: "var(--danger)" }
};

/** Centered empty/loading state. Consistent across pages. */
export function EmptyState({
  text,
  icon,
  action
}: {
  text: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-sm text-muted-foreground">
      {icon ? <div className="text-muted-foreground/60">{icon}</div> : null}
      <span>{text}</span>
      {action}
    </div>
  );
}

/** Compact KPI tile: label + big number, optional accent/icon/trend/progress. */
export function StatTile({
  label,
  value,
  accent = "neutral",
  icon,
  hint,
  trend,
  progress
}: {
  label: string;
  value: number | string;
  accent?: AccentTone;
  icon?: ReactNode;
  hint?: string;
  /** Signed percent change vs a prior period; renders a colored ↑/↓ chip. */
  trend?: number;
  /** 0..1 ratio rendered as a thin progress bar under the value. */
  progress?: number;
}) {
  const tone = STAT_TONES[accent];
  const trendUp = (trend ?? 0) >= 0;
  return (
    <div className={cn("glass relative overflow-hidden rounded-md border px-3 py-2.5", tone.panel)}>
      <span
        className="absolute inset-x-0 top-0 h-px opacity-70"
        style={{ background: `linear-gradient(90deg, transparent, ${tone.color}, transparent)` }}
      />
      <span
        className="pointer-events-none absolute -right-6 -top-6 size-16 rounded-full opacity-20 blur-xl"
        style={{ background: tone.color }}
      />
      <div className="relative flex items-center gap-1 text-xs text-muted-foreground">
        {icon}
        {label}
        {trend != null ? (
          <span
            className={cn(
              "ml-auto inline-flex items-center gap-0.5 rounded px-1 text-[10px] font-medium tabular-nums",
              trendUp ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
            )}
          >
            {trendUp ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}%
          </span>
        ) : null}
      </div>
      <div className={cn("relative mt-1 text-2xl font-semibold tabular-nums", tone.text)}>{value}</div>
      {progress != null ? (
        <div className="relative mt-1.5 h-1 w-full overflow-hidden rounded bg-muted">
          <div
            className="h-full rounded transition-all"
            style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%`, background: tone.color }}
          />
        </div>
      ) : null}
      {hint ? <div className="relative mt-0.5 text-[11px] text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

/** Pill-style filter bar (all / enabled / disabled …). */
export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  className
}: {
  options: ReadonlyArray<{
    key: T;
    label: string;
    /** Optional semantic colors let domain filters retain their meaning. */
    activeClassName?: string;
    inactiveClassName?: string;
  }>;
  value: T;
  onChange: (next: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs transition-colors",
            value === opt.key
              ? opt.activeClassName ?? "bg-primary text-primary-foreground"
              : opt.inactiveClassName ?? "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/** A titled, bordered section — the standard content container for a page. */
export function SectionCard({
  title,
  action,
  children,
  className,
  bodyClassName
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("glass rounded-md border border-border", className)}>
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </div>
      <div className={cn("p-3", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Labeled form field used inside dialogs. */
export function Field({
  label,
  children,
  hint
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-muted-foreground">{label}</label>
      {children}
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
