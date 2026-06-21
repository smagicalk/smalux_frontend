import { SaveIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { SettingLimitsFilterBar } from "@/features/settings/components/setting-limits-filter-bar";
import { SettingLimitsGrid } from "@/features/settings/components/setting-limits-grid";
import { SettingLimitsSummary } from "@/features/settings/components/setting-limits-summary";
import {
  countSettingLimitRows,
  filterSettingLimitGroups
} from "@/features/settings/model/setting-limit-filters";
import {
  findSettingLimitByKey,
  getInitialSettingLimitKey,
  settingLimitGroups
} from "@/features/settings/model/setting-limits";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/shared/ui/card";

export function SettingLimitsCard() {
  const [query, setQuery] = useState("");
  const [selectedGroupTitle, setSelectedGroupTitle] = useState("all");
  const [selectedRowKey, setSelectedRowKey] = useState(getInitialSettingLimitKey());
  const filteredGroups = useMemo(
    () => filterSettingLimitGroups(settingLimitGroups, { query, selectedGroupTitle }),
    [query, selectedGroupTitle]
  );
  const visibleRowsCount = countSettingLimitRows(filteredGroups);
  const selectedRow = findSettingLimitByKey(selectedRowKey);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>限制项与边界</CardTitle>
            <CardDescription>把真正需要显式参数化的高风险能力收进同一层，避免设置页沦为设计说明墙。</CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() =>
              toast.success("限制项草稿已保存", {
                description: `${selectedRow?.group ?? "未选择"} · ${selectedRow?.key ?? "无参数"} = ${selectedRow?.value ?? "-"}`
              })
            }
          >
            <SaveIcon data-icon="inline-start" aria-hidden />
            保存草稿
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <SettingLimitsFilterBar
          query={query}
          selectedGroupTitle={selectedGroupTitle}
          selectedRowKey={selectedRowKey}
          groups={settingLimitGroups}
          onQueryChange={setQuery}
          onSelectedGroupChange={setSelectedGroupTitle}
          onSelectedRowChange={setSelectedRowKey}
          onReset={() => {
            setQuery("");
            setSelectedGroupTitle("all");
            setSelectedRowKey(getInitialSettingLimitKey());
          }}
        />

        <SettingLimitsSummary visibleRowsCount={visibleRowsCount} selectedRow={selectedRow} />
        <SettingLimitsGrid groups={filteredGroups} onSelectRow={setSelectedRowKey} />
      </CardContent>
    </Card>
  );
}
