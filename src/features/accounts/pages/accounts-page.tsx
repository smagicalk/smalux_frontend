import {
  KeyRoundIcon,
  LockKeyholeIcon,
  PlusIcon,
  ShieldCheckIcon,
  UserRoundIcon,
  UsersIcon
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AccountCharts } from "@/features/accounts/components/account-charts";
import {
  mockActiveSessions,
  mockRolePolicies,
  mockUsers,
  type AccountUser,
  type AccountStatus
} from "@/features/accounts/model/mock-accounts";
import { Badge, type BadgeVariant } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/shared/ui/card";
import { InteractiveCardButton } from "@/shared/ui/card";
import { Field, Select } from "@/shared/ui/form-controls";
import { MetricPill } from "@/shared/ui/metric-pill";
import { PageHeader } from "@/shared/ui/page-header";
import { StatCard } from "@/shared/ui/stat-card";

const statusMeta: Record<AccountStatus, { label: string; variant: BadgeVariant }> = {
  active: { label: "正常", variant: "success" },
  locked: { label: "锁定", variant: "danger" },
  invited: { label: "已邀请", variant: "secondary" }
};

export function AccountsPage() {
  const [roleFilter, setRoleFilter] = useState<AccountUser["role"] | "all">("all");
  const [statusFilter, setStatusFilter] = useState<AccountStatus | "all">("all");
  const filteredUsers = useMemo(
    () =>
      mockUsers.filter((user) => {
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        const matchesStatus = statusFilter === "all" || user.status === statusFilter;

        return matchesRole && matchesStatus;
      }),
    [roleFilter, statusFilter]
  );
  const mfaUsers = filteredUsers.filter((user) => user.mfa).length;
  const passkeyUsers = filteredUsers.filter((user) => user.passkey).length;

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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="用户"
          value={`${filteredUsers.length}/${mockUsers.length}`}
          description="Owner、Admin、Operator、Viewer 不是展示标签，而是权限边界。"
          icon={UsersIcon}
          tone="primary"
        />
        <StatCard
          label="MFA 启用"
          value={`${mfaUsers}/${filteredUsers.length || 1}`}
          description="管理员身份必须有第二因子，否则后台安全边界是空的。"
          icon={LockKeyholeIcon}
          tone="success"
        />
        <StatCard
          label="Passkey"
          value={`${passkeyUsers}`}
          description="更高安全等级的登录方式需要和角色控制一起看。"
          icon={KeyRoundIcon}
          tone="info"
        />
        <StatCard
          label="活跃会话"
          value={`${mockActiveSessions.length}`}
          description="会话是实际攻击面，吊销能力比用户总数更重要。"
          icon={ShieldCheckIcon}
          tone="warning"
        />
      </div>

      <AccountCharts />

      <Card>
        <CardHeader>
          <CardTitle>账户筛选</CardTitle>
          <CardDescription>按角色和状态调试权限边界，用户列表和安全摘要会同步更新。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[220px_220px_auto]">
          <Field label="角色">
            <Select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as AccountUser["role"] | "all")}
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
              onChange={(event) => setStatusFilter(event.target.value as AccountStatus | "all")}
            >
              <option value="all">全部状态</option>
              <option value="active">正常</option>
              <option value="locked">锁定</option>
              <option value="invited">已邀请</option>
            </Select>
          </Field>
          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full md:w-auto"
              onClick={() => {
                setRoleFilter("all");
                setStatusFilter("all");
              }}
            >
              重置
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card tone="strong">
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
          <CardDescription>这里应该一眼看出谁拥有什么角色、状态、认证能力和资源范围，而不是只看到邮箱列表。</CardDescription>
        </CardHeader>
          <CardContent className="flex flex-col gap-3">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <InteractiveCardButton
                key={user.id}
                tone="muted"
                padding="md"
                className="grid gap-3 text-left lg:grid-cols-[minmax(0,1.2fr)_140px_120px_180px_180px]"
                onClick={() =>
                  toast.info(user.name, {
                    description: `${user.role} · ${user.status} · MFA ${user.mfa ? "on" : "off"}`
                  })
                }
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <UserRoundIcon className="size-4 text-muted-foreground" aria-hidden />
                    <p className="truncate font-semibold tracking-[-0.02em]">{user.name}</p>
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Badge variant="outline">{user.role}</Badge>
                <Badge variant={statusMeta[user.status].variant}>{statusMeta[user.status].label}</Badge>
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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <CardTitle>角色权限</CardTitle>
            <CardDescription>角色不是文档注释，它必须决定谁能执行高风险操作、看哪些日志、改哪些设置。</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {mockRolePolicies.map((role) => (
              <InteractiveCardButton
                key={role.role}
                tone="muted"
                padding="md"
                className="text-left"
                onClick={() =>
                  toast.info(role.role, {
                    description: `${role.description} · ${role.permissions.length} 项权限`
                  })
                }
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

        <Card tone="strong">
          <CardHeader>
            <CardTitle>会话</CardTitle>
            <CardDescription>会话视图应该帮助管理员快速判断谁在线、从什么设备接入、是否需要立刻吊销。</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {mockActiveSessions.map((session) => (
              <InteractiveCardButton
                key={session.id}
                tone="muted"
                padding="md"
                className="text-left"
                onClick={() =>
                  toast.info(session.user, {
                    description: `${session.device} · ${session.ip}`
                  })
                }
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={session.current ? "success" : "secondary"}>
                    {session.current ? "当前会话" : "活跃"}
                  </Badge>
                  <span className="font-semibold tracking-[-0.02em]">{session.user}</span>
                </div>
                <div className="mt-3 grid gap-2">
                  <MetricPill label="设备" value={session.device} />
                  <MetricPill label="IP" value={session.ip} />
                </div>
              </InteractiveCardButton>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
