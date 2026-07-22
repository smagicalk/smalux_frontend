import { useState, type FormEvent } from "react";

import { useRegisterServer } from "@/features/servers/hooks/use-servers";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/shared/ui/dialog";
import { Field } from "@/shared/ui/layout";
import { toast } from "@/shared/ui/toaster";

/** Shared input styling — glass card surface matching the list filter bar. */
const INPUT_CLS =
  "h-9 w-full rounded-md border border-border bg-card/60 px-2 text-sm outline-none backdrop-blur-sm transition-colors focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-ring";

/**
 * Register only operator-owned metadata. Region, network addresses and
 * platform facts belong to Agent discovery and must not be guessed here.
 */
export function AddServerDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const register = useRegisterServer();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [tags, setTags] = useState("");

  const reset = () => {
    setName("");
    setNote("");
    setTags("");
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    register.mutate(
      {
        name: trimmedName,
        note: note.trim() || undefined,
        tags: tags ? tags.split(/[,，\s]+/).filter(Boolean) : []
      },
      {
        onSuccess: () => {
          toast.success(`已注册服务器「${trimmedName}」`);
          reset();
          onOpenChange(false);
        },
        onError: () => toast.error("注册失败")
      }
    );
  };

  const changeOpen = (nextOpen: boolean) => {
    // Closing via Cancel, Escape, overlay or the title-bar close button should
    // all discard partial input consistently.
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>添加服务器</DialogTitle>
          <DialogDescription className="sr-only">填写服务器名称及可选备注和标签</DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <div className="flex flex-col gap-3">
            <Field label="名称" hint="显示名，唯一标识这台节点">
              <input
                aria-label="名称"
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="web-prod-01"
                className={INPUT_CLS}
              />
            </Field>
            <Field label="备注" hint="可选，该节点的用途说明">
              <input
                aria-label="备注"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="生产环境 / Web 前端集群"
                className={INPUT_CLS}
              />
            </Field>
            <Field label="标签" hint="逗号分隔，如 prod, web">
              <input
                aria-label="标签"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="prod, web"
                className={INPUT_CLS}
              />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => changeOpen(false)} disabled={register.isPending}>取消</Button>
            <Button type="submit" size="sm" disabled={register.isPending || !name.trim()}>
              {register.isPending ? "注册中..." : "注册"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
