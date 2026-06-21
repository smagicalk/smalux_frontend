import { PaletteIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ThemePackageRules } from "@/features/themes/components/theme-package-rules";
import { ThemeUploadPanel } from "@/features/themes/components/theme-upload-panel";
import { ThemeGovernancePanel } from "@/features/themes/components/theme-governance-panel";
import { ThemeLibraryPanel } from "@/features/themes/components/theme-library-panel";
import { ThemeLifecyclePanel } from "@/features/themes/components/theme-lifecycle-panel";
import { mockPublicThemes, type ThemeStatus } from "@/features/themes/model/mock-themes";
import {
  createThemeConfigTypeBars,
  createThemeStatusSegments,
  filterThemesByStatus,
  packageLimitBars,
  uploadTrend
} from "@/features/themes/model/theme-insights";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";

export function ThemesPage() {
  const [statusFilter, setStatusFilter] = useState<ThemeStatus | "all">("all");

  const filteredThemes = useMemo(
    () => filterThemesByStatus(mockPublicThemes, statusFilter),
    [statusFilter]
  );

  const configTypeBars = useMemo(() => createThemeConfigTypeBars(filteredThemes), [filteredThemes]);
  const statusSegments = useMemo(() => createThemeStatusSegments(filteredThemes), [filteredThemes]);

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
