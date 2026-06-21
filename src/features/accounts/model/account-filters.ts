import type { AccountStatus, AccountUser } from "@/features/accounts/model/mock-accounts";

export type AccountFilters = {
  roleFilter: AccountUser["role"] | "all";
  statusFilter: AccountStatus | "all";
};

export function filterAccountUsers(users: readonly AccountUser[], filters: AccountFilters) {
  return users.filter((user) => {
    const matchesRole = filters.roleFilter === "all" || user.role === filters.roleFilter;
    const matchesStatus = filters.statusFilter === "all" || user.status === filters.statusFilter;

    return matchesRole && matchesStatus;
  });
}

export function createAccountAccessSummary(users: readonly AccountUser[]) {
  return {
    mfaUsers: users.filter((user) => user.mfa).length,
    passkeyUsers: users.filter((user) => user.passkey).length
  };
}
