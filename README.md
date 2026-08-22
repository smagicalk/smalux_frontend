# smalux

`smalux` 是一个面向服务器集群与网络服务监控的现代云原生运维控制台，采用高内聚架构与顶级 Linear/Vercel 级设计美学打造。

---

## 核心工作流架构 (5 大高内聚模块)

1. 📊 **总览大盘 (`/admin/overview`)**
   - 全集群核心 KPI 矩阵（节点健康率、全网 CPU/内存/磁盘水位、实时流量吞吐、活跃告警事件）。
   - 平滑资源波形趋势图表（Cluster Performance Streams）。
   - 待办异常事件行动队列与快捷操作通道。

2. 🖥️ **基础设施 (`/admin/infrastructure`)**
   - **主机集群 (Host Servers)**：实时 CPU/内存/磁盘 Gauge 仪表盘、一键 Agent 接入脚本 (`curl ... | bash`)、节点详情抽屉（实时遥测与 Web 远程终端）。
   - **服务网络探针 (Ping & Probes)**：HTTP/HTTPS/TCP/ICMP 探测、响应延迟热度、24h SLA、SSL 证书到期检测。

3. ⚡ **自动化运维 (`/admin/automation`)**
   - **远程命令与模板 (Remote Dispatch)**：多节点脚本下发、高频模板库（Docker、Nginx、磁盘清理等）。
   - **计划任务 (Cron Jobs)**：标准 Cron 调度器、下次触发倒计时、一键手动运行与启用开关。
   - **执行审计日志 (Task Logs)**：全量执行记录、退出码与暗黑终端回显。

4. 🚨 **告警中心 (`/admin/alerts`)**
   - **告警事件流水 (Incidents)**：严重/警告级别分层、一键知悉确认、静默 1 小时。
   - **告警触发规则 (Alert Rules)**：指标阈值配置（CPU/内存/离线/延迟等）。
   - **多渠道通知推送 (Notification Channels)**：飞书、钉钉、Telegram、Webhook、邮件配置与连通性测试。

5. ⚙️ **系统与安全 (`/admin/settings`)**
   - **访问控制与 API Token**：密钥生成、权限 Scope、一键复制与注销。
   - **全局操作审计日志**：敏感操作与登录追踪。
   - **外观与主题偏好**：深色 / 浅色 / 跟随系统，5 款核心强调色（Indigo / Emerald / Cyan / Violet / Rose）实时切换。
   - **系统配置与交付模式**：运行时参数、公开状态页预览、独立静态 / Nginx / Rust 内置单二进制交付。

---

## 技术栈与设计系统

- **核心框架**：React 19 + TypeScript + Vite 8
- **路由与数据**：TanStack Router + TanStack Query + Zustand
- **样式与设计系统**：Tailwind CSS v4 + Radix UI + Lucide Icons + Sonner
- **交互特性**：全局 `Ctrl + K` 快捷搜索命令面板 (Command Palette)、呼吸指示灯 (Pulse Dot)、毛玻璃质感 (Glassmorphism)。

---

## 常用开发命令

```bash
# 安装依赖
pnpm install

# 启动本地开发服务
pnpm run dev

# 运行 TypeScript 类型检查
pnpm run typecheck

# 运行 ESLint 规范检测
pnpm run lint

# 运行 Vitest 单元测试
pnpm run test

# 构建生产环境静态产物 (输出至 dist/)
pnpm run build
```
