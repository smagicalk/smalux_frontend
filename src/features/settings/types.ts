export type UserRole = "admin" | "operator" | "viewer" | "auditor";
export type UserStatus = "active" | "invited" | "locked";

export interface SystemConfigItem {
  key: string;
  label: string;
  value: string;
  group: "general" | "security" | "limits" | "network";
  editable: boolean;
  description?: string;
}

export interface AccountUserItem {
  id: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  mfaEnabled: boolean;
  passkeyEnabled: boolean;
  lastLoginAt?: number;
  sessions: number;
}

export interface ApiTokenItem {
  id: string;
  name: string;
  scopes: string[];
  createdAt: number;
  expiresAt?: number;
  lastUsedAt?: number;
  createdBy: string;
  revoked: boolean;
}

export interface ThemeItem {
  id: string;
  name: string;
  status: "published" | "draft" | "archived";
  publicVisible: boolean;
  version: string;
  updatedAt: number;
  author: string;
  description?: string;
}

export interface DeploymentTargetItem {
  id: string;
  mode: "static" | "nginx" | "rust-embed";
  name: string;
  status: "ready" | "building" | "failed";
  updatedAt: number;
  complexity: "low" | "medium" | "high";
}
