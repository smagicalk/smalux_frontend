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
- uPlot 作为高频监控图表方向，Recharts 用于普通统计图
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
    dashboard/
    nodes/
    settings/
    themes/
  shared/
    api/
    charts/
    domain/
    hooks/
    lib/
    stores/
    ui/
```

## 职责边界

### app

负责应用级能力：

- `main.tsx`：启动入口。
- `app.tsx`：接入 Router。
- `providers/`：运行时配置、API clients、QueryClient、主题、Tooltip、Toast。
- `router/`：路由定义和懒加载。
- `shell/`：桌面侧边栏、移动底部导航、顶部栏。
- `styles/`：全局 CSS variables 和 Tailwind v4 token。

### features

每个功能域独立维护自己的页面、组件和模型。

示例：

```txt
features/nodes/
  pages/
  components/
  model/
```

要求：

- 页面只做布局编排。
- 业务数据转换放到 `model/`。
- 可跨功能复用的 UI 放到 `shared/ui`。
- 不在页面里直接调用 `fetch` 或 `new WebSocket`。

### shared

共享能力层。

- `api/`：HTTP、WebSocket、JSON-RPC 客户端和 Query keys。
- `domain/`：跨功能领域类型。
- `ui/`：Button、Card、Badge、Progress、PercentBar 等基础组件。
- `charts/`：可复用图表组件。
- `stores/`：全局状态，例如主题模式。
- `lib/`：格式化、class 合并、URL 拼接等纯函数。

## 协议客户端

当前已建立：

- `HttpClient`
- `RpcClient`
- WebSocket URL 和 open 封装
- `createApiClients`
- `ApiClientsProvider`
- `useApiClients`
- `queryKeys`

后续要求：

- 所有请求通过 `useApiClients()` 获取客户端。
- HTTP 响应使用 Zod 校验。
- JSON-RPC method 名集中维护。
- WebSocket 消息类型集中定义，消息进入 store 后再更新 UI。

## 状态策略

建议拆分：

- TanStack Query：HTTP 查询、缓存、刷新、错误状态。
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
- 总览统计模型。

后续测试优先级：

- API client 错误处理。
- JSON-RPC 响应校验。
- WebSocket 消息归一化。
- 主题配置解析。
- 节点列表筛选排序。
- 登录和权限守卫。
