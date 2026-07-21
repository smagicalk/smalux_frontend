import { useState } from "react";

import { useInviteAccount } from "@/features/accounts/hooks/use-accounts";
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
import type { Account } from "@/shared/api/methods";

import { ROLE_LABEL } from "../lib/account-meta";

/** Invite-user dialog: username + role. */
export function InviteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const invite = useInviteAccount();
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<Account["role"]>("viewer");

  const submit = () => {
    if (!username) return;
    invite.mutate({ username, role }, {
      onSuccess: () => {
        toast.success("邀请已发送");
        setUsername(""); setRole("viewer");
        onOpenChange(false);
      },
      onError: () => toast.error("邀请失败")
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>邀请用户</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="用户名">
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="intern"
              className="h-9 w-full rounded-md border border-border bg-card px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </Field>
          <Field label="角色">
            <select value={role} onChange={(e) => setRole(e.target.value as Account["role"])}
              className="h-9 w-full rounded-md border border-border bg-card px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {(Object.keys(ROLE_LABEL) as Account["role"][]).map((r) => (
                <option key={r} value={r}>{ROLE_LABEL[r]}</option>
              ))}
            </select>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>取消</Button>
          <Button size="sm" onClick={submit} disabled={invite.isPending || !username}>发送邀请</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
