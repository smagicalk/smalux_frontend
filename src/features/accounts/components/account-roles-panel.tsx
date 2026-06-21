import type { RolePolicy } from "@/features/accounts/model/mock-accounts";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, InteractiveCardButton } from "@/shared/ui/card";

type AccountRolesPanelProps = {
  roles: readonly RolePolicy[];
  onInspect: (role: RolePolicy) => void;
};

export function AccountRolesPanel({ roles, onInspect }: AccountRolesPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>角色权限</CardTitle>
        <CardDescription>角色不是文档注释，它必须决定谁能执行高风险操作、看哪些日志、改哪些设置。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {roles.map((role) => (
          <InteractiveCardButton
            key={role.role}
            tone="muted"
            padding="md"
            className="text-left"
            onClick={() => onInspect(role)}
          >
            <p className="font-semibold tracking-[-0.02em]">{role.role}</p>
            <p className="mt-1 text-sm text-muted-foreground">{role.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {role.permissions.map((permission) => (
                <Badge key={permission} variant="secondary">
                  {permission}
                </Badge>
              ))}
            </div>
          </InteractiveCardButton>
        ))}
      </CardContent>
    </Card>
  );
}
