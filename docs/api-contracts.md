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
  • 系统配置 / 主题 / 部署模式       • task.dispatch (交互式终端与命令流)
```

---

## 2. RESTful HTTP 接口清单 (80% 业务操作)

所有 HTTP 接口均支持 `Authorization: Bearer <token>` 身份鉴权头，返回统一的 JSON 数据结构。

### 2.1 共享运维脚本库 (`/api/v1/scripts`)

| HTTP 方法 | API 路径 | 描述 | 入参 (Body / Query) | 响应格式 |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/scripts` | 脚本列表查询 (支持分组与关键词检索) | `?search=...&group=...` | `{ scripts: ScriptItem[] }` |
| `POST` | `/api/v1/scripts` | 新增脚本 | `{ name, content, language, group, ... }` | `ScriptItem` |
| `PUT` | `/api/v1/scripts/:id` | 修改脚本 | `{ name, content, language, group, ... }` | `ScriptItem` |
| `DELETE` | `/api/v1/scripts/:id` | 删除脚本 | — | `{ ok: true, id: string }` |
| `GET` | `/api/v1/script-groups` | 脚本分类分组列表 | — | `{ groups: ScriptGroupItem[] }` |
| `POST` | `/api/v1/script-groups` | 批量保存脚本分组 | `{ groups: ScriptGroupItem[] }` | `{ ok: true }` |

### 2.2 定时计划任务 (`/api/v1/crons`)

| HTTP 方法 | API 路径 | 描述 | 入参 (Body / Query) | 响应格式 |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/crons` | 获取计划任务列表 | `?search=...&enabled=...` | `{ crons: Cron[], total: number }` |
| `POST` | `/api/v1/crons` | 新增计划任务 | `{ name, serverId, expression, command }` | `Cron` |
| `PUT` | `/api/v1/crons/:id` | 修改计划任务 | `{ name, serverId, expression, command }` | `Cron` |
| `POST` | `/api/v1/crons/:id/toggle` | 启停计划任务 | `{ enabled: boolean }` | `{ ok: true }` |
| `DELETE` | `/api/v1/crons/:id` | 删除计划任务 | — | `{ ok: true }` |
| `GET` | `/api/v1/crons/logs` | 查询任务调度历史执行流水 | `?cronId=...&limit=20` | `{ logs: CronLog[], total: number }` |

### 2.3 系统账号与访问凭证 (`/api/v1/accounts` & `/api/v1/tokens`)

| HTTP 方法 | API 路径 | 描述 | 入参 (Body / Query) | 响应格式 |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/accounts` | 成员账号列表 | — | `{ accounts: Account[], total: number }` |
| `POST` | `/api/v1/accounts` | 邀请新成员 | `{ username, role }` | `Account` |
| `POST` | `/api/v1/accounts/:id/lock` | 锁定/解锁账号 | `{ locked: boolean }` | `{ ok: true }` |
| `GET` | `/api/v1/tokens` | API Token 列表 | — | `{ tokens: Token[] }` |
| `POST` | `/api/v1/tokens` | 签发新 API Token | `{ name, scopes, expiresAt? }` | `Token` |
| `DELETE` | `/api/v1/tokens/:id` | 吊销 API Token | — | `{ ok: true }` |

### 2.4 系统全局配置与审计日志 (`/api/v1/system`)

| HTTP 方法 | API 路径 | 描述 | 入参 (Body / Query) | 响应格式 |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/system/configs` | 获取全局配置字典 | — | `{ settings: Setting[] }` |
| `PUT` | `/api/v1/system/configs` | 保存/更新配置项 | `{ key: string, value: string }` | `{ ok: true }` |
| `GET` | `/api/v1/system/logs` | 查询系统操作审计流水 | `?search=...&module=...&result=...` | `{ logs: Log[], total: number }` |

---

## 3. WebSocket / JSON-RPC 2.0 接口清单 (20% 高频实时)

### 3.1 实时监控流 (`agent.summary.subscribe`)
- **协议**：WebSocket 双向长连接
- **推流频率**：1 秒/次（Tick）
- **数据载荷 (ServerMetrics)**：
  - `cpuUsage`, `memUsed`, `memTotal`, `diskUsed`, `diskTotal`, `netRxSpeed`, `netTxSpeed`, `uptime`, `loadOne`, `loadFive`, `loadFifteen`
  - 可选分解字段：`cpuCores`, `networkInterfaces`, `disks`, `processes`

### 3.2 实时拨测抖动流 (`agent.ping.subscribe`)
- **数据载荷 (PingSample)**：
  - `serverId`, `ts`, `probes: Array<{ target: string, latencyMs: number | null }>`

---

## 4. 数据实体校验与 Schema 规范 (`src/shared/api/schemas/`)

所有前后端交互数据均在前端声明为标准 Zod Schema，并提供**全字段中文 JSDoc 注释**：
- `common.ts`：主机资产 `Server`、实时指标 `ServerMetrics`
- `accounts.ts`：多用户角色 `Account`
- `cron.ts`：定时任务 `Cron`、调度流水 `CronLog`
- `tasks.ts`：远程任务 `Task`、模板 `TaskTemplate`、变量 `TaskVariable`
- `ping.ts`：网络探针 `PingTarget`
- `alerts.ts`：告警规则 `AlertRule`、历史 `AlertHistory`
- `notifications.ts`：通知渠道 `NotificationChannel`
- `logs.ts`：审计流水 `Log`
- `settings.ts`：系统配置 `Setting`
- `tokens.ts`：API 令牌 `Token`
- `deployment.ts`：部署架构 `DeploymentTarget`
- `overview.ts`：驾驶舱聚合 `OverviewStatsResult`
