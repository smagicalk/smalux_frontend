import { ShieldAlertIcon, SlidersHorizontalIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

const themeUploadSettingRows = [
  ["maxZipSizeMb", "20 MB"],
  ["maxExtractedSizeMb", "80 MB"],
  ["maxThemeCount", "20"],
  ["isolatePublicThemeCookies", "true"]
] as const;

export function ThemeUploadSettingsCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>上传设置参数</CardTitle>
            <CardDescription>
              系统设置需要限制主题包大小、文件类型、脚本能力和 Cookie 隔离，不然主题管理会变成上传通道。
            </CardDescription>
          </div>
          <SlidersHorizontalIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {themeUploadSettingRows.map(([key, value]) => (
          <div key={key} className="rounded-[1rem] bg-[color:var(--surface-muted)] p-3 dark:bg-white/6">
            <p className="break-all text-[10px] font-semibold uppercase leading-4 tracking-[0.14em] text-muted-foreground">
              {key}
            </p>
            <p className="mt-1 text-sm font-semibold tracking-[-0.02em]">{value}</p>
          </div>
        ))}
        <div className="flex gap-3 rounded-[1.15rem] border border-warning/25 bg-[color:var(--surface-warning)] p-3 text-sm md:col-span-2 xl:col-span-4">
          <ShieldAlertIcon className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
          <span>公开主题可包含脚本时，必须与后台 Cookie、CSP 和 API 权限隔离。</span>
        </div>
      </CardContent>
    </Card>
  );
}
