# Smalux 控制台架构、组件、Hooks 与 API 全景开发手册

本文档为 Smalux 现代化云基础设施与自动化运维控制台的完整开发参考指南，涵盖系统全景架构、路由页面、业务功能组件、通用 UI 原子、全局状态 Stores、数据通信 Hooks 及 Mock/HTTP API 规范。

---

## 目录索引

1. [项目技术栈与架构设计](#1-项目技术栈与架构设计)
2. [全局状态管理 (Zustand Stores)](#2-全局状态管理-zustand-stores)
3. [通用原子 UI 组件库 (@/shared/ui)](#3-通用原子-ui-组件库-sharedui)
4. [业务核心功能模块 (Features)](#4-业务核心功能模块-features)
   - [总览大盘 (Overview)](#41-总览大盘-overview)
   - [主机基础设施 (Infrastructure)](#42-主机基础设施-infrastructure)
   - [自动化任务与调度 (Automation)](#43-自动化任务与调度-automation)
   - [告警中心与通知渠道 (Alerts)](#44-告警中心与通知渠道-alerts)
   - [系统设置与安全 (Settings)](#45-系统设置与安全-settings)
5. [网络请求客户端与 API / Mock 体系](#5-网络请求客户端与-api--mock-体系)
6. [全屏认证与 TOTP 登录使用指南](#6-全屏认证与-totp-登录使用指南)

---

## 1. 项目技术栈与架构设计

- **核心架构**: React 19 + TypeScript + Vite + TanStack Router + TanStack Query (React Query)
- **样式系统**: TailwindCSS v4 + CSS Variables (支持 6 种品牌主色与明暗主题自适应)
- **图表系统**: Apache ECharts 5 (深度定制暗黑/明亮主题)
- **状态管理**: Zustand (持久化与轻量响应式状态)
- **目录规范**: Feature-Sliced Architecture
  ```text
  src/
  ├── app/                  # 应用入口、路由定义 (router.tsx)、AppShell 外壳布局、导航
  ├── features/             # 核心业务域（overview, infrastructure, automation, alerts, settings）
  │   ├── api/              # 业务专用数据聚合层
  │   ├── components/       # 业务专用组件与 Tab 子面板
  │   ├── hooks/            # 领域 React Query Hooks
  │   ├── mock/             # 真实 RPC Mock 引擎与假数据
  │   ├── pages/            # 路由顶层页面
  │   └── types/            # 领域类型定义
  ├── shared/               # 全局通用基础设施
  │   ├── api/              # HTTP 客户端、Mock 数据、数据 Contract Schemas
  │   ├── lib/              # 通用工具函数 (cn, formatters, utils)
  │   ├── stores/           # 全局 Store (主题、管理员档案、登录弹窗)
  │   └── ui/               # 通用基础 UI 组件库 (Button, Card, Dialog, Toast 等)
  ```

---

## 2. 全局状态管理 (Zustand Stores)

### 2.1 主题与外观 Store (`useThemeStore`)
- **文件路径**: `src/shared/stores/theme-store.ts`
- **主要职责**: 管理系统明暗模式（Light/Dark/System）以及品牌主色调（Emerald/Violet/Amber/Rose/Cyan/Indigo）。
- **常用 API**:
  ```tsx
  import { useThemeStore, ACCENT_PRESETS } from "@/shared/stores/theme-store";

  const mode = useThemeStore((s) => s.mode); // "light" | "dark" | "system"
  const setMode = useThemeStore((s) => s.setMode); // (mode) => void
  const accent = useThemeStore((s) => s.accent); // "emerald" | "violet" | "amber" | "rose" | "cyan" | "indigo"
  const setAccent = useThemeStore((s) => s.setAccent); // (accent) => void
  ```

### 2.2 管理员档案 Store (`useAdminProfileStore`)
- **文件路径**: `src/shared/stores/admin-profile-store.ts`
- **主要职责**: 持久化存储管理员账号名、显示昵称、自定义 Base64 头像。
- **常用 API**:
  ```tsx
  import { useAdminProfileStore } from "@/shared/stores/admin-profile-store";

  const username = useAdminProfileStore((s) => s.username);
  const nickname = useAdminProfileStore((s) => s.nickname);
  const avatarUrl = useAdminProfileStore((s) => s.avatarUrl); // string | null
  const updateProfile = useAdminProfileStore((s) => s.updateProfile); // ({ username?, nickname? }) => void
  const setAvatarUrl = useAdminProfileStore((s) => s.setAvatarUrl); // (url) => void
  const resetToDefault = useAdminProfileStore((s) => s.resetToDefault);
  ```

### 2.3 全局登录与两步验证 Store (`useAuthModalStore` / `useAuthModal`)
- **文件路径**: `src/shared/stores/auth-modal-store.ts`
- **主要职责**: 驱动全屏毛玻璃认证弹窗，支持全屏强制阻断、账号密码校验以及动态 TOTP 口令输入。
- **常用 API**:
  ```tsx
  import { useAuthModal, useAuthModalStore } from "@/shared/ui/auth-modal";

  // 在 React 组件中使用
  const { openLoginModal, closeLoginModal } = useAuthModal();
  openLoginModal({
    isBlocking: false, // 是否全屏阻断无法关闭
    description: "执行高危批量运维前请先验证身份",
    onSuccess: () => {
      console.log("认证通过");
    }
  });

  // 在非 React 组件/拦截器中使用
  useAuthModalStore.getState().openLoginModal({ isBlocking: true });
  ```

---

## 3. 通用原子 UI 组件库 (`@/shared/ui`)

| 组件名 | 路径 | 核心能力与属性说明 |
| :--- | :--- | :--- |
| **Button** | `src/shared/ui/button.tsx` | 支持 `default`, `outline`, `ghost`, `danger`, `secondary` 变体，支持 `sm`, `default`, `lg`, `icon` 尺寸。 |
| **Card** | `src/shared/ui/card.tsx` | 包含 `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`。支持优雅暗黑/毛玻璃风格。 |
| **Badge** | `src/shared/ui/badge.tsx` | 支持 `default`, `primary`, `success`, `warning`, `danger`, `info`, `secondary` 变体，带微光环和圆角。 |
| **Dialog** | `src/shared/ui/dialog.tsx` | 现代化弹窗，包含 `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`。支持 ESC 关闭、动画平滑过渡。 |
| **ConfirmDialog** | `src/shared/ui/confirm-dialog.tsx` | 快捷二次确认弹窗（删除、高危操作），提供 `title`, `description`, `confirmText`, `onConfirm`, `variant="danger"`。 |
| **Switch** | `src/shared/ui/switch.tsx` | 现代化 iOS 风格无障碍 Toggle 开关组件。 |
| **Tabs** | `src/shared/ui/tabs.tsx` | 选项卡基建，包含 `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`。 |
| **GroupPillTabs** | `src/shared/ui/group-pill-tabs.tsx` | 胶囊状分段控制器，带数量徽章与动画滑块，广泛用于主机分组与状态过滤。 |
| **TimePicker** | `src/shared/ui/time-picker.tsx` | 定时任务时间选择器，支持 24 小时精准时间选择与 Cron 转换。 |
| **PageHeader** | `src/shared/ui/page-header.tsx` | 页面标准标题栏，包含 `title`, `subtitle`, `action` 槽位。 |
| **Toaster / toast** | `src/shared/ui/toaster.tsx` | 全局轻量 Toast 提示系统：`toast.success()`, `toast.error()`, `toast.info()`, `toast.warning()`。 |
| **GlobalLoginModal** | `src/shared/ui/auth-modal/` | 全屏遮罩两步登录弹窗（账号密码 ➔ 条件式 TOTP 6 位动态口令）。 |

---

## 4. 业务核心功能模块 (Features)

### 4.1 总览大盘 (Overview)
- **主页面**: `src/features/overview/pages/overview-page.tsx`
- **功能**:
  - 全球集群计算节点拓扑状态与在线率统计；
  - 秒级 CPU、内存、网络吞吐折线图（ECharts 时序大盘）；
  - 核心告警事件列表与快捷运维动作入口。

### 4.2 主机基础设施 (Infrastructure)
- **主页面**: `src/features/infrastructure/pages/infrastructure-page.tsx`
- **详情页**: `src/features/infrastructure/pages/server-detail-page.tsx`
- **核心组件**:
  1. `HostServersView` (`components/host-servers-view.tsx`): 主机卡片网格/列表展示、搜索过滤、排序、分组胶囊、分页控制器。
  2. `ServerDedicatedTasksSection` (`components/server-dedicated-tasks-section.tsx`): 节点专属计划任务与即时下发双栏调度流水面板（带常驻分页、页大小切换与批次弹窗）。
  3. `ServerProcessesDrawer` (`components/server-processes-drawer.tsx`): 主机当前运行进程抽屉，支持进程检索、内存/CPU 排序与强制 Kill。
  4. `AssetBillingLifecycleSection` (`components/asset-billing-lifecycle-section.tsx`): 主机资产账单、生命周期到期预警与续费管理。
  5. `AgentInstallDialog` (`components/agent-install-dialog.tsx`): Linux / Docker 一键安全 Agent 接入脚本弹窗。
- **数据 Hooks**:
  - `useServers(params)`: 查询主机列表（支持分页、搜索、状态、排序）。
  - `useServer(id)`: 获取指定主机的全量指标、网络寻址、硬件规格。
  - `useThrottledMonitoring()`: 节流订阅主机秒级遥测指标流。
  - `useInfrastructureData()`: 基础设施页面主数据聚合 Hook。

### 4.3 自动化任务与调度 (Automation)
- **主页面**: `src/features/automation/pages/automation-page.tsx`
- **核心功能**:
  - **定时计划任务 (Cron Schedules)**: 支持可视化时间设定与标准 Cron 表达式切换、任务启停、指定多机执行；
  - **即时批量运维 (Instant Task Dispatch)**: 实时下发 Shell / Python / Docker 运维脚本；
  - **调度流水与执行日志**: 任务执行历史检索、耗时分析与终端输出回显。
- **数据 Hooks**:
  - `useCronList()`, `useCreateCron()`, `useUpdateCron()`, `useDeleteCron()`, `useToggleCron()`
  - `useExecuteTask()`: 批量下发即时任务指令。
  - `useTaskLogs()`: 查询任务历史执行日志。

### 4.4 告警中心与通知渠道 (Alerts)
- **主页面**: `src/features/alerts/pages/alerts-page.tsx`
- **核心组件**:
  1. `AlertRulesTab` (`components/alert-rules-tab.tsx`): 告警策略与规则管理列表。
  2. `AlertRuleDialog` (`components/alert-rule-dialog.tsx`): 新建/编辑告警策略弹窗（支持多条件组合、指标阈值、通知渠道关联）。
  3. `AlertIncidentsTab` (`components/alert-incidents-tab.tsx`): 告警事件历史流水、告警认领与处理状态变更。
  4. `NotificationChannelsTab` (`components/notification-channels-tab.tsx`): 通知渠道管理（支持钉钉、企业微信、飞书、Webhook、邮件、Telegram）。
  5. `NotificationChannelDialog` (`components/notification-channel-dialog.tsx`): 渠道配置与即时测试推送。
  6. `SilenceDialog` (`components/silence-dialog.tsx`): 告警静默期设置。
- **数据 Hooks**:
  - `useAlerts()`: 获取全局告警规则与历史事件。
  - `useCreateAlertRule()`, `useUpdateAlertRule()`, `useDeleteAlertRule()`, `useToggleAlertRule()`
  - `useSilenceAlert()`: 触发告警静默。
  - `useNotificationChannels()`: 通知渠道列表与测试。

### 4.5 系统设置与安全 (Settings)
- **主页面**: `src/features/settings/pages/settings-page.tsx`
- **子 Tab 面板**:
  1. `AccountSecurityTab` (`components/account-security-tab.tsx`):
     - 主管理员账户档案（支持修改登录账号、显示昵称、**本地图片上传自定义头像并全局同步**）；
     - TOTP 双因子动态验证器绑定与解绑；
     - 管理员登录密码修改（强度检测、强密码生成、TOTP 校验）；
     - 活跃终端会话管理与下线；
     - API 访问 Token 签发与权限管理。
  2. `SystemConfigTab` (`components/system-config-tab.tsx`): 基础运行参数、日志留存期、网络并发数配置。
  3. `BuiltinTaskConfigTab` (`components/builtin-task-config-tab.tsx`): 内置巡检任务周期、健康度检查频率与自愈参数。
  4. `DataBackupTab` (`components/data-backup-tab.tsx`): 自动定时备份计划、快照打包归档、S3/WebDAV 异地容灾与备份还原。
  5. `AppearanceTab` (`components/appearance-tab.tsx`): 主题风格、大盘色彩与自定义 CSS 定制。
  6. `AuditLogsTab` (`components/audit-logs-tab.tsx`): 管理员操作审计轨迹追踪。

---

## 5. 网络请求客户端与 API / Mock 体系

### 5.1 HTTP 客户端 (`@/shared/api/http/http-client.ts`)
```tsx
import { httpClient } from "@/shared/api/http/http-client";

// GET 请求示例
const data = await httpClient.get<ServerListResponse>("/api/v1/servers", { page: 1, limit: 10 });

// POST 请求示例
const result = await httpClient.post<ActionResult>("/api/v1/tasks/dispatch", {
  serverId: "srv-01",
  command: "df -h"
});
```

### 5.2 统一 Mock 引擎体系
当后端接口尚未就绪时，各 feature 内置了完备的真实内存 Mock 引擎：
- **主机与遥测 Mock**: `src/shared/api/mock/mock-servers.ts` & `src/features/infrastructure/mock/infrastructure-mock.ts`
- **告警与通知 Mock**: `src/features/alerts/mock/alerts-mock.ts`
- **设置与安全 Mock**: `src/features/settings/mock/settings-mock.ts`

---

## 6. 全屏认证与 TOTP 登录使用指南

系统已提供全局独立的认证弹窗组件 `<GlobalLoginModal />`，并在 `AppShell` 根部注册。

### 触发模式：
1. **主动触发（非阻断模式，可点 X 或 ESC 关闭）**：
   ```tsx
   import { useAuthModal } from "@/shared/ui/auth-modal";

   function ActionButton() {
     const { openLoginModal } = useAuthModal();
     return (
       <Button onClick={() => openLoginModal({ description: "请验证管理员权限" })}>
         切换账号 / 验权
       </Button>
     );
   }
   ```
2. **强制阻断模式（不可关闭，必须登录成功才可进入）**：
   ```tsx
   import { useAuthModalStore } from "@/shared/ui/auth-modal";

   // 会话失效或退出登录时调用：
   useAuthModalStore.getState().openLoginModal({
     isBlocking: true,
     description: "当前会话已过期，请重新登录"
   });
   ```

### 认证流程：
1. **Step 1**: 输入账号与管理员密码；
2. **条件分支**:
   - 若系统检测到 **未开启 TOTP** ➔ 直接登录成功并颁发 Token；
   - 若系统检测到 **已启用 TOTP** ➔ 自动切换到 **Step 2**（输入 Authenticator 上的 6 位数字分段验证码，支持粘贴与自动提交）。
