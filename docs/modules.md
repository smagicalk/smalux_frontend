# 业务领域模块设计 (Domain Modules Design)

## 五大高内聚领域结构

`smalux` 控制台按照高内聚、低耦合原则，划分为 **5 大核心业务领域**：

| 领域模块 | 对应路由 | 优先级 | 核心业务职责与功能 |
| :--- | :--- | :---: | :--- |
| 📊 **总览大盘 (Overview)** | `/admin/overview` | P0 | 全网集群驾驶舱 HUD KPI、节点脉冲矩阵、未决告警事件流、控制台操作流水 |
| 🖥️ **基础设施 (Infrastructure)** | `/admin/infrastructure`<br>`/admin/infrastructure/servers/:id` | P0 | 主机资产台账、单机硬件与内核规格、实时进程拓扑抽屉、多协议网络拨测探针 |
| ⚡ **自动化运维 (Automation)** | `/admin/automation` | P1 | 跨模块公共脚本库、批量命令分发与高危审批、分布式定时任务 (Cron)、动态变量字典 |
| 🚨 **告警中心 (Alerts)** | `/admin/alerts` | P1 | 指标阈值规则引擎 (CPU/内存/磁盘/网络)、历史告警事件、多渠道外发推送网关 |
| ⚙️ **系统与安全 (Settings)** | `/admin/settings` | P1 | 操作员多用户账号与 MFA/Passkey、API Token 授权、系统全局配置字典、交付部署模式 |

---

## 1. 总览大盘领域 (`src/features/overview`)

- **驾驶舱 HUD KPI**：展示全网综合健康分 (`healthScore`)、SLA 可用率达标率、全网吞吐速率、活跃连接数与实时告警数。
- **节点脉冲矩阵 (Fleet Pulse Matrix)**：直接直连后端地域标签（Region/Group），动态叠加秒级推流监控数据。
- **未决告警与事件流**：真实反映当前告警与审计流水；为 0 时展示安全/提示占位状态，不强制填充假 Mock。

---

## 2. 基础设施领域 (`src/features/infrastructure`)

- **主机资产管理**：支持按地域、状态、分组进行模糊检索与排序。
- **单机硬件与内核规格**：展示 CPU 型号/架构/核心数、内存介质/频率、磁盘接口/类型、Linux 内核版本与特性（BBR v3 等）。
- **实时进程抽屉 (`ServerProcessesDrawer`)**：
  - 平铺列表与 `pstree` 父子进程拓扑树模式切换；
  - 常驻内存智能单位换算（KB / MB / GB / TB）；
  - 未开启采集或未上报时展示优雅引导提示。
- **网络拨测监控 (Ping Probes)**：支持 HTTP/HTTPS/TCP/ICMP/WSS 多协议探测与 24h SLA 统计。

---

## 3. 自动化运维领域 (`src/features/automation`)

- **公共共享运维脚本库 (`src/shared/components/script-library`)**：
  - 支持按业务分组分类管理 Shell 脚本；
  - 100% 由 RESTful HTTP API (`/api/v1/scripts`) 驱动；
  - 跨页面复用（自动化大盘与服务器单机详情抽屉）。
- **批量命令分发与审批流**：支持向单机或多机下发 Shell 任务，高危操作（High Risk）强制审批流转。
- **分布式计划任务 (Cron Jobs)**：标准 Cron 表达式周期调度、下次执行倒计时、启停开关与执行历史日志流水。

---

## 4. 告警中心领域 (`src/features/alerts`)

- **指标阈值告警规则**：支持 CPU、内存、磁盘利用率及判定持续时间窗口（`windowSec`）。
- **多渠道通知推送网关**：支持 Webhook 机器人、Telegram、Discord、企业微信、SMTP 邮件配置与即时测试。

---

## 5. 系统设置与安全领域 (`src/features/settings`)

- **系统操作员账户**：4 级权限角色划分（`admin`/`operator`/`viewer`/`auditor`），支持 WebAuthn / Passkey 免密凭证与 TOTP MFA。
- **API Token 管理**：按 Scopes 权限范围签发，支持有效期设置与即时吊销。
- **全局配置项字典**：支持基础设置、安全防护、配额限制、网络参数在线编辑。
- **多架构部署模式**：支持纯静态 CDN、Nginx 反代、Rust 单二进制内置 Embed 模式切换。
