import { useState } from "react";
import { Copy } from "lucide-react";

import { useCreateToken } from "@/features/tokens/hooks/use-tokens";
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
import { cn } from "@/shared/lib/utils";

import { SCOPES } from "../lib/token-meta";

/** Create-token dialog: name + scope chips + expiry. On success it surfaces a
 *  one-time mock secret the user must copy. */
export function CreateTokenDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const create = useCreateToken();
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>(["node:read"]);
  const [expiresDays, setExpiresDays] = useState("30");
  const [secret, setSecret] = useState<string | null>(null);

  const toggleScope = (s: string) =>
    setScopes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const submit = () => {
    if (!name || !scopes.length) return;
    const expiresAt = expiresDays ? Date.now() + Number(expiresDays) * 86_400_000 : undefined;
    create.mutate({ name, scopes, expiresAt }, {
      onSuccess: () => {
        // Mock: show a fake secret once. The real backend would return it.
        setSecret(`smalux.${btoa(name).slice(0, 12)}.${Math.random().toString(36).slice(2, 18)}`);
        toast.success("Token 已签发");
        setName(""); setScopes(["node:read"]); setExpiresDays("30");
      },
      onError: () => toast.error("签发失败")
    });
  };

  const close = () => {
    setSecret(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setSecret(null); onOpenChange(v); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{secret ? "Token 已签发" : "签发 Token"}</DialogTitle></DialogHeader>
        {secret ? (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">请立即复制保存，此密钥仅显示一次。</p>
            <code className="block break-all rounded bg-muted p-2 font-mono text-xs">{secret}</code>
            <DialogFooter>
              <Button size="sm" variant="outline" onClick={() => { navigator.clipboard?.writeText(secret); toast.success("已复制到剪贴板"); }}>
                <Copy className="size-3.5" />复制
              </Button>
              <Button size="sm" onClick={close}>完成</Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <Field label="名称">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="deploy-bot"
                  className="h-9 w-full rounded-md border border-border bg-card px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </Field>
              <Field label="作用域 (Scope)">
                <div className="flex flex-wrap gap-1.5">
                  {SCOPES.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleScope(s)}
                      className={cn(
                        "rounded-md border px-2 py-1 font-mono text-xs transition-colors",
                        scopes.includes(s)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="有效期(天，留空=永不过期)">
                <input value={expiresDays} onChange={(e) => setExpiresDays(e.target.value)}
                  className="h-9 w-full rounded-md border border-border bg-card px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
              </Field>
            </div>
            <DialogFooter>
              <Button variant="ghost" size="sm" onClick={close}>取消</Button>
              <Button size="sm" onClick={submit} disabled={create.isPending || !name || !scopes.length}>签发</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
