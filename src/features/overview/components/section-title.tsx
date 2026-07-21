import type { ReactNode } from "react";

/**
 * Section title with an icon chip + a scanning gradient rule. Gives the page a
 * narrated, multi-act structure instead of a flat card soup.
 */
export function SectionTitle({
  icon,
  title,
  hint,
  accent = "primary"
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
  accent?: "primary" | "danger" | "success" | "warning";
}) {
  const color =
    accent === "danger" ? "var(--danger)"
      : accent === "success" ? "var(--success)"
        : accent === "warning" ? "var(--warning)"
          : "var(--primary)";
  return (
    <div className="flex items-center gap-2">
      <span
        className="flex size-6 items-center justify-center rounded-md"
        style={{ background: `color-mix(in oklch, ${color} 18%, transparent)`, color }}
      >
        {icon}
      </span>
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      {hint ? <span className="text-[11px] text-muted-foreground">{hint}</span> : null}
      <span
        className="ml-2 h-px flex-1"
        style={{ background: `linear-gradient(90deg, color-mix(in oklch, ${color} 50%, transparent), transparent)` }}
      />
    </div>
  );
}
