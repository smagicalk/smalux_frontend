# Smalux Frontend

> 现代云原生服务器集群监控、自动化运维与数据安全控制台（Next-Gen Infrastructure Observability & Automation Console）

`smalux` 是一个面向大规模分布式服务器集群、网络拨测探针与自动化运维调度的高性能现代 Web 控制台。前端采用高内聚领域驱动架构（Domain-Driven Architecture）与 Linear / Vercel 级暗黑工程美学设计，支持 **RESTful HTTP 标准接口** 与 **WebSocket / JSON-RPC 2.0 秒级实时指标流** 双协议协同驱动。

---

## 🏛️ 核心工作流与五大高内聚领域 (`/src/features`)

系统严格划分为 5 大独立且高内聚的业务领域：

```
src/features/
├── overview/          # 1. 全局总览驾驶舱 (HUD KPI 聚合 / 节点脉冲矩阵 / 实时告警流 / 审计事件流)
├── infrastructure/    # 2. 基础设施资产 (主机台账 / 硬件规格 / 进程抽屉 / 网络探针 / 拨测监控)
├── automation/        # 3. 自动化运维 (批量命令分发 / 计划任务 Cron / 动态变量字典 / 调度日志)
├── alerts/            # 4. 告警中心 (指标阈值规则 / 告警历史 / 多渠道通知推送渠道)
└── settings/          # 5. 系统设置与安全 (操作员账户 / 会话管理 / API Token / 数据备份容灾 / 全局配置)
```

### 1. 📊 全局总览驾驶舱 (`/admin/overview`)
- **驾驶舱 HUD KPI**：全网集群综合健康度、SLA 达标率、总吞吐量、活跃连接数与实时告警计数。
- **节点脉冲矩阵 (Fleet Pulse Matrix)**：直接由后台返回的地域/机房分组驱动，动态叠加 WebSocket 秒级指标推流。
- **未决告警与事件流水**：100% 真实映射，支持无数据时的安全/空状态优雅提示。

### 2. 🖥️ 基础设施资产 (`/admin/infrastructure`)
- **主机资产台账**：支持多维度检索、标签过滤、状态分类与批量操作。
- **单机详情与硬件规格**：Linux 内核、CPU 架构、内存/磁盘介质、网络路由与 BGP 对等体状态。
- **实时进程抽屉 (`ServerProcessesDrawer`)**：支持平铺列表与 pstree 拓扑树形展示、内存智能单位换算（KB/MB/GB/TB）与即时采样。
- **多协议网络拨测 (Ping Probes)**：HTTP/HTTPS/TCP/ICMP/WSS 全协议探测与 24h SLA 统计。

### 3. ⚡ 自动化运维 (`/admin/automation`)
- **跨模块共享脚本库 (`src/shared/components/script-library`)**：支持在自动化中心与单机详情页无缝复用，纯 HTTP RESTful API 驱动。
- **批量任务下发与审批**：高危命令（High Risk）强制流转审批，动态变量 `$SERVER_ID` / `$NOW_TIMESTAMP` 运行时自动注入。
- **分布式定时任务 (Cron)**：标准 5 段 Cron 周期调度、下次执行倒计时与历史运行日志流水。

### 4. 🚨 告警中心 (`/admin/alerts`)
- **阈值告警引擎**：CPU/内存/磁盘/网络丢包持续时间窗口判定。
- **多渠道通知网关**：Webhook 机器人、Telegram、Discord、企业微信、SMTP 邮件配置与连通性测试。

### 5. ⚙️ 系统、安全与数据管理 (`/admin/settings`)

#### 🔐 账户安全与会话管理 (Sessions & MFA Security)
- **多端登录会话管理 (Session Management)**：
  - 自动识别当前登录设备、IP 地址、归属地及活跃时间，高亮标注 `[当前终端]`；
  - 支持**单个可疑设备强制下线**与**一键强制注销其他所有外部终端会话** (`POST /api/v1/security/sessions/terminate-others`)，保障异地登录防御；
- **TOTP 双因子认证 (2FA)**：
  - 动态生成标准 TOTP 密钥与二维码（兼容 Google Authenticator、Microsoft Authenticator、1Password 等）；
  - 更换设备与关闭 TOTP 时强制校验当前管理员密码，防止未授权降级；
- **管理员密码安全策略**：
  - 16 位强随机密码一键生成与剪贴板同步；
  - 密码强度实时检测（长度、大小写、数字、特殊字符四维打分）；
  - 启用 TOTP 时强制要求在修改密码时校验 6 位动态口令。

#### 💾 数据备份与多端异地容灾 (Data & Disaster Recovery)
- **多数据库中立架构**：存储大盘对称展示系统主数据库、探针时序监控库、展示大盘模板包与快照归档指标；
- **自动备份计划与多端容灾**：
  - 支持【固定时间（每日 / 循环间隔小时 / 每周自定义星期多选）】与【高级 Cron 表达式】双模式；
  - **存储目标互斥模型**：【本地存储】（本地自动滚动保留快照）与【远程存储】（直推 Amazon S3 / WebDAV 异地冷备，不占本地磁盘）严格二选一；
- **主从双栏备份列表 (`左侧任务列表 ➔ 右侧任务专属快照`)**：
  - 左侧集中展示各备份任务名称、调度模式、存储类型及快照份数徽章；
  - 右侧精准展示属于该任务名下的历史快照文件，支持即时下载、解密还原与单项删除；
- **按需业务数据清理 (Manual Data Cleanup)**：
  - 支持对探针时序监控、历史操作审计、告警通知流水与任务执行日志执行按天数/范围的安全清理与磁盘释放。

---

## 🌐 通信架构与双协议协同

```
┌─────────────────────────────────────────────────────────────┐
│                       Smalux 前端应用                        │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
        (80% 业务操作)                  (20% 高频实时)
               ▼                              ▼
  RESTful HTTP (JSON API)          WebSocket (JSON-RPC 2.0)
  • 脚本库增删改查                  • agent.summary.subscribe (秒级监控)
  • 计划任务 / 账号 / Token / 日志   • agent.ping.subscribe (实时拨测抖动)
  • 会话管理 / TOTP / 备份容灾       • task.dispatch (交互式终端与命令流)
  • 系统配置 / 主题 / 部署模式
```

- **全量 Mock API 引擎与 TanStack Query 驱动**：
  - 所有数据模块（包括备份 `use-backup.ts`、安全会话 `use-security.ts`、系统配置 `use-settings.ts` 等）均由标准 React Query Hooks 驱动，彻底消除前端硬编码与孤立状态；
  - 内置基于 `http-client.ts` 与 `settings-mock.ts` 的完整本地脱机 Mock 响应引擎，接口契约与后端 RESTful API 保持 1:1 严格对齐。

---

## 🛠️ 技术栈与工程实践

- **核心框架**：React 19 + TypeScript + Vite 8
- **路由与数据请求**：TanStack Router + TanStack Query
- **设计系统**：Tailwind CSS v4 + Radix UI + Lucide Icons + Sonner (深色/暗黑主题原生支持)
- **图表与时序**：Apache ECharts (按需引入) + uPlot 极速波形
- **二维码生成**：QRCode (用于 TOTP 绑定与客户端扫码)

---

## 🚀 常用开发与构建命令

```bash
# 1. 安装项目依赖
pnpm install

# 2. 启动本地开发服务 (带自动代理与 Mock Transport 兜底)
pnpm run dev

# 3. 运行 TypeScript 严格类型检查
pnpm run typecheck

# 4. 运行全量 Vitest 自动化单元测试 (包含 Mock API 验证)
pnpm run test

# 5. 生产环境构建打包 (输出至 dist/)
pnpm run build
```
