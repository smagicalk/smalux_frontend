import { RotateCcwIcon, Settings2Icon } from "lucide-react";
import { toast } from "sonner";

import type { PublicTheme, ThemeStatus } from "@/features/themes/model/mock-themes";
import { Badge, type BadgeVariant } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Field, Select } from "@/shared/ui/form-controls";

const statusMeta: Record<ThemeStatus, { label: string; variant: BadgeVariant }> = {
  active: { label: "已启用", variant: "success" },
  preview: { label: "预览中", variant: "warning" },
  draft: { label: "草稿", variant: "secondary" }
};

type ThemeLibraryPanelProps = {
  themes: readonly PublicTheme[];
  statusFilter: ThemeStatus | "all";
  onStatusFilterChange: (value: ThemeStatus | "all") => void;
  onReset: () => void;
};

export function ThemeLibraryPanel({
  themes,
  statusFilter,
  onStatusFilterChange,
  onReset
}: ThemeLibraryPanelProps) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>主题筛选</CardTitle>
          <CardDescription>按生命周期调试主题列表、参数分布和公开主题治理状态。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[220px_auto]">
          <Field label="状态">
            <Select
              value={statusFilter}
              onChange={(event) => onStatusFilterChange(event.target.value as ThemeStatus | "all")}
            >
              <option value="all">全部主题</option>
              <option value="active">已启用</option>
              <option value="preview">预览中</option>
              <option value="draft">草稿</option>
            </Select>
          </Field>
          <div className="flex items-end">
            <Button variant="outline" className="w-full md:w-auto" onClick={onReset}>
              重置
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card tone="strong">
        <CardHeader>
          <CardTitle>公开主题</CardTitle>
          <CardDescription>
            上传、预览、启用、回滚和参数配置都集中在这里，避免主题管理被拆成碎片功能。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {themes.map((theme) => (
            <ThemeLibraryItem key={theme.id} theme={theme} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

type ThemeLibraryItemProps = {
  theme: PublicTheme;
};

function ThemeLibraryItem({ theme }: ThemeLibraryItemProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="rounded-[1.2rem] border border-white/45 bg-[color:var(--surface-muted)] p-4 text-left transition hover:-translate-y-0.5 hover:bg-white/75 hover:shadow-[var(--shadow-soft)] dark:border-white/8 dark:bg-white/6 dark:hover:bg-white/8"
      onClick={() =>
        toast.info(theme.name, {
          description: `${theme.status} · v${theme.version} · ${theme.author}`
        })
      }
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toast.info(theme.name, {
            description: `${theme.status} · v${theme.version} · ${theme.author}`
          });
        }
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold tracking-[-0.02em]">{theme.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {theme.short} · v{theme.version} · {theme.author}
          </p>
        </div>
        <Badge variant={statusMeta[theme.status].variant}>{statusMeta[theme.status].label}</Badge>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {theme.configuration.map((item) => (
          <div key={item.key} className="rounded-[1rem] bg-white/70 p-3 dark:bg-white/6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-1 truncate text-sm font-semibold tracking-[-0.02em]">
              {String(item.value)}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            toast.info("已打开主题参数", {
              description: `${theme.name} · ${theme.configuration.length} 个参数。`
            });
          }}
        >
          <Settings2Icon data-icon="inline-start" aria-hidden />
          参数
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            toast.warning("已生成回滚预案", {
              description: `${theme.name} 将回滚到上一版本快照。`
            });
          }}
        >
          <RotateCcwIcon data-icon="inline-start" aria-hidden />
          回滚
        </Button>
      </div>
    </div>
  );
}
