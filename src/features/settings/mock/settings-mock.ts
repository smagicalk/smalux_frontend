/**
 * 系统设置与安全中心 Mock 响应引擎 (Settings & Security Mock Engine)
 * 
 * 覆盖：
 * 1. 管理员账户、TOTP 2FA 双因子认证、多端登录会话管理 (Sessions)
 * 2. API Token 访问令牌维护与细粒度 Scopes
 * 3. 存储大盘容量统计、自动备份计划 CRUD 与多端 S3/WebDAV 异地容灾
 * 4. 数据快照归档生命周期、AES-256 解密覆盖还原与按需范围清理
 * 5. 全局系统参数配置、网络与 DNS 连通性诊断、操作审计流水
 */

import type {
  Account,
  Token,
  Setting,
  Log,
  Theme,
  DeploymentTarget,
  AccountListResult,
  TokenListResult,
  SettingListResult,
  LogListResult,
  ThemeListResult,
  DeploymentListResult
} from "@/shared/api/methods";
import {
  mockAccounts as initialAccounts,
  mockTokens as initialTokens,
  mockSettings as initialSettings,
  mockLogs as initialLogs,
  mockThemes as initialThemes,
  mockDeploymentTargets as initialDeployments
} from "@/shared/api/mock/mock-data";

/**
 * 远程存储配置实体（S3 / WebDAV 异地冷备）
 */
export interface RemoteStorageConfig {
  /** 远程存储类型（"s3" 兼容对象存储，"webdav" 兼容网盘/NAS 协议） */
  type: "s3" | "webdav";
  /** S3 兼容服务节点地址（例如 "https://s3.ap-east-1.amazonaws.com" 或 Cloudflare R2） */
  endpoint?: string;
  /** S3 存储桶 Bucket 名称（如 "smalux-disaster-recovery"） */
  bucket?: string;
  /** S3 Access Key ID / 访问密钥 ID */
  accessKey?: string;
  /** S3 Secret Access Key / 私有访问密钥 */
  secretKey?: string;
  /** 存储桶内文件保存前缀/子路径（如 "/weekly-archive/"） */
  prefix?: string;
  /** WebDAV 服务器完整基础 URL（如 "https://dav.mydomain.com/smalux"） */
  serverUrl?: string;
  /** WebDAV 认证用户名 */
  username?: string;
  /** WebDAV 认证密码或应用专属 Token */
  password?: string;
  /** WebDAV 挂载端点下的远程目录路径（如 "/backups"） */
  remotePath?: string;
}

/**
 * 自动定时备份计划实体
 */
export interface AutoBackupPlan {
  /** 计划唯一标识 ID */
  id: string;
  /** 计划展示名称（如 "全站核心每日凌晨快照"） */
  name: string;
  /** 是否启用此定时计划 */
  enabled: boolean;
  /** 调度时间定义类型（"fixed" 固定时间模式 / "cron" 高级表达式模式） */
  timeType: "fixed" | "cron";
  /** 固定时间模式子类型（"daily" 每天 / "interval" 间隔小时 / "weekly" 每周固定几天） */
  fixedMode: "daily" | "interval" | "weekly";
  /** 固定模式的时间值（如每天 "03:00"，或间隔小时 "12"） */
  fixedTime: string;
  /** 对应的标准 5 段式 Cron 表达式（如 "0 3 * * *"） */
  cronExpr: string;
  /** 本地自动滚动保留快照份数（超期自动清理旧快照） */
  retentionCount: number;
  /** 是否推送到远程异地存储（true 为远程 S3/WebDAV，不占本地磁盘） */
  enableRemote: boolean;
  /** 远程异地存储连接配置参数（开启 enableRemote 时必填） */
  remoteConfig?: RemoteStorageConfig;
  /** 备份数据范围（"all" 全量数据 / "configs_only" 仅系统核心配置） */
  scope: "all" | "configs_only";
  /** 是否采用 AES-256 对称密钥加密快照包 */
  encrypt: boolean;
  /** 计划创建时间戳（毫秒） */
  createdAt: number;
}

/**
 * 备份快照文件归档实体
 */
export interface BackupArchive {
  /** 快照唯一标识 ID */
  id: string;
  /** 关联的自动备份计划 ID（手动生成的快照可为空） */
  planId?: string;
  /** 备份快照打包文件名（如 "smalux_backup_20260826_030000.tar.gz"） */
  filename: string;
  /** 文件字节大小（Bytes） */
  sizeBytes: number;
  /** 快照生成时间戳（毫秒） */
  createdAt: number;
  /** 备份触发类型（"manual" 管理员手动触发 / "scheduled" 定时计划自动生成） */
  type: "manual" | "scheduled";
  /** 快照包含的数据范围描述文案 */
  scope: string;
  /** 该快照文件是否已加密保护 */
  isEncrypted: boolean;
  /** 备份任务名称或备注说明 */
  notes: string;
}

/**
 * 各数据模块磁盘容量统计大盘指标
 */
export interface StorageStats {
  /** 系统主数据库（SQLite / PostgreSQL / MySQL 核心表）占用体积（MB） */
  dbSizeMb: number;
  /** 探针时序监控数据（CPU/内存/网络/磁盘历史采样）占用体积（MB） */
  metricsSizeMb: number;
  /** 主页大盘展示模板包与静态资源占用体积（MB） */
  themesSizeMb: number;
  /** 管理员操作审计日志占用体积（MB） */
  auditSizeMb: number;
  /** 历史告警与通知推送记录占用体积（MB） */
  alertsSizeMb: number;
  /** 批量任务执行记录与脚本日志占用体积（MB） */
  tasksSizeMb: number;
}

/**
 * 活跃登录终端与会话信息
 */
export interface SessionInfo {
  /** 会话唯一标识 ID */
  id: string;
  /** 客户端设备与浏览器标识（如 "Chrome 128 / Windows 11"） */
  device: string;
  /** 登录客户端公网/局域网 IP 地址 */
  ip: string;
  /** IP 归属地理位置（如 "本机控制台"、"上海市"、"香港核心机房"） */
  location: string;
  /** 是否为当前浏览器发起的终端会话 */
  isCurrent: boolean;
  /** 最后一次活跃时间展示文案（如 "刚刚"、"2 小时前"） */
  activeTime: string;
}

/**
 * 管理员账户安全大盘概览
 */
export interface SecurityOverview {
  /** 当前管理员是否已绑定 TOTP 双因子动态口令 */
  mfaEnabled: boolean;
  /** 已绑定的 TOTP 验证器设备名称描述 */
  mfaDeviceName?: string;
  /** TOTP 双因子绑定时间（如 "2026-08-20 10:24"） */
  mfaBoundAt?: string;
  /** TOTP 当前的 Base32 密钥字符串 */
  mfaSecret?: string;
  /** 已注册的 Passkey 免密凭据数量 */
  passkeysCount: number;
  /** 当前在线的活跃终端会话数量 */
  activeSessionsCount: number;
  /** 系统综合安全评分（0 ~ 100 分） */
  securityScore: number;
  /** 上次修改登录密码的时间戳（毫秒） */
  passwordLastChangedAt: number;
}

/**
 * 系统设置与安全中心 Mock 状态机引擎实现类
 */
class SettingsMockEngine {
  /** 成员账号集合 */
  private accounts: Account[];
  /** API 令牌集合 */
  private tokens: Token[];
  /** 系统运行配置键值集合 */
  private settings: Setting[];
  /** 操作审计日志流水 */
  private logs: Log[];
  /** 大盘主题包集合 */
  private themes: Theme[];
  /** 部署架构模式列表 */
  private deployments: DeploymentTarget[];

  /** 存储容量大盘指标 */
  private storageStats: StorageStats = {
    dbSizeMb: 38.4,
    metricsSizeMb: 112.6,
    themesSizeMb: 4.8,
    auditSizeMb: 18.2,
    alertsSizeMb: 8.4,
    tasksSizeMb: 14.6
  };

  /** 自动备份计划列表 */
  private backupPlans: AutoBackupPlan[] = [
    {
      id: "plan_daily_main",
      name: "全站核心每日凌晨快照",
      enabled: true,
      timeType: "fixed",
      fixedMode: "daily",
      fixedTime: "03:00",
      cronExpr: "0 3 * * *",
      retentionCount: 14,
      enableRemote: false,
      scope: "all",
      encrypt: true,
      createdAt: Date.now() - 3600 * 1000 * 24 * 10
    },
    {
      id: "plan_weekend_s3",
      name: "周末异地 S3 冷备灾备归档",
      enabled: true,
      timeType: "fixed",
      fixedMode: "weekly",
      fixedTime: "04:30",
      cronExpr: "30 4 * * 0",
      retentionCount: 4,
      enableRemote: true,
      remoteConfig: {
        type: "s3",
        endpoint: "https://s3.ap-east-1.amazonaws.com",
        bucket: "smalux-disaster-recovery",
        prefix: "/weekly-archive/"
      },
      scope: "all",
      encrypt: true,
      createdAt: Date.now() - 3600 * 1000 * 24 * 30
    }
  ];

  /** 历史备份快照列表 */
  private backups: BackupArchive[] = [
    {
      id: "bak_01",
      planId: "plan_daily_main",
      filename: "smalux_backup_20260826_030000.tar.gz",
      sizeBytes: 1024 * 1024 * 14.8,
      createdAt: Date.now() - 3600 * 1000 * 13,
      type: "scheduled",
      scope: "全量数据 (主机/配置/告警/任务/审计)",
      isEncrypted: true,
      notes: "全站核心每日凌晨快照"
    },
    {
      id: "bak_02",
      planId: "plan_daily_main",
      filename: "smalux_backup_20260825_030000.tar.gz",
      sizeBytes: 1024 * 1024 * 14.2,
      createdAt: Date.now() - 3600 * 1000 * 37,
      type: "scheduled",
      scope: "全量数据 (主机/配置/告警/任务/审计)",
      isEncrypted: true,
      notes: "全站核心每日凌晨快照"
    },
    {
      id: "bak_03",
      filename: "smalux_manual_pre_upgrade.tar.gz",
      sizeBytes: 1024 * 1024 * 12.6,
      createdAt: Date.now() - 3600 * 1000 * 24 * 4,
      type: "manual",
      scope: "核心配置与主机节点数据",
      isEncrypted: false,
      notes: "版本升级前手动备份"
    }
  ];

  /** 安全中心概览状态 */
  private securityOverview: SecurityOverview = {
    mfaEnabled: true,
    mfaDeviceName: "Google / Microsoft Authenticator (主设备)",
    mfaBoundAt: "2026-08-20 10:24",
    mfaSecret: "JBSWY3DPEHPK3PXP",
    passkeysCount: 1,
    activeSessionsCount: 3,
    securityScore: 92,
    passwordLastChangedAt: Date.now() - 3600 * 1000 * 24 * 15
  };

  /** 活跃会话列表 */
  private sessions: SessionInfo[] = [
    { id: "s-current", device: "Chrome 128 / Windows 11 (当前终端)", ip: "127.0.0.1 (本地)", location: "本机控制台", isCurrent: true, activeTime: "刚刚" },
    { id: "s-mobile", device: "Safari 17.5 / iPhone 15 Pro", ip: "114.88.204.18", location: "上海市", isCurrent: false, activeTime: "2 小时前" },
    { id: "s-cli", device: "smalux-cli v2.4.0 / Linux x86_64", ip: "43.154.210.88", location: "香港核心机房", isCurrent: false, activeTime: "1 天前" }
  ];

  constructor() {
    this.accounts = [...initialAccounts];
    this.tokens = [...initialTokens];
    this.settings = [...initialSettings];
    this.logs = [...initialLogs];
    this.themes = [...initialThemes];
    this.deployments = [...initialDeployments];
  }

  // ─────────────── 1. 成员账号 API (Accounts) ───────────────

  /** 获取全部操作员账号列表 */
  public getAccounts(): AccountListResult {
    return { accounts: [...this.accounts], total: this.accounts.length };
  }

  /** 创建邀请新操作员成员 */
  public createAccount(params: { username: string; role: Account["role"] }): Account {
    const newAcc: Account = {
      id: `acc-${Date.now()}`,
      username: params.username,
      role: params.role,
      status: "active",
      mfaEnabled: false,
      passkeyEnabled: false,
      sessions: 1,
      lastLoginAt: undefined
    };
    this.accounts = [newAcc, ...this.accounts];
    this.recordAudit("admin", "auth", "account.create", "success", newAcc.username);
    return newAcc;
  }

  /** 邀请新成员（createAccount 别名） */
  public inviteAccount(params: { username: string; role: Account["role"] }): Account {
    return this.createAccount(params);
  }

  /** 更新成员角色权限 */
  public updateAccount(id: string, params: { role?: Account["role"] }): Account {
    const acc = this.accounts.find((a) => a.id === id);
    if (!acc) throw new Error(`用户 ${id} 不存在`);
    if (params.role) acc.role = params.role;
    this.recordAudit("admin", "auth", "account.update", "success", acc.username);
    return acc;
  }

  /** 锁定/解锁指定操作员账号 */
  public lockAccount(id: string, locked: boolean): { ok: boolean } {
    const acc = this.accounts.find((a) => a.id === id);
    if (!acc) throw new Error(`用户 ${id} 不存在`);
    acc.status = locked ? "locked" : "active";
    this.recordAudit("admin", "auth", locked ? "account.lock" : "account.unlock", "success", acc.username);
    return { ok: true };
  }

  /** 删除成员操作员账号 */
  public deleteAccount(id: string): { ok: boolean } {
    const acc = this.accounts.find((a) => a.id === id);
    this.accounts = this.accounts.filter((a) => a.id !== id);
    if (acc) {
      this.recordAudit("admin", "auth", "account.delete", "success", acc.username);
    }
    return { ok: true };
  }

  // ─────────────── 2. 安全中心与会话管理 API (Security & Sessions) ───────────────

  /** 获取安全大盘概览指标与 MFA 状态 */
  public getSecurityOverview(): SecurityOverview {
    return {
      ...this.securityOverview,
      activeSessionsCount: this.sessions.length
    };
  }

  /** 生成 TOTP 双因子动态密钥与二维码链接 */
  public setupTotp(): { secret: string; otpauthUrl: string } {
    const secret = "JBSWY3DPEHPK3PXP";
    const otpauthUrl = `otpauth://totp/Smalux:admin?secret=${secret}&issuer=Smalux&algorithm=SHA1&digits=6&period=30`;
    return { secret, otpauthUrl };
  }

  /** 校验 6 位动态口令并激活 TOTP 双因子保护 */
  public verifyTotp(code: string): { ok: boolean } {
    if (!code || code.trim().length !== 6) {
      throw new Error("请输入 Authenticator 上的 6 位数字动态验证码");
    }
    this.securityOverview.mfaEnabled = true;
    this.securityOverview.mfaBoundAt = new Date().toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
    this.securityOverview.securityScore = Math.min(100, this.securityOverview.securityScore + 15);
    this.recordAudit("admin", "auth", "mfa.enable", "success", "TOTP Authenticator");
    return { ok: true };
  }

  /** 验证管理员密码后关闭并解绑 TOTP */
  public disableTotp(verifyPassword?: string): { ok: boolean } {
    if (!verifyPassword) {
      throw new Error("关闭 TOTP 必须输入当前管理员密码进行身份确认");
    }
    this.securityOverview.mfaEnabled = false;
    this.securityOverview.mfaBoundAt = undefined;
    this.securityOverview.securityScore = Math.max(60, this.securityOverview.securityScore - 15);
    this.recordAudit("admin", "auth", "mfa.disable", "success", "TOTP Authenticator");
    return { ok: true };
  }

  /** 修改管理员登录密码（开启 TOTP 时强制校验动态验证码） */
  public changePassword(params: { oldPassword: string; newPassword: string; mfaCode?: string }): { ok: boolean } {
    if (!params.oldPassword) throw new Error("请输入当前旧密码");
    if (params.newPassword.length < 8) throw new Error("新密码长度不能少于 8 位");
    if (this.securityOverview.mfaEnabled && (!params.mfaCode || params.mfaCode.length !== 6)) {
      throw new Error("当前已启用 TOTP 双因子保护，必须输入 6 位动态验证码");
    }
    this.securityOverview.passwordLastChangedAt = Date.now();
    this.recordAudit("admin", "auth", "password.change", "success", "admin");
    return { ok: true };
  }

  /** 获取活跃登录终端与会话列表 */
  public getSessions(): { sessions: SessionInfo[] } {
    return { sessions: [...this.sessions] };
  }

  /** 强制注销指定终端会话 */
  public terminateSession(sessionId: string): { ok: boolean } {
    const target = this.sessions.find((s) => s.id === sessionId);
    this.sessions = this.sessions.filter((s) => s.id !== sessionId);
    if (target) {
      this.recordAudit("admin", "auth", "session.terminate", "success", target.device, target.ip);
    }
    return { ok: true };
  }

  /** 强制注销除当前终端外的全部外部会话 */
  public logoutOtherSessions(): { ok: boolean; terminatedCount: number } {
    const count = this.sessions.filter((s) => !s.isCurrent).length;
    this.sessions = this.sessions.filter((s) => s.isCurrent);
    this.recordAudit("admin", "auth", "session.terminate_others", "success", "All other devices", `强制注销了 ${count} 个终端`);
    return { ok: true, terminatedCount: count };
  }

  // ─────────────── 3. API Token 凭证 API ───────────────

  /** 获取所有 API Token */
  public getTokens(): TokenListResult {
    return { tokens: [...this.tokens] };
  }

  /** 签发新的 API Token */
  public createToken(params: { name: string; scopes: string[]; expiresAt?: number }): Token {
    const newToken: Token = {
      id: `tok-${Date.now()}`,
      name: params.name,
      scopes: params.scopes,
      createdAt: Date.now(),
      createdBy: "admin",
      revoked: false,
      expiresAt: params.expiresAt
    };
    this.tokens = [newToken, ...this.tokens];
    this.recordAudit("admin", "token", "token.create", "success", newToken.name);
    return newToken;
  }

  /** 吊销指定的 API Token */
  public revokeToken(id: string): { ok: boolean } {
    const tok = this.tokens.find((t) => t.id === id);
    this.tokens = this.tokens.filter((t) => t.id !== id);
    if (tok) {
      this.recordAudit("admin", "token", "token.revoke", "success", tok.name);
    }
    return { ok: true };
  }

  /** 删除指定的 API Token（revokeToken 别名） */
  public deleteToken(id: string): { ok: boolean } {
    return this.revokeToken(id);
  }

  // ─────────────── 4. 存储、自动备份与容灾 API (Storage & Backups) ───────────────

  /** 获取存储分布容量统计指标 */
  public getStorageStats(): StorageStats {
    return { ...this.storageStats };
  }

  /** 获取自动备份计划列表 */
  public getBackupPlans(): { plans: AutoBackupPlan[] } {
    return { plans: [...this.backupPlans] };
  }

  /** 创建新自动备份计划 */
  public createBackupPlan(plan: Omit<AutoBackupPlan, "id" | "createdAt">): AutoBackupPlan {
    const newPlan: AutoBackupPlan = {
      ...plan,
      id: `plan_${Date.now()}`,
      createdAt: Date.now()
    };
    this.backupPlans = [newPlan, ...this.backupPlans];
    this.recordAudit("admin", "config", "backup_plan.create", "success", newPlan.name);
    return newPlan;
  }

  /** 更新已有备份计划 */
  public updateBackupPlan(id: string, plan: Partial<AutoBackupPlan>): AutoBackupPlan {
    const idx = this.backupPlans.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`未找到 ID 为 ${id} 的备份计划`);
    const updated = { ...this.backupPlans[idx], ...plan };
    this.backupPlans[idx] = updated;
    this.recordAudit("admin", "config", "backup_plan.update", "success", updated.name);
    return updated;
  }

  /** 启停备份计划 */
  public toggleBackupPlan(id: string, enabled: boolean): { ok: boolean } {
    const plan = this.backupPlans.find((p) => p.id === id);
    if (plan) {
      plan.enabled = enabled;
      this.recordAudit("admin", "config", enabled ? "backup_plan.enable" : "backup_plan.disable", "success", plan.name);
    }
    return { ok: true };
  }

  /** 删除备份计划 */
  public deleteBackupPlan(id: string): { ok: boolean } {
    const plan = this.backupPlans.find((p) => p.id === id);
    this.backupPlans = this.backupPlans.filter((p) => p.id !== id);
    if (plan) {
      this.recordAudit("admin", "config", "backup_plan.delete", "success", plan.name);
    }
    return { ok: true };
  }

  /** 立即执行一次备份计划 */
  public runBackupPlan(id: string): { ok: boolean; backup?: BackupArchive; message: string } {
    const plan = this.backupPlans.find((p) => p.id === id);
    if (!plan) throw new Error(`未找到 ID 为 ${id} 的备份计划`);

    const now = Date.now();
    const dateStr = new Date(now).toISOString().slice(0, 10).replace(/-/g, "");
    const newBackup: BackupArchive = {
      id: `bak_plan_${now}`,
      planId: plan.id,
      filename: `smalux_plan_${dateStr}_${Math.floor(Math.random() * 8999 + 1000)}.tar.gz`,
      sizeBytes: 1024 * 1024 * (plan.scope === "all" ? 15.6 : 3.6),
      createdAt: now,
      type: "scheduled",
      scope: plan.scope === "all" ? "全量数据 (主机/配置/告警/任务/审计)" : "仅系统核心配置",
      isEncrypted: plan.encrypt,
      notes: plan.name
    };

    if (!plan.enableRemote) {
      this.backups = [newBackup, ...this.backups];
    }
    this.recordAudit("admin", "config", "backup_plan.run", "success", plan.name, `生成快照: ${newBackup.filename}`);

    return {
      ok: true,
      backup: newBackup,
      message: plan.enableRemote
        ? `计划「${plan.name}」已成功执行并推送到远程 ${plan.remoteConfig?.type?.toUpperCase() || "S3"} 存储！`
        : `计划「${plan.name}」执行完成！新快照已归档至本地。`
    };
  }

  /** 获取备份快照列表 */
  public getBackups(): { backups: BackupArchive[] } {
    return { backups: [...this.backups] };
  }

  /** 手动创建即时快照 */
  public createBackup(params: { scope: "all" | "configs_only"; encrypt: boolean; notes?: string }): BackupArchive {
    const now = Date.now();
    const dateStr = new Date(now).toISOString().slice(0, 10).replace(/-/g, "");
    const newBackup: BackupArchive = {
      id: `bak_${now}`,
      filename: `smalux_manual_${dateStr}_${Math.floor(Math.random() * 8999 + 1000)}.tar.gz`,
      sizeBytes: 1024 * 1024 * (params.scope === "all" ? 15.2 : 3.4),
      createdAt: now,
      type: "manual",
      scope: params.scope === "all" ? "全量数据 (主机/配置/告警/任务/审计)" : "仅系统核心配置与资产",
      isEncrypted: params.encrypt,
      notes: params.notes?.trim() || "管理员手动快照"
    };
    this.backups = [newBackup, ...this.backups];
    this.recordAudit("admin", "config", "backup.create", "success", newBackup.filename);
    return newBackup;
  }

  /** 触发快照覆盖还原 */
  public restoreBackup(id: string, verifyKey?: string): { ok: boolean } {
    const bak = this.backups.find((b) => b.id === id);
    if (!bak) throw new Error(`未找到 ID 为 ${id} 的备份文件`);
    this.recordAudit("admin", "config", "backup.restore", "success", bak.filename, "全量系统覆盖还原");
    return { ok: true };
  }

  /** 删除单项快照归档 */
  public deleteBackup(id: string): { ok: boolean } {
    const bak = this.backups.find((b) => b.id === id);
    this.backups = this.backups.filter((b) => b.id !== id);
    if (bak) {
      this.recordAudit("admin", "config", "backup.delete", "success", bak.filename);
    }
    return { ok: true };
  }

  /** 规则批量清理历史快照 */
  public pruneBackups(rule: "older_7d" | "older_30d" | "only_scheduled" | "all"): { ok: boolean; removedCount: number } {
    const now = Date.now();
    const initialCount = this.backups.length;
    if (rule === "all") {
      this.backups = [];
    } else if (rule === "older_7d") {
      const threshold = now - 7 * 24 * 3600 * 1000;
      this.backups = this.backups.filter((b) => b.createdAt >= threshold);
    } else if (rule === "older_30d") {
      const threshold = now - 30 * 24 * 3600 * 1000;
      this.backups = this.backups.filter((b) => b.createdAt >= threshold);
    } else if (rule === "only_scheduled") {
      this.backups = this.backups.filter((b) => b.type !== "scheduled");
    }
    const removedCount = initialCount - this.backups.length;
    this.recordAudit("admin", "config", "backup.prune", "success", `规则: ${rule}`, `清理了 ${removedCount} 份快照`);
    return { ok: true, removedCount };
  }

  /** 按范围清理各类业务数据释放磁盘 */
  public cleanData(type: "metrics" | "audit" | "alerts" | "tasks", rule?: string): { ok: boolean; freedMb: number } {
    let freedMb = 0;
    if (type === "metrics") {
      freedMb = 68.4;
      this.storageStats.metricsSizeMb = Math.max(12.0, this.storageStats.metricsSizeMb - freedMb);
      this.recordAudit("admin", "config", "data_clean.metrics", "success", `时序指标 (${rule || "30"}天)`);
    } else if (type === "audit") {
      freedMb = 12.0;
      this.storageStats.auditSizeMb = Math.max(2.1, this.storageStats.auditSizeMb - freedMb);
      this.recordAudit("admin", "config", "data_clean.audit", "success", "操作审计日志");
    } else if (type === "alerts") {
      freedMb = 5.8;
      this.storageStats.alertsSizeMb = Math.max(1.5, this.storageStats.alertsSizeMb - freedMb);
      this.recordAudit("admin", "config", "data_clean.alerts", "success", "告警与通知推送记录");
    } else if (type === "tasks") {
      freedMb = 10.2;
      this.storageStats.tasksSizeMb = Math.max(2.0, this.storageStats.tasksSizeMb - freedMb);
      this.recordAudit("admin", "config", "data_clean.tasks", "success", "任务执行记录与日志");
    }
    return { ok: true, freedMb };
  }

  /** 测试远程 S3 / WebDAV 连通性 */
  public testRemoteStorage(config: RemoteStorageConfig): { ok: boolean; latencyMs: number; message: string } {
    if (config.type === "s3") {
      if (!config.bucket) throw new Error("请填写 S3 存储桶 Bucket 名称");
      return { ok: true, latencyMs: 86, message: "S3 存储桶联通成功，读写鉴权验证通过！" };
    }
    if (!config.serverUrl) throw new Error("请填写 WebDAV 服务器地址");
    return { ok: true, latencyMs: 64, message: "WebDAV 远程目录挂载成功，已验证读写权限！" };
  }

  // ─────────────── 5. 系统全局配置 API (System Configs) ───────────────

  /** 获取系统全局配置参数字典 */
  public getSettings(): SettingListResult {
    return { settings: [...this.settings] };
  }

  /** 批量保存系统配置参数 */
  public saveSettings(changes: { key: string; value: string }[]): { ok: boolean; count: number } {
    for (const change of changes) {
      const existing = this.settings.find((s) => s.key === change.key);
      if (existing) {
        existing.value = change.value;
      } else {
        this.settings.push({
          key: change.key,
          label: change.key,
          value: change.value,
          group: "general",
          editable: true
        });
      }
    }
    this.recordAudit("admin", "config", "config.update", "success", "System Settings", `修改了 ${changes.length} 项参数`);
    return { ok: true, count: changes.length };
  }

  /** 诊断网络连通性与 DNS 延时 */
  public diagnoseNetwork(): { ok: boolean; dnsLatency: number; gatewayLatency: number; probeMeshLatency: number } {
    return {
      ok: true,
      dnsLatency: 4.2,
      gatewayLatency: 1.1,
      probeMeshLatency: 18.5
    };
  }

  // ─────────────── 6. 操作审计流水 API (Audit Logs) ───────────────

  /** 查询系统操作审计流水 */
  public getLogs(filters: { search?: string; module?: string; result?: "success" | "failure" } = {}): LogListResult {
    let result = [...this.logs];
    if (filters.result) {
      result = result.filter((l) => l.result === filters.result);
    }
    if (filters.module && filters.module !== "all") {
      result = result.filter((l) => l.module === filters.module);
    }
    if (filters.search?.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (l) =>
          l.actor.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          (l.detail || "").toLowerCase().includes(q) ||
          (l.target || "").toLowerCase().includes(q) ||
          (l.ip || "").toLowerCase().includes(q)
      );
    }
    return {
      logs: result,
      total: result.length
    };
  }

  /** 内部方法：写入一条审计日志 */
  private recordAudit(
    actor: string,
    module: Log["module"],
    action: string,
    result: "success" | "failure",
    target?: string,
    detail?: string
  ) {
    const newLog: Log = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ts: Date.now(),
      actor,
      module,
      action,
      result,
      target,
      detail,
      ip: "127.0.0.1 (Local Web Session)"
    };
    this.logs = [newLog, ...this.logs];
  }

  // ─────────────── 7. 主题与部署模式 (Themes & Deployments) ───────────────

  /** 获取可用大盘主题包列表 */
  public getThemes(): ThemeListResult {
    return { themes: [...this.themes] };
  }

  /** 获取交付部署架构模式列表 */
  public getDeployments(): DeploymentListResult {
    return { targets: [...this.deployments], current: "static" };
  }
}

/** 系统设置与安全中心全局单例 Mock 引擎实例 */
export const settingsMockEngine = new SettingsMockEngine();
