import { useMemo, useState } from "react";
import { KeyRound, Plus, ShieldCheck, UserCog } from "lucide-react";

import { useAccounts } from "@/features/accounts/hooks/use-accounts";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";
import { EmptyState, FilterPills, StatTile } from "@/shared/ui/layout";

import { InviteDialog } from "../components/invite-dialog";
import { AccountRow, AccountSkeleton } from "../components/account-table";
import { MfaRing, RoleDonut } from "../components/account-charts";
import { ROLE_OPTS, type RoleFilter } from "../lib/account-meta";

/**
 * The accounts page. Owns the role filter and renders the KPI strip +
 * two-chart band; the invite dialog, each table row, and each chart each live
 * in their own component.
 */
export function AccountsPage() {
  const { data, isLoading } = useAccounts();
  const [role, setRole] = useState<RoleFilter>("all");
  const [inviteOpen, setInviteOpen] = useState(false);

  const accounts = (data?.accounts ?? []).filter((a) => (role === "all" ? true : a.role === role));

  const stats = useMemo(() => {
    const all = data?.accounts ?? [];
    return {
      total: all.length,
      mfa: all.filter((a) => a.mfaEnabled).length,
      passkey: all.filter((a) => a.passkeyEnabled).length,
      locked: all.filter((a) => a.status === "locked").length,
      invited: all.filter((a) => a.status === "invited").length,
      sessions: all.reduce((s, a) => s + a.sessions, 0)
    };
  }, [data]);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="账户"
        subtitle={`${data?.total ?? 0} 个`}
        action={<Button size="sm" onClick={() => setInviteOpen(true)}><Plus className="size-3.5" />邀请用户</Button>}
      />
      <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <StatTile label="用户总数" value={stats.total} icon={<UserCog className="size-4" />} />
          <StatTile label="MFA 启用" value={stats.mfa} accent="success" icon={<ShieldCheck className="size-4" />} progress={stats.total ? stats.mfa / stats.total : 0} />
          <StatTile label="Passkey" value={stats.passkey} accent="primary" icon={<KeyRound className="size-4" />} />
          <StatTile label="待接受邀请" value={stats.invited} accent="warning" />
          <StatTile label="已锁定" value={stats.locked} accent="danger" />
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div className="glass cornered relative overflow-hidden rounded-md border border-border p-2">
            <span className="absolute inset-x-0 top-0 h-px opacity-60" style={{ background: "linear-gradient(90deg, transparent, var(--danger), transparent)" }} />
            <div className="px-1 pb-1 text-xs text-muted-foreground">角色分布</div>
            <RoleDonut accounts={data?.accounts ?? []} />
          </div>
          <div className="glass cornered relative overflow-hidden rounded-md border border-border p-2">
            <span className="absolute inset-x-0 top-0 h-px opacity-60" style={{ background: "linear-gradient(90deg, transparent, var(--success), transparent)" }} />
            <div className="px-1 pb-1 text-xs text-muted-foreground">MFA 启用率</div>
            <MfaRing accounts={data?.accounts ?? []} />
          </div>
          <div className="lg:col-span-2">
            <FilterPills options={ROLE_OPTS} value={role} onChange={setRole} className="mb-2" />
            {isLoading ? (
              <AccountSkeleton />
            ) : !accounts.length ? (
              <EmptyState text="没有匹配的账户。" icon={<UserCog className="size-8" />} action={<Button size="sm" onClick={() => setInviteOpen(true)}><Plus className="size-3.5" />邀请用户</Button>} />
            ) : (
              <div className="overflow-hidden rounded-md border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">用户名</th>
                      <th className="px-3 py-2 text-left font-medium">角色</th>
                      <th className="px-3 py-2 text-left font-medium">状态</th>
                      <th className="px-3 py-2 text-left font-medium">安全</th>
                      <th className="px-3 py-2 text-right font-medium">会话</th>
                      <th className="px-3 py-2 text-right font-medium">最近登录</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {accounts.map((a) => <AccountRow key={a.id} account={a} />)}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
