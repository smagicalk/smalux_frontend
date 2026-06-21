import { UserRoundIcon } from "lucide-react";

import { accountStatusMeta } from "@/features/accounts/model/account-display";
import type { AccountUser } from "@/features/accounts/model/mock-accounts";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, InteractiveCardButton } from "@/shared/ui/card";

type AccountUsersPanelProps = {
  users: readonly AccountUser[];
  onInspect: (user: AccountUser) => void;
};

export function AccountUsersPanel({ users, onInspect }: AccountUsersPanelProps) {
  return (
    <Card tone="strong">
      <CardHeader>
        <CardTitle>用户列表</CardTitle>
        <CardDescription>这里应该一眼看出谁拥有什么角色、状态、认证能力和资源范围，而不是只看到邮箱列表。</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {users.length > 0 ? (
          users.map((user) => (
            <InteractiveCardButton
              key={user.id}
              tone="muted"
              padding="md"
              className="grid gap-3 text-left lg:grid-cols-[minmax(0,1.2fr)_140px_120px_180px_180px]"
              onClick={() => onInspect(user)}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <UserRoundIcon className="size-4 text-muted-foreground" aria-hidden />
                  <p className="truncate font-semibold tracking-[-0.02em]">{user.name}</p>
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">{user.email}</p>
              </div>
              <Badge variant="outline">{user.role}</Badge>
              <Badge variant={accountStatusMeta[user.status].variant}>
                {accountStatusMeta[user.status].label}
              </Badge>
              <p className="text-sm text-muted-foreground">
                MFA {user.mfa ? "已启用" : "未启用"} · Passkey {user.passkey ? "已绑定" : "未绑定"}
              </p>
              <p className="text-sm text-muted-foreground">{user.scope}</p>
            </InteractiveCardButton>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-border/80 bg-[color:var(--surface-muted)] p-4 text-sm text-muted-foreground">
            当前角色和状态组合没有命中任何用户。
          </div>
        )}
      </CardContent>
    </Card>
  );
}
