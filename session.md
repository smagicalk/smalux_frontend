# Smalux 会话与架构纪要 (Session & Architecture Record)

> 最近更新时间：2026-08-26。本文档记录项目的权威基线、核心架构演进、系统安全与容灾体系、通信协议分工与后续迭代规划。

---

## 一、 当前基线与工程状态

- **工作区路径**：`f:/code/node/smalux_frontend`
- **当前主分支**：`vibe-dev`
- **核心技术栈**：React 19 + TypeScript + Vite 8 + TanStack Router + TanStack Query + Tailwind CSS v4 + Radix UI + Zod + Vitest
- **测试与构建状态**：
  - 🟢 **单元测试**：7/7 个测试文件、40/40 条测试用例 **100% 全部通过**；
  - 🟢 **生产打包**：`tsc -b && vite build` **0 Error** 完美通过。

---

## 二、 核心架构演进记录

### 1. 五大高内聚业务领域 (`src/features`)
系统严格划分为 5 大独立且高内聚的业务领域：
1. `src/features/overview/`：全景运维驾驶舱、HUD SLA 聚合、大盘节点矩阵、实时告警事件。
2. `src/features/infrastructure/`：主机资产管理、硬件规格、进程抽屉、网络探针与拨测监控。
3. `src/features/automation/`：批量运维分发、计划任务 Cron、动态变量字典、共享脚本库。
4. `src/features/alerts/`：告警规则引擎、触发历史、多渠道推送网关。
5. `src/features/settings/`：账号安全中心、多端会话管理、API Token、自动备份与异地容灾、全局配置。

### 2. 系统与安全中心（全面 Mock API 化与 React Query 驱动）
彻底消除了前端页面中的本地写死状态与孤立数据，统一构建了标准 API Client、Mock 响应引擎与 TanStack Query 接口层：
- **账户与安全 (`/admin/settings` - 账户安全 Tab)**：
  - **多端登录会话管理 (Sessions)**：实时识别当前客户端设备、IP、地理归属地及活跃时间，支持单个可疑设备强制下线与一键踢出其他全部外部会话 (`terminate-others`)；
  - **TOTP 双因子认证 (2FA)**：动态生成标准 TOTP 密钥与二维码，更换设备与解绑时强制校验当前密码防未授权降级；
  - **管理员密码策略**：16 位强随机密码生成，启用 TOTP 时强制二次口令核验。
- **数据备份与异地容灾 (`/admin/settings` - 数据备份 Tab)**：
  - **多数据库中立大盘**：工整对称展示系统主数据库、探针时序监控库、展示模板包与快照归档总体积；
  - **存储目标互斥模型**：【本地存储】（本地滚动保留快照）与【远程存储】（Amazon S3 / WebDAV 直推冷备，不占本地磁盘）严格二选一；
  - **主从双栏备份列表**：`左侧任务列表 ➔ 右侧任务专属快照`，任务与快照归属清晰溯源；
  - **按需业务数据清理**：支持对探针时序数据、操作审计日志、历史告警与任务执行日志按范围清理与释放磁盘。

### 3. 通信协议清晰分工（RESTful HTTP + WebSocket/JSON-RPC 2.0）
- **RESTful HTTP (JSON)**：承载常规数据读写（脚本、Cron、用户、Token、会话、备份计划、快照、系统配置、主题、部署目标、告警规则、拨测目标等）。
- **WebSocket (JSON-RPC 2.0)**：承载高频秒级遥测推流与命令流交互（`agent.summary.subscribe`, `agent.ping.subscribe`, `task.dispatch` 交互式终端）。

---

## 三、 API 路由规范清单 (RESTful HTTP)

| 业务领域 | HTTP 方法 | API 路径 | 说明 |
| :--- | :--- | :--- | :--- |
| **账户安全与会话** | `GET` | `/api/v1/security/overview` | 安全大盘指标与 MFA 状态 |
| | `POST` | `/api/v1/security/totp/setup` | 获取 TOTP 绑定密钥与二维码 |
| | `POST` | `/api/v1/security/totp/verify` | 校验并激活 TOTP |
| | `POST` | `/api/v1/security/totp/disable` | 验密并关闭 TOTP |
| | `POST` | `/api/v1/security/password/change` | 修改管理员登录密码 |
| | `GET` / `DELETE` | `/api/v1/security/sessions` | 活跃会话查询与单设备下线 |
| | `POST` | `/api/v1/security/sessions/terminate-others` | 强制下线其他所有外部会话 |
| **存储大盘与备份** | `GET` | `/api/v1/system/storage-stats` | 各数据模块磁盘容量统计 |
| | `GET` / `POST` / `PUT` / `DELETE` | `/api/v1/system/backup-plans` | 自动备份计划管理 |
| | `POST` | `/api/v1/system/backup-plans/:id/run` | 立即触发执行指定备份计划 |
| | `POST` | `/api/v1/system/storage/test-remote` | 测试 S3 / WebDAV 远程存储连通性 |
| | `GET` / `POST` / `DELETE` | `/api/v1/system/backups` | 备份快照列表与创建/删除 |
| | `POST` | `/api/v1/system/backups/:id/restore` | 解密覆盖还原系统数据 |
| | `POST` | `/api/v1/system/backups/prune` | 规则批量清理历史快照 |
| | `POST` | `/api/v1/system/data-cleanup` | 业务数据范围清理释放磁盘 |
| **运维脚本库** | `GET` / `POST` / `PUT` / `DELETE` | `/api/v1/scripts` | 脚本检索与维护 |
| | `GET` / `POST` | `/api/v1/script-groups` | 脚本分组分类管理 |
| **计划任务** | `GET` / `POST` / `PUT` / `DELETE` | `/api/v1/crons` | Cron 任务维护 |
| | `POST` | `/api/v1/crons/:id/toggle` | 启停计划任务 |
| | `GET` | `/api/v1/crons/logs` | 任务调度历史日志 |
| **访问凭证** | `GET` / `POST` / `DELETE` | `/api/v1/tokens` | API Token 签发与吊销 |
| **系统配置** | `GET` / `PUT` | `/api/v1/system/configs` | 全局运行配置项 |
| | `POST` | `/api/v1/system/network/diagnose` | 网络与 DNS 连通性诊断 |
| **操作审计** | `GET` | `/api/v1/system/logs` | 审计日志流水查询 |
| **告警中心** | `GET` / `POST` / `DELETE` | `/api/v1/alerts` | 告警规则维护 |
| | `GET` / `POST` | `/api/v1/notifications` | 通知渠道维护 |
| **网络拨测** | `GET` / `POST` / `DELETE` | `/api/v1/ping-targets` | 拨测探测目标列表 |
| **单机硬件** | `GET` | `/api/v1/servers/:id/hardware` | 单机硬件与内核规格 |
