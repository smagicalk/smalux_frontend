import { useState } from "react";
import { Copy } from "lucide-react";

import { useRevokeToken } from "@/features/tokens/hooks/use-tokens";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { toast } from "@/shared/ui/toaster";
import { formatRelativeFrom } from "@/shared/lib/utils";
import type { Token } from "@/shared/api/methods";

/** Loading skeleton shaped like the token list. */
export function TokenSkeleton() {
  return (
    <ul className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="h-24 shimmer rounded-md border border-border" />
      ))}
    </ul>
  );
}

/** One row of the token list: status dot, name, scopes, revoke action.
 *  `now` is passed in (stable per mount) so expiry math doesn't fight re-renders. */
export function TokenRow({ token, now }: { token: Token; now: number }) {
  const revoke = useRevokeToken();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const expired = token.expiresAt != null && token.expiresAt <= now;
  const dead = token.revoked || expired;
  const edgeColor = dead ? "var(--danger)" : "var(--success)";
  const expiringSoon = !dead && token.expiresAt != null && token.expiresAt - now < 7 * 86_400_000;
  const createdAbs = new Date(token.createdAt).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });

  return (
    <li className="glass cornered group relative overflow-hidden rounded-md border border-border p-3 pl-4 transition-colors hover:border-primary/40">
      <span className="absolute inset-y-0 left-0 w-1" style={{ background: edgeColor, boxShadow: `0 0 10px ${edgeColor}` }} />
      <div className="flex flex-wrap items-center gap-2">
        <span className="relative flex size-2">
          {expiringSoon ? <span className="pulse-ring" style={{ background: "var(--warning)" }} /> : null}
          <span className="size-2 rounded-full" style={{ background: edgeColor, boxShadow: `0 0 6px ${edgeColor}` }} />
        </span>
        <span className="font-medium group-hover:text-primary">{token.name}</span>
        {token.revoked ? <Badge variant="danger">已吊销</Badge> : expired ? <Badge variant="danger">已过期</Badge> : <Badge variant="success">有效</Badge>}
        {expiringSoon ? <Badge variant="warning">即将过期</Badge> : null}
        <span className="text-xs text-muted-foreground">创建人: {token.createdBy}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <Button size="icon" variant="ghost" className="size-7" aria-label="复制标识"
            onClick={() => { navigator.clipboard?.writeText(token.id); toast.success("已复制 ID"); }}>
            <Copy className="size-3.5" />
          </Button>
          {!dead ? (
            <Button size="sm" variant="danger" onClick={() => setConfirmOpen(true)}>吊销</Button>
          ) : null}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {token.scopes.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>创建: <span className="tabular-nums">{createdAbs}</span> ({formatRelativeFrom(token.createdAt)})</span>
        <span>过期: {token.expiresAt ? formatRelativeFrom(token.expiresAt) : "永不过期"}</span>
        <span>最近使用: {formatRelativeFrom(token.lastUsedAt)}</span>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="吊销 Token"
        description={`确定吊销「${token.name}」吗？吊销后立即失效且不可恢复。`}
        confirmLabel="吊销"
        destructive
        onConfirm={() => revoke.mutate(token.id, {
          onSuccess: () => toast.success("Token 已吊销"),
          onError: () => toast.error("操作失败")
        })}
      />
    </li>
  );
}
