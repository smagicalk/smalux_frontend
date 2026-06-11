import { UploadIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/shared/ui/card";

export function ThemeUploadPanel() {
  const [fileName, setFileName] = useState<string>("");

  return (
    <Card tone="strong">
      <CardHeader>
        <CardTitle>上传主题</CardTitle>
        <CardDescription>公开主页主题包的入口必须同时强调上传流程和隔离边界，而不是只有一个文件框。</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-[1.25rem] border border-dashed border-border bg-[color:var(--surface-muted)] px-4 py-6 text-center transition hover:bg-white/70 dark:hover:bg-white/6">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-white/75 text-muted-foreground dark:bg-white/8">
            <UploadIcon aria-hidden />
          </div>
          <span className="text-sm font-semibold tracking-[-0.02em]">
            {fileName || "选择 theme.zip"}
          </span>
          <span className="text-xs text-muted-foreground">manifest、参数声明与资源结构会在上传后统一校验</span>
          <input
            className="sr-only"
            type="file"
            accept=".zip"
            onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
          />
        </label>
        <div className="flex justify-end">
          <Button
            disabled={!fileName}
            onClick={() =>
              toast.success("主题包已进入校验队列", {
                description: `${fileName} · manifest / CSP / 资源隔离将被检查。`
              })
            }
          >
            上传主题包
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
