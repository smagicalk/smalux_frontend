import { describe, expect, it } from "vitest";

import { createAccountAccessSummary, filterAccountUsers } from "@/features/accounts/model/account-filters";
import type { AccountUser } from "@/features/accounts/model/mock-accounts";

const users: AccountUser[] = [
  {
    id: "user-1",
    name: "Owner",
    email: "owner@example.com",
    role: "Owner",
    status: "active",
    mfa: true,
    passkey: true,
    scope: "all",
    lastLoginAt: "2026-06-09T00:00:00.000Z"
  },
  {
    id: "user-2",
    name: "Operator",
    email: "operator@example.com",
    role: "Operator",
    status: "locked",
    mfa: true,
    passkey: false,
    scope: "edge",
    lastLoginAt: "2026-06-09T00:00:00.000Z"
  },
  {
    id: "user-3",
    name: "Viewer",
    email: "viewer@example.com",
    role: "Viewer",
    status: "invited",
    mfa: false,
    passkey: false,
    scope: "read-only",
    lastLoginAt: "尚未登录"
  }
];

describe("account filters", () => {
  it("filters users by role and status", () => {
    const result = filterAccountUsers(users, {
      roleFilter: "Operator",
      statusFilter: "locked"
    });

    expect(result.map((user) => user.id)).toEqual(["user-2"]);
  });

  it("summarizes MFA and passkey coverage for visible users", () => {
    expect(createAccountAccessSummary(users)).toEqual({
      mfaUsers: 2,
      passkeyUsers: 1
    });
  });
});
