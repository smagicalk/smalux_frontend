import { Archive, Rocket } from "lucide-react";

import { useArchiveTheme, usePublishTheme } from "@/features/themes/hooks/use-themes";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { toast } from "@/shared/ui/toaster";
import { formatRelativeFrom } from "@/shared/lib/utils";
import type { Theme } from "@/shared/api/methods";

import { STATUS_META, SWATCHES } from "../lib/theme-meta";

/** Loading skeleton shaped like the theme card grid. */
export function ThemeSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-44 shimmer rounded-md border border-border" />
      ))}
    </div>
  );
}

/** One theme card: swatch strip, status, version, publish/archive actions. */
export function ThemeCard({ theme }: { theme: Theme }) {
  const publish = usePublishTheme();
  const archive = useArchiveTheme();
  const meta = STATUS_META[theme.status];
  const edgeColor = meta.variant === "success" ? "var(--success)" : meta.variant === "warning" ? "var(--warning)" : "var(--muted-foreground)";
  const updatedAbs = new Date(theme.updatedAt).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
  return (
    <div className="glass cornered group relative overflow-hidden rounded-md border border-border p-3 transition-colors hover:border-primary/40">
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: edgeColor, boxShadow: `0 0 10px ${edgeColor}` }} />
      <div className="mb-3 flex h-16 overflow-hidden rounded-md ring-1 ring-border">
        {SWATCHES.map((v) => (
          <div key={v} className="flex-1 transition-transform group-hover:scale-y-105" style={{ background: `var(${v})` }} title={v} />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="relative flex size-2">
          {theme.status === "published" ? <span className="pulse-ring" style={{ background: edgeColor }} /> : null}
          <span className="size-2 rounded-full" style={{ background: edgeColor, boxShadow: `0 0 6px ${edgeColor}` }} />
        </span>
        <span className="font-medium group-hover:text-primary">{theme.name}</span>
        <Badge variant="outline">v{theme.version}</Badge>
        <Badge variant={meta.variant}>{meta.label}</Badge>
        {theme.publicVisible ? <Badge variant="primary">公开</Badge> : <Badge variant="neutral">私有</Badge>}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{theme.author}</span>
        <span className="tabular-nums">{updatedAbs} ({formatRelativeFrom(theme.updatedAt)})</span>
      </div>
      {theme.status === "draft" || theme.status === "published" ? (
        <div className="mt-2 flex gap-1.5">
          {theme.status === "draft" ? (
            <Button size="sm" className="flex-1"
              onClick={() => publish.mutate(theme.id, {
                onSuccess: () => toast.success("已发布"),
                onError: () => toast.error("发布失败")
              })}
              disabled={publish.isPending}>
              <Rocket className="size-3.5" />发布
            </Button>
          ) : null}
          <Button size="sm" variant="outline"
            onClick={() => archive.mutate(theme.id, {
              onSuccess: () => toast.success("已归档"),
              onError: () => toast.error("操作失败")
            })}
            disabled={archive.isPending}>
            <Archive className="size-3.5" />归档
          </Button>
        </div>
      ) : null}
    </div>
  );
}
