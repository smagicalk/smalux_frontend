import { useState } from "react";

import { useUploadTheme } from "@/features/themes/hooks/use-themes";
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

/** Upload-theme dialog: name + version. Upload kicks off an isolated sandbox build. */
export function UploadDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const upload = useUploadTheme();
  const [name, setName] = useState("");
  const [version, setVersion] = useState("0.1.0");

  const submit = () => {
    if (!name) return;
    upload.mutate({ name, version }, {
      onSuccess: () => {
        toast.success("主题已上传，进入沙箱构建");
        setName(""); setVersion("0.1.0");
        onOpenChange(false);
      },
      onError: () => toast.error("上传失败")
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>上传主题</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="主题名称" hint="上传后在隔离沙箱中构建，通过后才可发布">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="neon-draft"
              className="h-9 w-full rounded-md border border-border bg-card px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </Field>
          <Field label="版本">
            <input value={version} onChange={(e) => setVersion(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-card px-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>取消</Button>
          <Button size="sm" onClick={submit} disabled={upload.isPending || !name}>上传</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
