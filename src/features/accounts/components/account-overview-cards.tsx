import {
  KeyRoundIcon,
  LockKeyholeIcon,
  ShieldCheckIcon,
  UsersIcon
} from "lucide-react";

import { StatCard } from "@/shared/ui/stat-card";

type AccountOverviewCardsProps = {
  visibleUsers: number;
  totalUsers: number;
  mfaUsers: number;
  passkeyUsers: number;
  activeSessionCount: number;
};

export function AccountOverviewCards({
  visibleUsers,
  totalUsers,
  mfaUsers,
  passkeyUsers,
  activeSessionCount
}: AccountOverviewCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="用户"
        value={`${visibleUsers}/${totalUsers}`}
        description="Owner、Admin、Operator、Viewer 不是展示标签，而是权限边界。"
        icon={UsersIcon}
        tone="primary"
      />
      <StatCard
        label="MFA 启用"
        value={`${mfaUsers}/${visibleUsers || 1}`}
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
        value={`${activeSessionCount}`}
        description="会话是实际攻击面，吊销能力比用户总数更重要。"
        icon={ShieldCheckIcon}
        tone="warning"
      />
    </div>
  );
}
