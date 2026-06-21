import type { ThemeStatus } from "@/features/themes/model/mock-themes";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Field, Select } from "@/shared/ui/form-controls";

type ThemeLibraryFiltersProps = {
  statusFilter: ThemeStatus | "all";
  onStatusFilterChange: (value: ThemeStatus | "all") => void;
  onReset: () => void;
};

export function ThemeLibraryFilters({
  statusFilter,
  onStatusFilterChange,
  onReset
}: ThemeLibraryFiltersProps) {
  return (
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
  );
}
