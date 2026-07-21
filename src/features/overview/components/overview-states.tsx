import { Layers } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

/** Skeleton grid shown while the server list loads on first paint. */
export function OverviewSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[210px] shimmer rounded-md border border-border" />
        ))}
      </div>
      <div className="h-10 shimmer rounded-md border border-border" />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-[230px] shimmer rounded-md border border-border" />
        ))}
      </div>
    </div>
  );
}

/** Empty state when the fleet has no servers yet — points the operator to add one. */
export function EmptyFleet() {
  const navigate = useNavigate();
  return (
    <div className="glass datagrid scanline cornered relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-md border border-border py-16 text-center">
      <span className="scanline__beam" />
      <div className="relative flex size-12 items-center justify-center rounded-full" style={{ background: "color-mix(in oklch, var(--primary) 15%, transparent)", color: "var(--primary)" }}>
        <Layers className="size-6" />
      </div>
      <div className="relative">
        <div className="text-sm font-medium">舰队尚未接入任何节点</div>
        <div className="mt-1 text-xs text-muted-foreground">注册第一台服务器后，实时监控与分布画像将在此呈现。</div>
      </div>
      <button
        onClick={() => navigate({ to: "/admin/servers" as never })}
        className="relative rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        前往服务器页注册
      </button>
    </div>
  );
}
