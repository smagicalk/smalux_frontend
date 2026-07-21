# 架构设计

## 目标

`smalux` 前端是一个监控后台与公开状态页的基础工程。当前阶段先建设后台，后续复用后台沉淀的监控组件、图表组件和主题系统，再实现公开主页。

架构目标：

- 模块功能单一。
- 业务组件可复用。
- 协议边界清晰。
- 性能优先考虑实时数据和大列表。
- 部署产物保持静态化，兼容三种部署形态。

## 技术栈

- Vite + React 19 + TypeScript
- Tailwind CSS v4 + CSS variables
- shadcn/ui 风格组件 + Radix UI
- lucide-react 图标
- TanStack Router、TanStack Query、TanStack Table、TanStack Virtual
- Zustand 状态管理
- Zod 边界校验
- uPlot 用于高频实时趋势，ECharts 用于普通统计和聚合图表
- Vitest、Testing Library、Playwright

## 分层结构

```txt
src/
  app/
    config/
    providers/
    router/
    shell/
    styles/
  features/
    overview/
    servers/
    tasks/
    cron/
    ping/
    alerts/
    notifications/
    logs/
    tokens/
    accounts/
    settings/
    themes/
    deployment/
  shared/
    api/
      mock/
      schemas/
      transport/
    charts/
    lib/
    stores/
    ui/
```

## 职责边界

### app

负责应用级能力：

- `main.tsx`：加载运行时配置、创建 Router 并挂载应用。
- `providers/`：提供 `RpcClient`、QueryClient 和主题状态。
- `router/`：代码式路由定义和页面级懒加载。
- `shell/`：桌面侧边栏、移动底部导航、顶部栏。
- `styles/`：全局 CSS variables 和 Tailwind v4 token。

### features

每个功能域独立维护自己的页面、组件和模型。

示例：

```txt
features/servers/
  pages/
  components/
  hooks/
  lib/
```

要求：

- 页面只做布局编排。
- 查询、变更和实时订阅放到领域 `hooks/`。
- 展示元数据和纯转换放到 `lib/`。
- 可跨功能复用的 UI 放到 `shared/ui`。
- 不在页面里直接调用 `fetch` 或 `new WebSocket`。

### shared

共享能力层。

- `api/`：RPC method 契约、Zod schema、transport、mock backend 和 Query keys。
- `ui/`：Button、Card、Badge、Dialog、Tabs、Switch、Toaster 等基础组件。
- `charts/`：可复用图表组件。
- `stores/`：全局状态，例如主题模式。
- `lib/`：格式化、class 合并、URL 拼接等纯函数。

## 协议客户端

当前已建立：

- `RpcClient`：统一的 `call` / `subscribe` 入口。
- `WsTransport`：JSON-RPC 多路复用、订阅、心跳和重连。
- `HttpTransport`：HTTP POST `/rpc` 兜底，不支持服务端推送。
- `MockTransport`：开发期内存后端和实时采样流。
- `methods.ts` + `schemas/`：method 名和入参/出参 Zod 契约。
- `RpcProvider` / `useRpc` / `queryKeys`。

后续要求：

- 所有业务请求通过领域 hook 获取 `RpcClient`，页面不直接调用 transport。
- RPC 响应和推送使用对应的 Zod schema 校验。
- JSON-RPC method 名集中维护在 `methods.ts`。
- WebSocket 推送进入领域 store 后再更新 UI。

## 状态策略

建议拆分：

- TanStack Query：RPC 查询、缓存、刷新和错误状态。
- Zustand：WebSocket 实时数据、主题模式、轻量 UI 状态。
- URL search params：分页、筛选、排序、时间范围。

禁止：

- WebSocket 消息直接触发整页 setState。
- 表格筛选状态散落在多个组件。
- 长期 token 存入 localStorage。

## 性能策略

- 路由级懒加载。
- 大列表使用虚拟滚动。
- 高频图表使用降采样。
- 图表局部渲染，不跟随整个页面重绘。
- 节点状态和趋势数据分离订阅。
- `dist/assets/*` 长缓存，`index.html` 不强缓存。

## 测试策略

当前测试重点：

- 运行时配置加载。
- URL 拼接。
- 查询筛选条件与 TanStack Query cache key 的一致性。

后续测试优先级：

- transport 错误处理和断线重连。
- JSON-RPC 响应校验。
- WebSocket 消息归一化。
- 主题配置解析。
- 服务器列表筛选排序。
- 登录和权限守卫。
