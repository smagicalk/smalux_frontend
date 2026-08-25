# 架构设计 (Architecture Design)

## 目标与原则

`smalux` 前端是一个面向大规模分布式服务器集群、网络拨测探针与自动化运维调度的高性能现代云原生 Web 控制台。

核心架构设计原则：
- **高内聚领域划分**：收敛业务到 5 大核心领域，杜绝碎片化目录膨胀。
- **双协议清晰分工**：标准 CRUD 业务采用 **RESTful HTTP (JSON)**，高频实时遥测采用 **WebSocket (JSON-RPC 2.0)**。
- **组件高可复用**：公共业务组件（如脚本库 `script-library`）提升至 `shared/components/`，多页面无缝共享。
- **纯净数据驱动**：大盘数据 100% 取自后端返回，无数据时展示优雅空状态，杜绝强制填充假 Mock。
- **严格类型与契约**：所有 API 实体使用 Zod Schema 进行运行时严格校验，并包含全字段中文 JSDoc 注释。

---

## 技术栈体系

- **构建与核心**：Vite 8 + React 19 + TypeScript 6
- **样式与设计系统**：Tailwind CSS v4 + Radix UI + Lucide Icons + Sonner
- **路由与请求状态**：TanStack Router + TanStack Query
- **状态管理**：Zustand（高频遥测状态与主题切换）
- **数据校验**：Zod 运行时边界校验
- **时序与图表**：Apache ECharts (按需引入) + uPlot (秒级极速波形)
- **工程化与测试**：Vitest + Testing Library + Playwright

---

## 分层与目录结构

```txt
src/
  app/                     # 全局应用入口、运行时配置与顶层 Provider
    config/                # 运行时配置解析与环境变量 fallback
    providers/             # RpcProvider (带 HTTP BaseUrl 联动)、QueryClientProvider
    router/                # TanStack Router 路由与代码分割
    shell/                 # 桌面侧边栏、移动端导航与 Command Palette
  features/                # 5 大高内聚业务领域
    overview/              # 1. 总览大盘 (HUD KPI / 节点矩阵 / 告警流 / 审计事件流)
    infrastructure/        # 2. 基础设施资产 (主机台账 / 硬件规格 / 进程抽屉 / 网络拨测)
    automation/            # 3. 自动化运维 (批量命令分发 / 计划任务 Cron / 动态变量)
    alerts/                # 4. 告警中心 (规则引擎 / 告警历史 / 通知渠道)
    settings/              # 5. 系统设置与安全 (操作员账户 / API Token / 系统配置 / 部署模式)
  shared/                  # 工程级通用基础设施
    api/                   # API 契约与传输层
      http/                # RESTful HTTP Client (支持统一 Auth 注入与拦截器)
      schemas/             # Zod 实体契约 (含全字段详尽中文 JSDoc)
      transport/           # WebSocket / JSON-RPC 2.0 Client 与多路复用
    components/            # 跨领域共享业务组件
      script-library/      # 公共运维脚本库 (RESTful API 驱动，支持分组与管理)
    ui/                    # Radix / shadcn 基础 UI 原语 (Button, Dialog, Card 等)
    charts/                # ECharts / uPlot 封装
    stores/                # 全局 UI 状态 Store
```

---

## 通信协议分工矩阵

| 通信协议 | 协议封装 | 承载业务范围 (占比) | 典型应用场景 |
| :--- | :--- | :--- | :--- |
| **RESTful HTTP (JSON)** | `httpClient` (Fetch API + Bearer Token) | **~80% 业务操作** | 脚本库、计划任务、用户列表、API Token、系统配置、审计日志、主题、部署模式、告警规则、拨测目标列表、单机硬件规格 |
| **WebSocket (JSON-RPC 2.0)** | `WsTransport` (双向长连接 + JSON-RPC 2.0) | **~20% 高频实时交互** | `agent.summary.subscribe` (秒级指标遥测)、`agent.ping.subscribe` (实时拨测抖动)、`task.dispatch` (交互式 WebShell 终端) |

---

## 状态管理策略

1. **服务器端状态 (Server State)**：
   - 统一由 **TanStack Query** 进行管理，包含缓存、自动重试、按 QueryKey 级联失效 (Invalidation)。
2. **高频遥测状态 (Live Metrics State)**：
   - 由 **Zustand monitoring store** 缓冲最新推送样本；页面通过 `useThrottledMonitoring` 进行按需节流采样，避免高频推流导致 React 全组件树重复重绘。
3. **页面 URL 状态**：
   - 分页、关键词搜索、分组过滤、排序字段全部同步至 TanStack Router search params，支持刷新与分享。
