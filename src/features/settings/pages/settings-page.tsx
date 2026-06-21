import { ColorPaletteCard } from "@/features/settings/components/color-palette-card";
import { FeatureDesignCard } from "@/features/settings/components/feature-design-card";
import { RuntimeConfigCard } from "@/features/settings/components/runtime-config-card";
import { SecurityDesignCard } from "@/features/settings/components/security-design-card";
import { SettingLimitsCard } from "@/features/settings/components/setting-limits-card";
import { SettingsSecurityInsights } from "@/features/settings/components/settings-security-insights";
import { ThemeModeCard } from "@/features/settings/components/theme-mode-card";
import { PageHeader } from "@/shared/ui/page-header";

export function SettingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Governance Surface"
        title="系统设置"
        description="把运行时配置、主题模式、限制项和治理边界组织成系统控制中心，而不是继续展示组件目录。"
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <RuntimeConfigCard />
        <ThemeModeCard />
      </div>
      <SettingsSecurityInsights />
      <SettingLimitsCard />
      <FeatureDesignCard />
      <SecurityDesignCard />
      <ColorPaletteCard />
    </>
  );
}
