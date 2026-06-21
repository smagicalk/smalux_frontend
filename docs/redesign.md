# smalux 重设计

> 本文档是「从 0 重做后台」的设计依据。所有目录结构、数据层、IA 决策以本文为准。
> 旧实现整体废弃，仅在「保留资产」一节列出的技术基线可复用。

## 1. 背景与问题诊断

旧版 `smalux` 是一个「高完成度监控后台原型」，但存在三个核心问题：

1. **仍不够像探针面板** —— 视觉和信息架构停在通用 SaaS 后台：卡片堆叠、装饰性侧栏、KPI 化总览页。
2. **信息架构不清** —— 把 `dashboard / nodes / ping / executions / notifications / accounts / logs / themes / deployment` 铺成 9 个平级后台页，每页都塞「概览卡 + 列表 + 图表 + 边界说明」，职责互相渗透，总览页承担了过多其它页的信息。
3. **数据层是假的** —— 页面直接 `import` `mock-*.ts`，没有统一的数据流抽象；RPC client 走 HTTP POST 逐请求 fetch，没有真正复用长连接；WebSocket、HTTP、JSON-RPC 三通道并列但没有收敛，后续接真实后端时每个页面都要重写。

## 2. 参考项目调研结论

调研了三个同类探针系统（Komari / Nezha / NodeGet），各取所长：

| 维度 | Komari | Nezha | NodeGet |
|---|---|---|---|
| 栈 | React19 + TW4 + Radix + recharts | Go，前端编译进二进制 | Rust 后端 + Vue 前端(独立仓库) |
| 通道 | HTTP + WS | HTTP + WS + gRPC(Agent) | **WebSocket + JSON-RPC 唯一** |
| IA | 极简：公开页=实时网格，后台仅 5 菜单 | 全：服务器/告警/任务/服务监控/通知/设置 | Token/Scope/权限为核心，一切走 RPC |
| 数据层 | LiveDataContext 统一灌 WS | controller 分模块 | **composables = 领域 hooks**，WS 连接池多路复用 + 心跳 |
| 监控图 | recharts | 自研 | **uPlot**(轻量高吞吐) |
| 给 smalux | 公开页当 dashboard、后台只留 CRUD 的克制 | 告警/任务/Ping/服务监控的模块广度 | **RPC 一等公民 + Token 架构 + 领域 hooks + uPlot** |

### 关键启示

- **Komari 的克制**：它的后台之所以「轻」，是因为把实时监控直接做成了公开主页，管理后台只留服务器 CRUD + 设置 + 会话 + 账户。smalux 不必照搬这个分工（smalux 后台也要看实时监控），但要学它的「每页只做自己的事」。
- **NodeGet 的架构是金子**：彻底前后端分离，所有操作走 JSON-RPC over WebSocket；前端用领域 composable（`useAgentInfo` / `useDynamicMonitoring` / `useTask` / `useCron` / `useTokenList`）封装数据流，组件只消费 hook；WS 连接池 + JSON-RPC id 多路复用 + 30s 心跳。这正是 smalux 数据层「从假变真」的范本。
- **NodeGet 把 Token/Scope/Permission 当架构基石**，不是后置特性。`scopeCodec` / `tokenPermissionTemplates` / `permissionsState` 贯穿全栈。
- **uPlot 是探针时序图的行业答案**：自研 SVG 图表在 1s 级实时数据流下性能不够，uPlot 面向 canvas、极低开销。

## 3. 项目定位（不变）

`smalux` 是**服务器与服务状态监控 + 运维控制台**，对标 Komari / Nezha / NodeGet。先做后台，公开页后置。三种部署形态：纯静态 / Nginx 反代 / Rust 内置 embed。

## 4. 通道设计（核心决策）

旧版 `session.md` 定了 HTTP / WS / JSON-RPC 三通道并列。重做后**收敛为「WebSocket + JSON-RPC 为唯一前端通道」**（采纳 NodeGet）：

- **前端只和一个后端入口对话**：一个 WebSocket 连接（`/ws` 或 `/rpc`），承载所有 JSON-RPC 请求/响应、实时监控数据推送、事件流。
- **JSON-RPC 2.0**：请求用 `id` 多路复用同一连接；通知（notification，无 `id`）用于服务端主动推送（监控数据、在线状态、告警）。
- **HTTP 仅保留**：登录/会话 cookie、静态资源、运行时配置 `app-config.json`。不再有散落的 REST CRUD。
- **兜底**：若环境不支持 WS，回退到 HTTP POST `/rpc` 逐请求模式（现有 `rpc-client.ts` 的逻辑可复用为 fallback transport）。

理由：通道收敛 = 数据层抽象统一 = mock 与真实后端可无缝替换。前端领域 hook 只调 `rpc.call(method, params)`，底层 transport 是 WS 还是 mock 对页面透明。

> 待确认：你的后端是否同意「WS + JSON-RPC 单通道」？还是坚持要保留独立 REST？这影响数据层 API 形态。文档默认按单通道设计。

## 5. 数据层架构

四层，自下而上：

```
页面组件
   ↓ 只消费 hook，不直接调 rpc
领域 hooks (features/<domain>/hooks/use*.ts)
   ↓ useServers / useMonitoring / useTasks / useTokens / useCron / useAlerts / useLogs
RPC method 契约 (shared/api/methods.ts —— method 名 + zod schema)
   ↓ rpc.call("agent.list", {}, agentListSchema)
Transport 层 (shared/api/transport/ —— ws-pool / http-fallback / mock)
```

### 5.1 Transport 层

- `WsConnection`：单连接、懒建、断线重连、JSON-RPC id 多路复用、30s 心跳（仿 NodeGet `useWsConnection`）。
- `HttpFallbackTransport`：WS 不可用时退化为 POST `/rpc`。
- `MockTransport`：开发期拦截所有 `rpc.call`，返回 `mock-*.ts` 数据 + 模拟推送。**这是「先 mock 后端」的落点** —— 后端写好后，把 transport 从 Mock 切到 Ws 即可，领域 hook 和页面零改动。
- 统一 `RpcClient` 对外暴露 `call(method, params, schema)` 和 `subscribe(method, params, handler)`，内部按 runtime config 选 transport。

### 5.2 领域 hooks

每个业务域一个 hook，封装查询/变更/订阅，返回 `{ data, isLoading, error, mutate }`。页面只 import hook，**禁止页面直接 import mock 数据或直接调 rpc**。

规划领域（对应后端 RPC 命名空间，仿 NodeGet）：

| 领域 hook | 主要 RPC method | 职责 |
|---|---|---|
| `useServers` | `agent.list` / `agent.info` / `agent.metadata.set` | 服务器/节点列表、元数据、排序、隐藏 |
| `useMonitoring` | `agent.summary.last` / `agent.dynamic.subscribe` | 实时 CPU/内存/磁盘/网络/负载，1s 动态 + 60s 静态 |
| `useTasks` | `task.dispatch` / `task.result` | 远程命令执行、批量下发、结果回收 |
| `useCron` | `crontab.list` / `crontab.create` / `crontab-result.list` | 计划任务 |
| `useAlerts` | `alert.rule.list` / `alert.history` | 告警规则与历史（Nezha 模块） |
| `useTokens` | `token.list` / `token.create` / `token.verify` | Token/Scope/权限（NodeGet 核心） |
| `usePing` | `monitor.service.list` / `monitor.service.probe` | 服务监控/Ping 目标（Nezha 模块） |
| `useLogs` | `log.list` / `log.stream` | 审计日志、流式 |
| `useAuth` | `auth.login` / `auth.session` / `auth.logout` | 登录/会话 |
| `useSettings` | `config.read` / `config.edit` | 系统设置 |

### 5.3 RPC method 契约

`shared/api/methods.ts` 集中声明所有 method 名 + 入参/出参 zod schema。这是前后端契约的唯一真相源，后端照此实现，前端照此 mock。mock transport 按 method 名分发。

## 6. 权限模型（Token / Scope）

采纳 NodeGet 思路，Token/Scope 作为架构基石：

- 所有 API 调用携带 Token（HttpOnly cookie 会话 或 Bearer token）。
- Scope 是细粒度权限位：`agent:read` / `agent:exec` / `agent:terminal` / `token:manage` / `config:read` / `config:write` / `theme:upload` / `log:read` 等。
- 前端有 `usePermission` hook + `permission-store`，路由守卫和组件级按钮可见性都基于 scope。
- `token` 领域页是后台一等公民：创建 token、选 scope 模板、查看 token 使用情况。
- 旧版散落在各页面的「Token Scope / 区域治理 / Agent 接入边界」说明文案，收敛为 `tokens` 页的真实功能 + `usePermission` 驱动的按钮状态，不再做成静态说明卡。

## 7. 信息架构（后台）

后台以**服务器（节点）为绝对核心实体**。监控是实时数据流，其它能力围绕实体展开。

### 7.1 后台路由

```
/admin                      总览（值班台）：实时舰队状态 + 异常队列 + 关键趋势
/admin/servers              服务器列表（主战场）：实时网格 + 表格切换，每行一行实时指标
/admin/servers/:id          服务器详情：历史趋势(uPlot) + 进程 + 网络 + 任务 + 终端入口
/admin/tasks                远程执行：直接执行 / 模板 / 批量 / 审批队列
/admin/cron                 计划任务
/admin/ping                 服务监控/Ping：目标列表 + 协议健康 + 公开展示边界
/admin/alerts               告警：规则 + 历史 + 静默
/admin/notifications        通知：渠道 + 模板 + 策略 + 投递历史
/admin/logs                 审计日志：筛选 + 流式 + 导出
/admin/tokens               Token/权限：token 管理 + scope + 会话
/admin/accounts             账户：用户 + 角色 + MFA/Passkey
/admin/themes               主题：治理 + 上传隔离 + 预览
/admin/settings             设置：运行时配置 + 限制项 + 安全
/admin/deployment           部署：交付策略 + 运行时注入 + Nginx/Rust embed
```

### 7.2 IA 原则

- **实体优先**：列表/表格压过摘要卡。服务器页主体是实时网格，不是 KPI 卡阵列。
- **每页只做自己的事**：总览只做总览（状态 + 异常 + 趋势），不承担服务器列表的职责。
- **图表是解释层不是主体**：服务器详情用 uPlot 画历史，但服务器列表主位是实时数值条而非图表。
- **扁平侧栏**：侧栏是模块索引，不是品牌卡栈；顶栏是薄控制条（搜索 + 通知 + 主题 + 会话）。
- **危险操作有真实反馈**：审批、二次确认、批量熔断、终端审计——这些是功能不是说明文案。

### 7.3 与旧版 IA 的差异

- 旧 `dashboard` → 新 `/admin` 总览，砍掉模块入口和重复摘要。
- 旧 `nodes` → 新 `/admin/servers`，主位从「卡片列表」变「实时网格 + 表格」。
- 旧 `executions` 拆成 `/admin/tasks`（执行）+ `/admin/cron`（计划），职责更纯。
- 新增 `/admin/tokens` 一等公民页（旧版散落在各处的 Token Scope 收敛于此）。
- `themes` / `deployment` / `settings` 降权为治理类页面，不在主侧栏顶部。

## 8. UI 原则

- Tailwind v4 + shadcn/ui 原语 + Radix。
- 卡片压薄：padding 收紧、阴影圆角弱化、去装饰渐变。
- `Badge` 像数据标签不像装饰 pill。
- 监控数值用紧凑条/数字，不用大 KPI 卡。
- 顶栏 + 侧栏零悬浮感（无内层圆角阴影容器）。
- 图表统一用 **uPlot**（`src/shared/charts/` 封装趋势/柱/实时线），废弃旧自研 SVG 图表。
- 移动端：390px 无横向溢出，底栏导航。

## 9. 目录结构（新）

```
src/
├── app/
│   ├── config/          runtime-config.ts (保留) + providers
│   ├── router/          路由矩阵 + 守卫(权限)
│   ├── shell/           AppShell / Sidebar / TopBar / MobileNav / QuickSearch
│   └── providers/       RpcProvider / QueryProvider / ThemeProvider
├── features/
│   ├── servers/         pages/ hooks(useServers,useMonitoring) model/ components/
│   ├── tasks/
│   ├── cron/
│   ├── ping/
│   ├── alerts/
│   ├── notifications/
│   ├── logs/
│   ├── tokens/
│   ├── accounts/
│   ├── themes/
│   ├── settings/
│   ├── deployment/
│   └── overview/        /admin 总览
├── shared/
│   ├── api/
│   │   ├── transport/   ws-pool.ts http-fallback.ts mock-transport.ts
│   │   ├── rpc-client.ts (重写：WS为主,HTTP兜底)
│   │   ├── methods.ts   (RPC method + zod 契约)
│   │   ├── url.ts       (保留)
│   │   └── query-keys.ts
│   ├── auth/            useAuth / permission-store / route-guard
│   ├── charts/          uPlot 封装
│   ├── stores/          theme-store (保留)
│   ├── ui/              shadcn 原语
│   └── lib/             utils / format
└── main.tsx
```

## 10. 保留资产（技术基线，非设计）

以下文件与「设计」无关，是干净的技术基线，重做时**直接复用**：

- `src/app/config/runtime-config.ts` —— zod schema + `app-config.json` 运行时加载 + 安全端点校验。✅ 保留。
- `src/shared/api/url.ts` —— `joinUrl` / `isSafeRuntimeEndpoint`。✅ 保留。
- `src/shared/stores/theme-store.ts` —— 主题状态（需审视后保留或微调）。
- `src/shared/api/url.test.ts` —— 对应测试保留。
- `package.json` 依赖与脚本（Vite/React19/TW4/TanStack/Zustand/Zod/sonner/lucide）。新增 `uplot`。
- `eslint.config.js` / `tsconfig` / `vite.config` / `vitest.config` / `playwright` 配置。
- `globals.css` 的 CSS 变量 token 体系（颜色/间距），重写组件样式但保留 token。

**重写**（不复用）：

- `rpc-client.ts` / `ws-client.ts` / `api-clients.ts` / `http-client.ts` —— 按 transport 层重写。
- 所有 `features/**/pages/*` / `components/*` / `model/mock-*.ts` —— 旧实现废弃，按新 IA 重做。
- 所有旧 `shared/charts/*` SVG 图表 —— 换 uPlot。
- 所有旧 `shared/ui/*` —— 按新 UI 原则重写（保留 token）。
- `app/shell/*` —— 重做。

## 11. 「先 mock 后端」的落点

- 后端契约 = `shared/api/methods.ts` 的 method 名 + zod schema。
- `MockTransport` 实现这些 method，返回 `features/<domain>/model/mock-*.ts` 数据。
- 监控类 method 还要模拟「服务端推送」：`agent.dynamic.subscribe` 返回一个取消函数，内部 setInterval 推送随机波动的实时数据。
- runtime config 加 `transport: "mock" | "ws" | "http"` 字段，开发期默认 mock，部署期切 ws/http。
- **后端写好后**：把 `app-config.json` 的 transport 从 `mock` 改 `ws`，删除 MockTransport，页面与 hook 零改动。

## 12. 实施顺序

1. 写本文档（进行中）→ 与你确认通道决策与 IA。
2. 新建分支，全删旧 `src/`（保留 git 历史）。
3. 搭新目录骨架 + 复用保留资产 + `pnpm dev` 能跑起来空白壳。
4. 实现 transport 层（WsConnection + MockTransport）+ `methods.ts` 首批契约。
5. 实现 `useServers` + `useMonitoring` + 服务器列表页（实时网格）—— 第一个端到端验证。
6. 后台 Shell（侧栏/顶栏/移动底栏/搜索）。
7. 服务器详情页 + uPlot 图表。
8. 逐个推进其它领域页。
9. `pnpm typecheck/lint/test/build` + Playwright 抽样。

## 13. 待你确认

1. **通道**：同意「WS + JSON-RPC 单通道」(第4节)，还是要保留独立 REST？
2. **删除时机**：现在就在 `dev` 分支全删 `src/` 重搭，还是新建 `redesign` 分支隔离？
3. **图表库**：同意引入 uPlot（新增依赖），还是继续自研 SVG？
4. **公开页**：确认本轮完全不动，只做后台？
