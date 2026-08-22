import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

export type AccentTone =
  | "neutral"
  | "primary"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "cyan"
  | "violet"
  | "magenta";

const STAT_TONES: Record<AccentTone, { text: string; badge: string; border: string; glow: string }> = {
  neutral: { text: "text-foreground", badge: "bg-muted text-muted-foreground", border: "border-border/80", glow: "transparent" },
  primary: { text: "text-primary", badge: "bg-primary/10 text-primary border-primary/20", border: "border-primary/30", glow: "var(--primary)" },
  info: { text: "text-info", badge: "bg-info/10 text-info border-info/20", border: "border-info/30", glow: "var(--info)" },
  success: { text: "text-success", badge: "bg-success/10 text-success border-success/20", border: "border-success/30", glow: "var(--success)" },
  warning: { text: "text-warning", badge: "bg-warning/10 text-warning border-warning/20", border: "border-warning/30", glow: "var(--warning)" },
  danger: { text: "text-danger", badge: "bg-danger/10 text-danger border-danger/20", border: "border-danger/30", glow: "var(--danger)" },
  cyan: { text: "text-sky-500", badge: "bg-sky-500/10 text-sky-500 border-sky-500/20", border: "border-sky-500/30", glow: "var(--info)" },
  violet: { text: "text-indigo-500", badge: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20", border: "border-indigo-500/30", glow: "var(--primary)" },
  magenta: { text: "text-pink-500", badge: "bg-pink-500/10 text-pink-500 border-pink-500/20", border: "border-pink-500/30", glow: "var(--danger)" }
};

/** Modern Centered empty state. */
export function EmptyState({
  title,
  text,
  icon,
  action,
  className
}: {
  title?: string;
  text: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground rounded-lg border border-dashed border-border/80 bg-muted/20", className)}>
      {icon ? <div className="rounded-full bg-muted/60 p-3 text-muted-foreground/80">{icon}</div> : null}
      <div className="space-y-1">
        {title ? <h4 className="text-sm font-semibold text-foreground">{title}</h4> : null}
        <p className="text-xs text-muted-foreground max-w-sm">{text}</p>
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

/** Modern KPI Tile */
export function StatTile({
  label,
  value,
  accent = "neutral",
  icon,
  hint,
  trend,
  progress,
  className
}: {
  label: string;
  value: number | string;
  accent?: AccentTone;
  icon?: ReactNode;
  hint?: string;
  trend?: number;
  progress?: number;
  className?: string;
}) {
  const tone = STAT_TONES[accent] || STAT_TONES.neutral;
  const trendUp = (trend ?? 0) >= 0;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border/80 bg-card p-4 transition-all duration-200 hover:border-border hover:shadow-xs",
        className
      )}
    >
      <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
        <span className="flex items-center gap-1.5">
          {icon && <span className="text-muted-foreground/80">{icon}</span>}
          {label}
        </span>
        {trend != null && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums border",
              trendUp
                ? "bg-success/10 border-success/20 text-success"
                : "bg-danger/10 border-danger/20 text-danger"
            )}
          >
            {trendUp ? "↑" : "↓"} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>

      <div className={cn("mt-2.5 text-2xl font-bold tracking-tight tabular-nums", tone.text)}>
        {value}
      </div>

      {progress != null && (
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.max(0, progress * 100))}%`,
              backgroundColor: tone.glow !== "transparent" ? tone.glow : "var(--primary)"
            }}
          />
        </div>
      )}

      {hint && <div className="mt-1 text-[11px] text-muted-foreground/80">{hint}</div>}
    </div>
  );
}

/** Pill-style filter bar */
export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  className
}: {
  options: ReadonlyArray<{
    key: T;
    label: string;
    activeClassName?: string;
    inactiveClassName?: string;
  }>;
  value: T;
  onChange: (next: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-1 rounded-lg border border-border/80 bg-muted/40 p-1", className)}>
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer",
              active
                ? "bg-card text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function Field({
  label,
  children,
  description,
  hint,
  error,
  className
}: {
  label: string;
  children: ReactNode;
  description?: string;
  hint?: string;
  error?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-xs font-medium text-foreground">{label}</label>
      {children}
      {(description || hint) && (
        <p className="text-[11px] text-muted-foreground">{description || hint}</p>
      )}
      {error && <p className="text-[11px] text-danger">{error}</p>}
    </div>
  );
}
