import type { SelectedSettingLimit } from "@/features/settings/model/setting-limits";
import { Badge } from "@/shared/ui/badge";

type SettingLimitsSummaryProps = {
  visibleRowsCount: number;
  selectedRow?: SelectedSettingLimit;
};

export function SettingLimitsSummary({
  visibleRowsCount,
  selectedRow
}: SettingLimitsSummaryProps) {
  return (
    <div className="rounded-[1rem] border border-white/45 bg-[color:var(--surface-muted)] p-3 text-sm dark:border-white/8 dark:bg-white/6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold">当前筛选</span>
        <Badge variant="outline">{visibleRowsCount} 项参数</Badge>
      </div>
      <p className="mt-2 text-muted-foreground">
        {selectedRow
          ? `${selectedRow.group} / ${selectedRow.key} = ${selectedRow.value}`
          : "请选择一个限制项参数"}
      </p>
    </div>
  );
}
