import { PaletteIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ThemePackageRules } from "@/features/themes/components/theme-package-rules";
import { ThemeUploadPanel } from "@/features/themes/components/theme-upload-panel";
import { ThemeGovernancePanel } from "@/features/themes/components/theme-governance-panel";
import { ThemeLibraryPanel } from "@/features/themes/components/theme-library-panel";
import { ThemeLifecyclePanel } from "@/features/themes/components/theme-lifecycle-panel";
import { mockPublicThemes, type ThemeStatus } from "@/features/themes/model/mock-themes";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";

const uploadTrend = [2, 3, 2, 4, 5, 4, 6, 5, 7, 6, 8, 9];

const packageLimitBars = [
  { label: "ZIP", value: 20 },
  { label: "解压", value: 80 },
  { label: "主题数", value: 20 },
  { label: "参数项", value: 48 }
];

const statusColor: Record<ThemeStatus, string> = {
  active: "var(--chart-1)",
  preview: "var(--chart-3)",
  draft: "var(--chart-4)"
};

export function ThemesPage() {
  const [statusFilter, setStatusFilter] = useState<ThemeStatus | "all">("all");

  const filteredThemes = useMemo(
    () =>
      mockPublicThemes.filter((theme) => statusFilter === "all" || theme.status === statusFilter),
    [statusFilter]
  );

  const configTypeBars = useMemo(
    () =>
      filteredThemes
        .flatMap((theme) => theme.configuration)
        .reduce<Array<{ label: string; value: number }>>((items, config) => {
          const existing = items.find((item) => item.label === config.type);
          if (existing) {
            existing.value += 1;
            return items;
          }

          return [...items, { label: config.type, value: 1 }];
        }, []),
    [filteredThemes]
  );

  const statusSegments = (["active", "preview", "draft"] as const).map((status) => ({
    label: {
      active: "已启用",
      preview: "预览中",
      draft: "草稿"
    }[status],
    value: filteredThemes.filter((theme) => theme.status === status).length,
    color: statusColor[status]
  }));

  return (
    <>
      <PageHeader
        eyebrow="Theme Governance"
        title="主题管理"
        description="主题页不是单纯展示配色，而是公开页面交付与安全隔离的一部分。这里同时承担上传、预览、启用、回滚和风险约束职责。"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.info("已打开公开页主题预览", {
                description: `${filteredThemes[0]?.name ?? "暂无主题"} · mock preview`
              })
            }
          >
            <PaletteIcon data-icon="inline-start" aria-hidden />
            预览主题
          </Button>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-4">
          <ThemeUploadPanel />
          <ThemeLibraryPanel
            themes={filteredThemes}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onReset={() => setStatusFilter("all")}
          />
        </div>
        <ThemePackageRules />
      </div>

      <ThemeLifecyclePanel statusSegments={statusSegments} uploadTrend={uploadTrend} />

      <ThemeGovernancePanel packageLimitBars={packageLimitBars} configTypeBars={configTypeBars} />
    </>
  );
}
