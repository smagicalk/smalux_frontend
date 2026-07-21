import { useMemo, useState, type ReactNode } from "react";
import { KeyRound, Plus } from "lucide-react";

import { useTokens } from "@/features/tokens/hooks/use-tokens";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";
import { EmptyState, FilterPills, StatTile } from "@/shared/ui/layout";
import { cn } from "@/shared/lib/utils";

import { CreateTokenDialog } from "../components/create-token-dialog";
import { ActiveRing, ScopeChart } from "../components/token-charts";
import { TokenRow, TokenSkeleton } from "../components/token-list";
import { FILTER_OPTS, WEEK_MS, type Filter } from "../lib/token-meta";

/**
 * The tokens page. Owns filter/"now" state and renders the KPI strip +
 * two-chart band; the create dialog, each row, and each chart each live in
 * their own component.
 */
export function TokensPage() {
  const { data, isLoading } = useTokens();
  const [filter, setFilter] = useState<Filter>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [now] = useState(() => Date.now());

  const tokens = useMemo(() => {
    return (data?.tokens ?? []).filter((t) => {
      const active = !t.revoked && (!t.expiresAt || t.expiresAt > now);
      if (filter === "revoked") return t.revoked;
      if (filter === "active") return active;
      if (filter === "expiring") return active && t.expiresAt != null && t.expiresAt - now < WEEK_MS;
      return true;
    });
  }, [data, filter, now]);

  const stats = useMemo(() => {
    const all = data?.tokens ?? [];
    const active = all.filter((t) => !t.revoked && (!t.expiresAt || t.expiresAt > now));
    const expiringSoon = active.filter((t) => t.expiresAt && t.expiresAt - now < WEEK_MS).length;
    return {
      total: all.length,
      active: active.length,
      expiringSoon,
      revoked: all.filter((t) => t.revoked).length
    };
  }, [data, now]);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="Token / 权限"
        subtitle={`${data?.tokens.length ?? 0} 个`}
        action={<Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="size-3.5" />签发 Token</Button>}
      />
      <CreateTokenDialog open={createOpen} onOpenChange={setCreateOpen} />

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatTile label="Token 总数" value={stats.total} icon={<KeyRound className="size-4" />} />
          <StatTile label="有效" value={stats.active} accent="success" progress={stats.total ? stats.active / stats.total : 0} />
          <StatTile label="即将过期" value={stats.expiringSoon} accent="warning" />
          <StatTile label="已吊销" value={stats.revoked} accent="danger" />
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <ChartPanel title="有效占比" subtitle="实时">
            <ActiveRing active={stats.active} total={stats.total} />
          </ChartPanel>
          <div className="glass cornered relative overflow-hidden rounded-md border border-border p-2 lg:col-span-3">
            <span className="absolute inset-x-0 top-0 h-px opacity-60" style={{ background: "linear-gradient(90deg, transparent, var(--primary), transparent)" }} />
            <div className="px-1 pb-1 text-xs text-muted-foreground">Scope 分布</div>
            <ScopeChart tokens={data?.tokens ?? []} />
          </div>
        </div>

        <FilterPills options={FILTER_OPTS} value={filter} onChange={setFilter} />

        {isLoading ? (
          <TokenSkeleton />
        ) : !tokens.length ? (
          <EmptyState text="没有匹配的 Token。" icon={<KeyRound className="size-8" />} action={<Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="size-3.5" />签发 Token</Button>} />
        ) : (
          <ul className="space-y-2">
            {tokens.map((t) => <TokenRow key={t.id} token={t} now={now} />)}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Glass card with a primary-tinted top hairline + titled header. */
function ChartPanel({
  title,
  subtitle,
  className,
  children
}: {
  title: string;
  subtitle?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("glass cornered relative overflow-hidden rounded-md border border-border", className)}>
      <span className="absolute inset-x-0 top-0 h-px opacity-60" style={{ background: "linear-gradient(90deg, transparent, var(--primary), transparent)" }} />
      <div className="flex items-baseline justify-between border-b border-border px-3 py-2">
        <span className="text-sm font-semibold tracking-tight">{title}</span>
        {subtitle ? <span className="text-[11px] text-muted-foreground">{subtitle}</span> : null}
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
}
