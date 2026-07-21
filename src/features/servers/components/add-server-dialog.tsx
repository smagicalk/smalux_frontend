import { useState, type KeyboardEvent } from "react";

import { useRegisterServer } from "@/features/servers/hooks/use-servers";
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

/** Shared input/select styling — glass card surface matching the list filter bar. */
const INPUT_CLS =
  "h-9 w-full rounded-md border border-border bg-card/60 px-2 text-sm outline-none backdrop-blur-sm transition-colors focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring";

const DEFAULT_OS = "linux";
const DEFAULT_ARCH = "x86_64";

/** Add-server dialog: registers a new node with identity + OS/arch + tags. */
export function AddServerDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const register = useRegisterServer();
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [ipv4, setIpv4] = useState("");
  const [note, setNote] = useState("");
  const [os, setOs] = useState(DEFAULT_OS);
  const [arch, setArch] = useState(DEFAULT_ARCH);
  const [tags, setTags] = useState("");

  const reset = () => {
    setName(""); setRegion(""); setIpv4(""); setNote("");
    setOs(DEFAULT_OS); setArch(DEFAULT_ARCH); setTags("");
  };

  const submit = () => {
    if (!name || !region) return;
    register.mutate(
      {
        name,
        region,
        ipv4: ipv4 || undefined,
        os: os || undefined,
        arch: arch || undefined,
        note: note || undefined,
        tags: tags ? tags.split(/[,，\s]+/).filter(Boolean) : []
      },
      {
        onSuccess: () => {
          toast.success(`已注册服务器「${name}」`);
          reset();
          onOpenChange(false);
        },
        onError: () => toast.error("注册失败")
      }
    );
  };

  // Enter submits the form; Shift+Enter is ignored so a future multiline
  // note field could still type a newline.
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !(e.target as HTMLElement).isContentEditable) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>添加服务器</DialogTitle></DialogHeader>
        <div className="space-y-3" onKeyDown={onKey}>
          <Field label="名称" hint="显示名，唯一标识这台节点">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="web-prod-01" className={INPUT_CLS} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="区域">
              <input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="华东-1" className={INPUT_CLS} />
            </Field>
            <Field label="IPv4">
              <input value={ipv4} onChange={(e) => setIpv4(e.target.value)} placeholder="10.0.0.1" className={`${INPUT_CLS} font-mono`} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="操作系统">
              <select value={os} onChange={(e) => setOs(e.target.value)} className={INPUT_CLS}>
                <option value="linux">Linux</option>
                <option value="windows">Windows</option>
                <option value="darwin">macOS</option>
                <option value="freebsd">FreeBSD</option>
              </select>
            </Field>
            <Field label="架构">
              <select value={arch} onChange={(e) => setArch(e.target.value)} className={INPUT_CLS}>
                <option value="x86_64">x86_64</option>
                <option value="aarch64">aarch64</option>
                <option value="armv7">armv7</option>
              </select>
            </Field>
          </div>
          <Field label="备注" hint="可选，该节点的用途说明">
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="生产环境 / Web 前端集群" className={INPUT_CLS} />
          </Field>
          <Field label="标签" hint="逗号分隔，如 prod, web">
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="prod, web" className={INPUT_CLS} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>取消</Button>
          <Button size="sm" onClick={submit} disabled={register.isPending || !name || !region}>注册</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
