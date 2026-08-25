# Smalux 会话与架构纪要 (Session & Architecture Record)

> 最近更新时间：2026-08-25。本文档记录项目的权威基线、核心架构演进、通信协议分工与后续迭代规划。

---

## 一、 当前基线与工程状态

- **工作区路径**：`f:/code/node/smalux_frontend`
- **当前主分支**：`vibe-dev`
- **核心技术栈**：React 19 + TypeScript + Vite 8 + TanStack Router + TanStack Query + Tailwind CSS v4 + Radix UI + Zod + Vitest
- **测试与构建状态**：
  - 🟢 **单元测试**：6/6 个测试文件、36/36 条测试用例 **100% 通过**；
  - 🟢 **生产打包**：`tsc -b && vite build` **0 Error** 完美通过。

---

## 二、 核心架构演进记录

### 1. 五大高内聚业务领域 (`src/features`)
完成了从原有零散碎片目录向 5 大核心业务领域的全面归整：
1. `src/features/overview/`：全景运维驾驶舱、HUD SLA 聚合、大盘节点矩阵、实时告警事件。
2. `src/features/infrastructure/`：主机资产管理、硬件规格、进程抽屉、网络探针与拨测监控。
3. `src/features/automation/`：批量运维分发、计划任务 Cron、动态变量字典。
4. `src/features/alerts/`：告警规则引擎、触发历史、多渠道推送网关。
5. `src/features/settings/`：账号成员管理、API Token、系统全局配置、主题包、部署发布模式。

### 2. 跨模块共享脚本库 (`src/shared/components/script-library`)
- 脚本库从自动化中心解耦，提升为工程级公共组件；
- 既支持在自动化页面独立嵌入展示，也支持在服务器详情页通过抽屉随时调取；
- 100% 由纯 RESTful HTTP API (`/api/v1/scripts`) 驱动，支持脚本分组与增删改查。

### 3. 通信协议清晰分工（RESTful HTTP + WebSocket/JSON-RPC 2.0）
- **RESTful HTTP (JSON)**：承载约 80% 的常规数据读写（脚本、Cron、用户、Token、系统配置、主题、部署目标、告警规则、拨测目标列表等）。
- **WebSocket (JSON-RPC 2.0)**：承载约 20% 的高频秒级遥测推流与命令流交互（`agent.summary.subscribe`, `agent.ping.subscribe`, `task.dispatch` 终端交互）。

### 4. 总览大盘去 Mock 化与真实空状态策略
- 彻底移除了静态写死的 `MOCK_FLEET_NODES`、`MOCK_INCIDENTS`、`MOCK_LIVE_EVENTS` 与 `overview-mock.ts`；
- 大盘地域、机房与节点信息全部直接取后台返回的主机字段（后台返回什么就展示什么，前端不进行任何伪造计算），并与 WebSocket 秒级推流动态融合；
- 未决告警与实时事件流真实映射：有数据正常展示，为 0 时优雅展示绿色安全/提示占位状态。

### 5. 详尽字段级中文 JSDoc 注释
- 为 `src/shared/api/schemas/` 下的所有核心 Schema（`accounts.ts`, `cron.ts`, `tasks.ts`, `common.ts`, `agent.ts`, `alerts.ts`, `notifications.ts`, `logs.ts`, `tokens.ts`, `settings.ts`, `themes.ts`, `deployment.ts`, `overview.ts`）每一个字段属性添加了详尽、清晰、专业的中文 JSDoc 注释。

---

## 三、 API 路由规范清单 (RESTful HTTP)

| 业务领域 | HTTP 方法 | API 路径 | 说明 |
| :--- | :--- | :--- | :--- |
| **运维脚本库** | `GET` / `POST` / `PUT` / `DELETE` | `/api/v1/scripts` | 脚本检索与维护 |
| | `GET` / `POST` | `/api/v1/script-groups` | 脚本分组分类管理 |
| **计划任务** | `GET` / `POST` / `PUT` / `DELETE` | `/api/v1/crons` | Cron 任务维护 |
| | `POST` | `/api/v1/crons/:id/toggle` | 启停计划任务 |
| | `GET` | `/api/v1/crons/logs` | 任务调度历史日志 |
| **系统账号** | `GET` / `POST` / `PUT` | `/api/v1/accounts` | 成员账号与权限 |
| | `POST` | `/api/v1/accounts/:id/lock` | 锁定/解锁成员 |
| **访问凭证** | `GET` / `POST` / `DELETE` | `/api/v1/tokens` | API Token 签发与吊销 |
| **系统配置** | `GET` / `PUT` | `/api/v1/system/configs` | 全局运行配置项 |
| **操作审计** | `GET` | `/api/v1/system/logs` | 审计日志流水查询 |
| **告警中心** | `GET` / `POST` / `DELETE` | `/api/v1/alerts` | 告警规则维护 |
| | `GET` / `POST` | `/api/v1/notifications` | 通知渠道维护 |
| **网络拨测** | `GET` / `POST` / `DELETE` | `/api/v1/ping-targets` | 拨测探测目标列表 |
| **单机硬件** | `GET` | `/api/v1/servers/:id/hardware` | 单机硬件与内核规格 |
