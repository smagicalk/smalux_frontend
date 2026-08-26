# Smalux API 契约与通信协议规范 (API Contracts & Protocol Spec)

本文档定义了 `smalux` 控制台与后端服务通信的统一事实标准（Single Source of Truth）。

---

## 1. 协议分工与架构总览 (Dual-Protocol Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                       Smalux 前端应用                        │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
        (80% 业务操作)                  (20% 高频实时)
               ▼                              ▼
  RESTful HTTP (JSON API)          WebSocket (JSON-RPC 2.0)
  • 运维脚本库维护                  • agent.summary.subscribe (秒级监控)
  • 计划任务 / 账号 / Token / 日志   • agent.ping.subscribe (实时拨测抖动)
  • 会话管理 / TOTP / 备份容灾       • task.dispatch (交互式终端与命令流)
  • 系统配置 / 主题 / 部署模式
```

---

## 2. RESTful HTTP 接口清单 (80% 业务操作)

所有 HTTP 接口均支持 `Authorization: Bearer <token>` 身份鉴权头，返回统一的 JSON 数据结构。

### 2.1 账户安全与会话管理 (`/api/v1/security`)

| HTTP 方法 | API 路径 | 描述 | 入参 (Body / Query) | 响应格式 |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/security/overview` | 获取管理员账户安全概览与 MFA 状态 | — | `SecurityOverview` |
| `POST` | `/api/v1/security/totp/setup` | 获取 TOTP 绑定密钥与动态二维码链接 | — | `{ secret: string, otpauthUrl: string }` |
| `POST` | `/api/v1/security/totp/verify` | 校验 6 位验证码并激活 TOTP | `{ code: string }` | `{ ok: true }` |
| `POST` | `/api/v1/security/totp/disable` | 校验管理员密码后关闭 TOTP | `{ verifyPassword?: string }` | `{ ok: true }` |
| `POST` | `/api/v1/security/password/change` | 修改管理员登录密码 (含 TOTP 校验) | `{ oldPassword, newPassword, mfaCode? }` | `{ ok: true }` |
| `GET` | `/api/v1/security/sessions` | 活跃登录终端与会话列表 | — | `{ sessions: SessionInfo[] }` |
| `DELETE` | `/api/v1/security/sessions/:id` | 强制注销指定终端会话 | — | `{ ok: true }` |
| `POST` | `/api/v1/security/sessions/terminate-others` | 强制注销其他所有外部终端会话 | — | `{ ok: true, terminatedCount: number }` |

### 2.2 存储容量、备份与容灾 (`/api/v1/system`)

| HTTP 方法 | API 路径 | 描述 | 入参 (Body / Query) | 响应格式 |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/system/storage-stats` | 各数据模块磁盘容量分布统计 | — | `StorageStats` |
| `GET` | `/api/v1/system/backup-plans` | 自动备份计划列表 | — | `{ plans: AutoBackupPlan[] }` |
| `POST` | `/api/v1/system/backup-plans` | 创建自动备份计划 | `Omit<AutoBackupPlan, "id">` | `AutoBackupPlan` |
| `PUT` | `/api/v1/system/backup-plans/:id` | 更新自动备份计划 | `Partial<AutoBackupPlan>` | `AutoBackupPlan` |
| `PUT` | `/api/v1/system/backup-plans/:id/toggle` | 启停指定备份计划 | `{ enabled: boolean }` | `{ ok: true }` |
| `DELETE` | `/api/v1/system/backup-plans/:id` | 删除指定备份计划 | — | `{ ok: true }` |
| `POST` | `/api/v1/system/backup-plans/:id/run` | 立即触发执行一次备份计划 | — | `{ ok: true, backup?, message }` |
| `POST` | `/api/v1/system/storage/test-remote` | 测试远程 S3 / WebDAV 连通性 | `RemoteStorageConfig` | `{ ok: true, latencyMs, message }` |
| `GET` | `/api/v1/system/backups` | 获取已生成的备份快照归档列表 | — | `{ backups: BackupArchive[] }` |
| `POST` | `/api/v1/system/backups` | 手动创建即时备份快照 | `{ scope, encrypt, notes? }` | `BackupArchive` |
| `POST` | `/api/v1/system/backups/:id/restore` | 解密覆盖还原系统数据 | `{ verifyKey?: string }` | `{ ok: true }` |
| `DELETE` | `/api/v1/system/backups/:id` | 删除单条备份快照文件 | — | `{ ok: true }` |
| `POST` | `/api/v1/system/backups/prune` | 规则批量清理历史快照 | `{ rule: "older_7d" \| "older_30d" \| "only_scheduled" \| "all" }` | `{ ok: true, removedCount }` |
| `POST` | `/api/v1/system/data-cleanup` | 按范围清理历史业务数据释放磁盘 | `{ type: "metrics" \| "audit" \| "alerts" \| "tasks", rule? }` | `{ ok: true, freedMb }` |

### 2.3 共享运维脚本库 (`/api/v1/scripts`)

| HTTP 方法 | API 路径 | 描述 | 入参 (Body / Query) | 响应格式 |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/scripts` | 脚本列表查询 (支持分组与关键词检索) | `?search=...&group=...` | `{ scripts: ScriptItem[] }` |
| `POST` | `/api/v1/scripts` | 新增脚本 | `{ name, content, language, group, ... }` | `ScriptItem` |
| `PUT` | `/api/v1/scripts/:id` | 修改脚本 | `{ name, content, language, group, ... }` | `ScriptItem` |
| `DELETE` | `/api/v1/scripts/:id` | 删除脚本 | — | `{ ok: true, id: string }` |
| `GET` | `/api/v1/script-groups` | 脚本分类分组列表 | — | `{ groups: ScriptGroupItem[] }` |
| `POST` | `/api/v1/script-groups` | 批量保存脚本分组 | `{ groups: ScriptGroupItem[] }` | `{ ok: true }` |

### 2.4 定时计划任务 (`/api/v1/crons`)

| HTTP 方法 | API 路径 | 描述 | 入参 (Body / Query) | 响应格式 |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/crons` | 获取计划任务列表 | `?search=...&enabled=...` | `{ crons: Cron[], total: number }` |
| `POST` | `/api/v1/crons` | 新增计划任务 | `{ name, serverId, expression, command }` | `Cron` |
| `PUT` | `/api/v1/crons/:id` | 修改计划任务 | `{ name, serverId, expression, command }` | `Cron` |
| `POST` | `/api/v1/crons/:id/toggle` | 启停计划任务 | `{ enabled: boolean }` | `{ ok: true }` |
| `DELETE` | `/api/v1/crons/:id` | 删除计划任务 | — | `{ ok: true }` |
| `GET` | `/api/v1/crons/logs` | 查询任务调度历史执行流水 | `?cronId=...&limit=20` | `{ logs: CronLog[], total: number }` |

### 2.5 成员账号与 API 凭证 (`/api/v1/accounts` & `/api/v1/tokens`)

| HTTP 方法 | API 路径 | 描述 | 入参 (Body / Query) | 响应格式 |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/accounts` | 成员账号列表 | — | `{ accounts: Account[], total: number }` |
| `POST` | `/api/v1/accounts` | 邀请新成员 | `{ username, role }` | `Account` |
| `POST` | `/api/v1/accounts/:id/lock` | 锁定/解锁账号 | `{ locked: boolean }` | `{ ok: true }` |
| `GET` | `/api/v1/tokens` | API Token 列表 | — | `{ tokens: Token[] }` |
| `POST` | `/api/v1/tokens` | 签发新 API Token | `{ name, scopes, expiresAt? }` | `Token` |
| `DELETE` | `/api/v1/tokens/:id` | 吊销 API Token | — | `{ ok: true }` |

### 2.6 系统全局配置与操作审计 (`/api/v1/system`)

| HTTP 方法 | API 路径 | 描述 | 入参 (Body / Query) | 响应格式 |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/system/configs` | 获取全局配置字典 | — | `{ settings: Setting[] }` |
| `PUT` | `/api/v1/system/configs` | 保存/更新配置项 | `{ key: string, value: string }` | `{ ok: true }` |
| `POST` | `/api/v1/system/network/diagnose` | 网络与 DNS 连通性诊断 | — | `{ ok: true, dnsLatency, gatewayLatency, probeMeshLatency }` |
| `GET` | `/api/v1/system/logs` | 查询系统操作审计流水 | `?search=...&module=...&result=...` | `{ logs: Log[], total: number }` |

---

## 3. WebSocket / JSON-RPC 2.0 接口清单 (20% 高频实时)

### 3.1 实时监控流 (`agent.summary.subscribe`)
- **协议**：WebSocket 双向长连接
- **推流频率**：1 秒/次（Tick）
- **数据载荷 (ServerMetrics)**：
  - `cpuUsage`, `memUsed`, `memTotal`, `diskUsed`, `diskTotal`, `netRxSpeed`, `netTxSpeed`, `uptime`, `loadOne`, `loadFive`, `loadFifteen`

### 3.2 实时拨测抖动流 (`agent.ping.subscribe`)
- **数据载荷 (PingSample)**：
  - `serverId`, `ts`, `probes: Array<{ target: string, latencyMs: number | null }>`
