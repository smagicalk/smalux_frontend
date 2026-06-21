import type { BadgeVariant } from "@/shared/ui/badge";

import type { AccountStatus } from "@/features/accounts/model/mock-accounts";

export const accountStatusMeta: Record<AccountStatus, { label: string; variant: BadgeVariant }> = {
  active: { label: "正常", variant: "success" },
  locked: { label: "锁定", variant: "danger" },
  invited: { label: "已邀请", variant: "secondary" }
};
