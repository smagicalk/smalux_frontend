import { useState, type ReactNode } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";

import { useLockAccount, useUpdateAccount } from "@/features/accounts/hooks/use-accounts";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/shared/ui/dialog";
import { Field } from "@/shared/ui/layout";
import { toast } from "@/shared/ui/toaster";
import { cn, formatRelativeFrom } from "@/shared/lib/utils";
import type { Account } from "@/shared/api/methods";

import { ROLE_LABEL, ROLE_VARIANT, STATUS_META } from "../lib/account-meta";

/** Loading skeleton shaped like the account table. */
export function AccountSkeleton() {
  return (
    <div className="overflow-hidden rounded-md border border-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-11 shimmer border-b border-border last:border-b-0" />
      ))}
    </div>
  );
}

/** One row of the account table: status dot, role, security flags, lock/edit. */
export function AccountRow({ account }: { account: Account }) {
  const lock = useLockAccount();
  const status = STATUS_META[account.status];
  const locked = account.status === "locked";
  const invited = account.status === "invited";
  const [editOpen, setEditOpen] = useState(false);
  const dotColor = locked ? "var(--danger)" : invited ? "var(--warning)" : "var(--success)";
  const lastAbs = account.lastLoginAt
    ? new Date(account.lastLoginAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
    : null;
  return (
    <tr className="group hover:bg-muted/30">
      <td className="px-3 py-2">
        <span className="inline-flex items-center gap-2">
          <span className="relative flex size-2">
            {locked ? <span className="pulse-ring" style={{ background: dotColor }} /> : null}
            <span className="size-2 rounded-full" style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}` }} />
          </span>
          <span className="font-medium group-hover:text-primary">{account.username}</span>
        </span>
      </td>
      <td className="px-3 py-2"><Badge variant={ROLE_VARIANT[account.role]}>{ROLE_LABEL[account.role]}</Badge></td>
      <td className="px-3 py-2"><Badge variant={status.variant}>{status.label}</Badge></td>
      <td className="px-3 py-2">
        <div className="flex gap-1.5">
          <SecurityFlag on={account.mfaEnabled} icon={<ShieldCheck className="size-3" />} label="MFA" />
          <SecurityFlag on={account.passkeyEnabled} icon={<KeyRound className="size-3" />} label="Passkey" />
        </div>
      </td>
      <td className="px-3 py-2 text-right tabular-nums">{account.sessions}</td>
      <td className="px-3 py-2 text-right text-muted-foreground">
        <span className="tabular-nums">{lastAbs ?? "—"}</span>
        <span className="ml-1 text-xs">({formatRelativeFrom(account.lastLoginAt)})</span>
      </td>
      <td className="px-3 py-2 text-right">
        <div className="flex justify-end gap-1.5">
          <Button size="sm" variant="ghost" onClick={() => setEditOpen(true)}>角色</Button>
          <Button size="sm" variant="outline"
            onClick={() => lock.mutate({ id: account.id, locked: !locked }, {
              onSuccess: () => toast.success(locked ? "已解锁" : "已锁定"),
              onError: () => toast.error("操作失败")
            })}
            disabled={lock.isPending || invited}>
            {locked ? "解锁" : "锁定"}
          </Button>
        </div>
        <EditRoleDialog account={account} open={editOpen} onOpenChange={setEditOpen} />
      </td>
    </tr>
  );
}

/** Edit-role dialog: change an account's role (admin/operator/viewer/auditor). */
function EditRoleDialog({
  account,
  open,
  onOpenChange
}: {
  account: Account;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const update = useUpdateAccount();
  const [role, setRole] = useState<Account["role"]>(account.role);

  const submit = () => {
    if (role === account.role) {
      onOpenChange(false);
      return;
    }
    update.mutate({ id: account.id, role }, {
      onSuccess: () => {
        toast.success(`已将「${account.username}」设为${ROLE_LABEL[role]}`);
        onOpenChange(false);
      },
      onError: () => toast.error("操作失败")
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>编辑角色 · {account.username}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="角色" hint="管理员可管理账户与系统；运维可执行命令；只读仅查看；审计只读且留痕">
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(ROLE_LABEL) as Account["role"][]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm transition-colors",
                    role === r
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {ROLE_LABEL[r]}
                </button>
              ))}
            </div>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>取消</Button>
          <Button size="sm" onClick={submit} disabled={update.isPending}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SecurityFlag({ on, icon, label }: { on: boolean; icon: ReactNode; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs",
        on ? "bg-success/15 text-success" : "bg-muted text-muted-foreground line-through"
      )}
      title={on ? `${label} 已启用` : `${label} 未启用`}
    >
      {icon}
      {label}
    </span>
  );
}
