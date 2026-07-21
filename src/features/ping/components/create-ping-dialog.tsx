import { useState } from "react";

import { useCreatePingTarget } from "@/features/ping/hooks/use-ping";
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
import type { PingProtocol, PingTarget } from "@/shared/api/methods";

import { GROUP_LABEL, PROTOCOL_LABEL } from "../lib/ping-meta";

/** Add-ping-target dialog: name + address + protocol + group. */
export function CreatePingDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const create = useCreatePingTarget();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [protocol, setProtocol] = useState<PingProtocol>("http");
  const [group, setGroup] = useState<PingTarget["group"]>("private");

  const submit = () => {
    if (!name || !address) return;
    create.mutate({ name, address, protocol, group }, {
      onSuccess: () => {
        toast.success("监控目标已添加");
        setName(""); setAddress(""); setProtocol("http"); setGroup("private");
        onOpenChange(false);
      },
      onError: () => toast.error("添加失败")
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>添加监控目标</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="名称">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="主站 HTTPS"
              className="h-9 w-full rounded-md border border-border bg-card px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </Field>
          <Field label="地址">
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="https://example.com"
              className="h-9 w-full rounded-md border border-border bg-card px-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="协议">
              <select value={protocol} onChange={(e) => setProtocol(e.target.value as PingProtocol)}
                className="h-9 w-full rounded-md border border-border bg-card px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {(Object.keys(PROTOCOL_LABEL) as PingProtocol[]).map((p) => (
                  <option key={p} value={p}>{PROTOCOL_LABEL[p]}</option>
                ))}
              </select>
            </Field>
            <Field label="分组">
              <select value={group} onChange={(e) => setGroup(e.target.value as PingTarget["group"])}
                className="h-9 w-full rounded-md border border-border bg-card px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {(Object.keys(GROUP_LABEL) as PingTarget["group"][]).map((g) => (
                  <option key={g} value={g}>{GROUP_LABEL[g]}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>取消</Button>
          <Button size="sm" onClick={submit} disabled={create.isPending || !name || !address}>添加</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
