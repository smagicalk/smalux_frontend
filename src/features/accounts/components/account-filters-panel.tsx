import type { AccountStatus, AccountUser } from "@/features/accounts/model/mock-accounts";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Field, Select } from "@/shared/ui/form-controls";

type AccountFiltersPanelProps = {
  roleFilter: AccountUser["role"] | "all";
  statusFilter: AccountStatus | "all";
  onRoleFilterChange: (value: AccountUser["role"] | "all") => void;
  onStatusFilterChange: (value: AccountStatus | "all") => void;
  onReset: () => void;
};

export function AccountFiltersPanel({
  roleFilter,
  statusFilter,
  onRoleFilterChange,
  onStatusFilterChange,
  onReset
}: AccountFiltersPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>账户筛选</CardTitle>
        <CardDescription>按角色和状态调试权限边界，用户列表和安全摘要会同步更新。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-[220px_220px_auto]">
        <Field label="角色">
          <Select
            value={roleFilter}
            onChange={(event) => onRoleFilterChange(event.target.value as AccountUser["role"] | "all")}
          >
            <option value="all">全部角色</option>
            <option value="Owner">Owner</option>
            <option value="Admin">Admin</option>
            <option value="Operator">Operator</option>
            <option value="Viewer">Viewer</option>
          </Select>
        </Field>
        <Field label="状态">
          <Select
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value as AccountStatus | "all")}
          >
            <option value="all">全部状态</option>
            <option value="active">正常</option>
            <option value="locked">锁定</option>
            <option value="invited">已邀请</option>
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
