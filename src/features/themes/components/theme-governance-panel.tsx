import { ThemeGovernanceCharts } from "@/features/themes/components/theme-governance-charts";
import { ThemeUploadSettingsCard } from "@/features/themes/components/theme-upload-settings-card";

type ChartDatum = {
  label: string;
  value: number;
};

type ThemeGovernancePanelProps = {
  packageLimitBars: readonly ChartDatum[];
  configTypeBars: readonly ChartDatum[];
};

export function ThemeGovernancePanel({
  packageLimitBars,
  configTypeBars
}: ThemeGovernancePanelProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <ThemeUploadSettingsCard />
      <ThemeGovernanceCharts packageLimitBars={packageLimitBars} configTypeBars={configTypeBars} />
    </div>
  );
}
