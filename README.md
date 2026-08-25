# Smalux Frontend

> 现代云原生服务器集群监控与自动化运维控制台（Next-Gen Infrastructure Observability & Automation Console）

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
└── settings/          # 5. 系统设置与安全 (操作员账户 / API Token / 全局配置 / 部署模式 / 外观主题)
```

1. 📊 **总览大盘 (`/admin/overview`)**
   - **驾驶舱 HUD KPI**：全网集群综合健康度、SLA 达标率、总吞吐量、活跃连接数与实时告警计数。
   - **节点脉冲矩阵 (Fleet Pulse Matrix)**：直接由后台返回的地域/机房分组驱动，动态叠加 WebSocket 秒级指标推流。
   - **未决告警与事件流水**：100% 真实映射，支持无数据时的安全/空状态优雅提示。

2. 🖥️ **基础设施 (`/admin/infrastructure`)**
   - **主机资产台账**：支持多维度检索、标签过滤、状态分类与批量操作。
   - **单机详情与硬件规格**：Linux 内核、CPU 架构、内存/磁盘介质、网络路由与 BGP 对等体状态。
   - **实时进程抽屉 (`ServerProcessesDrawer`)**：支持平铺列表与 pstree 拓扑树形展示、内存智能单位换算（KB/MB/GB/TB）与即时采样。
   - **多协议网络拨测 (Ping Probes)**：HTTP/HTTPS/TCP/ICMP/WSS 全协议探测与 24h SLA 统计。

3. ⚡ **自动化运维 (`/admin/automation`)**
   - **跨模块共享脚本库 (`src/shared/components/script-library`)**：支持在自动化中心与单机详情页无缝复用，纯 HTTP RESTful API 驱动。
   - **批量任务下发与审批**：高危命令（High Risk）强制流转审批，动态变量 `$SERVER_ID` / `$NOW_TIMESTAMP` 运行时自动注入。
   - **分布式定时任务 (Cron)**：标准 5 段 Cron 周期调度、下次执行倒计时与历史运行日志流水。

4. 🚨 **告警中心 (`/admin/alerts`)**
   - **阈值告警引擎**：CPU/内存/磁盘/网络丢包持续时间窗口判定。
   - **多渠道通知网关**：Webhook 机器人、Telegram、Discord、企业微信、SMTP 邮件配置与连通性测试。

5. ⚙️ **系统与安全 (`/admin/settings`)**
   - **访问凭证与 API Token**：精细化 Scopes 权限分配与即时吊销。
   - **操作员账户与 MFA**：支持 WebAuthn / Passkey 免密安全登录与 TOTP 双因素认证。
   - **多架构交付模式**：纯静态 CDN、Nginx 反代分流、Rust 单二进制内置 Embed 打包。

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
  • 系统配置 / 主题 / 部署模式       • task.dispatch (交互式终端与命令流)
```

- **数据契约规范**：所有 API 实体在 `src/shared/api/schemas/` 集中通过 Zod 进行运行时严格校验，并提供**全字段详尽中文 JSDoc 注释**。

---

## 🛠️ 技术栈与工程实践

- **核心框架**：React 19 + TypeScript + Vite 8
- **路由与数据请求**：TanStack Router + TanStack Query
- **设计系统**：Tailwind CSS v4 + Radix UI + Lucide Icons + Sonner (深色/暗黑主题原生支持)
- **图表与时序**：Apache ECharts (按需引入) + uPlot 极速波形

---

## 🚀 常用开发与构建命令

```bash
# 1. 安装项目依赖
pnpm install

# 2. 启动本地开发服务 (带自动代理与 Mock Transport 兜底)
pnpm run dev

# 3. 运行 TypeScript 严格类型检查
pnpm run typecheck

# 4. 运行全量 Vitest 单元测试
pnpm run test

# 5. 生产环境构建打包 (输出至 dist/)
pnpm run build
```
