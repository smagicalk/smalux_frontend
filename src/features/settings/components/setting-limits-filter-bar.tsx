import { SearchIcon } from "lucide-react";

import type { SettingLimitGroup } from "@/features/settings/model/setting-limits";
import { Button } from "@/shared/ui/button";
import { Field, Select } from "@/shared/ui/form-controls";

type SettingLimitsFilterBarProps = {
  query: string;
  selectedGroupTitle: string;
  selectedRowKey: string;
  groups: readonly SettingLimitGroup[];
  onQueryChange: (value: string) => void;
  onSelectedGroupChange: (value: string) => void;
  onSelectedRowChange: (value: string) => void;
  onReset: () => void;
};

export function SettingLimitsFilterBar({
  query,
  selectedGroupTitle,
  selectedRowKey,
  groups,
  onQueryChange,
  onSelectedGroupChange,
  onSelectedRowChange,
  onReset
}: SettingLimitsFilterBarProps) {
  return (
    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
      <Field label="搜索参数">
        <div className="flex h-11 items-center gap-2 rounded-xl border border-input bg-white/70 px-3 transition focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15 dark:bg-white/6">
          <SearchIcon className="size-4 text-muted-foreground" aria-hidden />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            placeholder="参数 / 分组 / 值"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>
      </Field>
      <Field label="分组">
        <Select value={selectedGroupTitle} onChange={(event) => onSelectedGroupChange(event.target.value)}>
          <option value="all">全部分组</option>
          {groups.map((group) => (
            <option key={group.title} value={group.title}>
              {group.title}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="当前参数">
        <Select value={selectedRowKey} onChange={(event) => onSelectedRowChange(event.target.value)}>
          {groups.map((group) =>
            group.rows.map(([key]) => (
              <option key={key} value={key}>
                {group.title} / {key}
              </option>
            ))
          )}
        </Select>
      </Field>
      <div className="flex items-end">
        <Button variant="outline" className="w-full md:w-auto" onClick={onReset}>
          重置
        </Button>
      </div>
    </div>
  );
}
