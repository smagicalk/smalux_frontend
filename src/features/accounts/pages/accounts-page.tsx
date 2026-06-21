import {
  KeyRoundIcon,
  PlusIcon
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AccountCharts } from "@/features/accounts/components/account-charts";
import { AccountFiltersPanel } from "@/features/accounts/components/account-filters-panel";
import { AccountOverviewCards } from "@/features/accounts/components/account-overview-cards";
import { AccountRolesPanel } from "@/features/accounts/components/account-roles-panel";
import { AccountSessionsPanel } from "@/features/accounts/components/account-sessions-panel";
import { AccountUsersPanel } from "@/features/accounts/components/account-users-panel";
import { createAccountAccessSummary, filterAccountUsers } from "@/features/accounts/model/account-filters";
import {
  mockActiveSessions,
  mockRolePolicies,
  mockUsers,
  type AccountUser,
  type AccountStatus
} from "@/features/accounts/model/mock-accounts";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";

export function AccountsPage() {
  const [roleFilter, setRoleFilter] = useState<AccountUser["role"] | "all">("all");
  const [statusFilter, setStatusFilter] = useState<AccountStatus | "all">("all");
  const filteredUsers = useMemo(
    () => filterAccountUsers(mockUsers, { roleFilter, statusFilter }),
    [roleFilter, statusFilter]
  );
  const { mfaUsers, passkeyUsers } = createAccountAccessSummary(filteredUsers);

  return (
    <>
      <PageHeader
        eyebrow="Identity Boundary"
        title="账户"
        description="账户页的重点不是列出用户，而是把角色、会话、MFA、Passkey 和资源范围放进同一个权限边界视图里。"
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.info("邀请记录已筛选", {
                  description: `${mockUsers.filter((user) => user.status === "invited").length} 个邀请待处理。`
                })
              }
            >
              <KeyRoundIcon data-icon="inline-start" aria-hidden />
              邀请记录
            </Button>
            <Button
              size="sm"
              onClick={() =>
                toast.success("已生成邀请链接", {
                  description: "mock invite: role=Viewer, expires=24h"
                })
              }
            >
              <PlusIcon data-icon="inline-start" aria-hidden />
              邀请用户
            </Button>
          </>
        }
      />

      <AccountOverviewCards
        visibleUsers={filteredUsers.length}
        totalUsers={mockUsers.length}
        mfaUsers={mfaUsers}
        passkeyUsers={passkeyUsers}
        activeSessionCount={mockActiveSessions.length}
      />

      <AccountCharts />

      <AccountFiltersPanel
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        onRoleFilterChange={setRoleFilter}
        onStatusFilterChange={setStatusFilter}
        onReset={() => {
          setRoleFilter("all");
          setStatusFilter("all");
        }}
      />

      <AccountUsersPanel
        users={filteredUsers}
        onInspect={(user) =>
          toast.info(user.name, {
            description: `${user.role} · ${user.status} · MFA ${user.mfa ? "on" : "off"}`
          })
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <AccountRolesPanel
          roles={mockRolePolicies}
          onInspect={(role) =>
            toast.info(role.role, {
              description: `${role.description} · ${role.permissions.length} 项权限`
            })
          }
        />

        <AccountSessionsPanel
          sessions={mockActiveSessions}
          onInspect={(session) =>
            toast.info(session.user, {
              description: `${session.device} · ${session.ip}`
            })
          }
        />
      </div>
    </>
  );
}
