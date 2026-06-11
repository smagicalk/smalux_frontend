# smalux

`smalux` 是一个面向服务器与服务状态监控的现代化前端项目，目标是提供高性能、可部署灵活、主题可扩展且安全边界清晰的监控后台与公开状态页面。

## 项目定位

- 优先建设后台管理界面，公开主页/主监控页放在后续阶段打磨。
- 支持单独静态部署、Nginx 部署、Rust Web 内置三种形态。
- 与后端交互暂定支持 HTTP、WebSocket、JSON-RPC。
- 后台 UI 追求清晰、性能好、实体优先，避免模板化和重型 UI 依赖。
- 当前后台方向已经从通用 SaaS 后台收敛到更像探针监控面板的控制台布局。
- 主题系统需要支持后台主题切换，以及公开主页主题上传。

## 推荐技术栈

- 构建与基础：Vite、React 19、TypeScript、pnpm
- 路由与数据：TanStack Router、TanStack Query
- 表格与大列表：TanStack Table、TanStack Virtual
- UI 与样式：Tailwind CSS v4、shadcn/ui、Radix UI
- 图标：lucide-react
- 状态管理：Zustand
- 表单与校验：React Hook Form、Zod
- 图表：当前实现以 `src/shared/charts/*` 的轻量 SVG 图表为主；`uPlot` / `Recharts` 仍保留为后续真实监控数据接入时的候选
- 测试：Vitest、Testing Library、Playwright

## 架构原则

- 前端构建为静态产物：`pnpm build -> dist/`。
- 通过运行时配置文件管理部署环境，而不是只依赖构建期环境变量。
- HTTP、WebSocket、JSON-RPC 客户端统一封装，页面组件不得直接散落 `fetch` 或 `new WebSocket`。
- 实时监控数据进入统一状态层后再节流、降采样和局部渲染，避免全页面重渲染。
- 主题颜色使用 CSS variables，支持浅色、深色、跟随系统和自定义主题。
- 安全设计默认考虑 HTTPS/WSS、HttpOnly Cookie、CSRF、防 XSS、主题上传隔离和 Agent 密钥轮换。

## 部署方向

- 单独部署：`dist/` 由静态服务或 CDN 提供，API 指向独立后端。
- Nginx 部署：Nginx 提供静态资源，并反代 `/api`、`/ws`、`/rpc`。
- Rust Web 内置：Rust 服务直接 serve 或 embed `dist/`，适合单二进制交付。

## 详细文档

- [文档索引](./docs/README.md)
- [架构设计](./docs/architecture.md)
- [模块设计](./docs/modules.md)
- [功能路线](./docs/features.md)
- [安全设计](./docs/security.md)
- [主题系统](./docs/theme-system.md)
- [部署设计](./docs/deployment.md)

## 当前状态

当前前端已经是可运行的后台原型，而不只是工程骨架。

当前已具备：

- 路由矩阵：`/` 公开状态页，以及 `/admin`、`/admin/nodes`、`/admin/ping`、`/admin/executions`、`/admin/notifications`、`/admin/accounts`、`/admin/logs`、`/admin/themes`、`/admin/settings`、`/admin/deployment`
- 公开页与后台分离加载：`/` 不加载后台 Shell、后台 Provider 和后台依赖
- 后台 Shell：左侧分组导航、移动端底部导航、快速搜索、light/dark/system 主题切换
- 运行时配置、主题状态、HTTP / WebSocket / JSON-RPC client 骨架
- 共享轻量图表系统：趋势图、柱图、横向条、环图、分段条，已接入总览、服务器、Ping、执行、通知、账户、日志、主题、设置、部署页面
- 快速搜索已覆盖 Token、WSS、审批、终端、公开展示、Nginx、Rust 内置等运维关键词
- 执行页已补充批量动作边界、审批队列、Token Scope、JSON-RPC 执行通道和 WSS Web 终端安全入口
- 节点页已补充 Agent 接入边界、一次性注册 Token、密钥轮换、Token Scope 与区域治理视图
- Ping 页已补充目标组、协议健康、API/WSS 健康检查和公开状态页展示边界
- 主题上传、安全边界、部署矩阵和运行时配置的前端展示
- 页面级 mock 交互已补齐：总览刷新、总览卡片/最近事件/运维控制面、节点/Ping/日志/通知/账户/主题筛选、执行模板联动、部署方案选择、主题上传与危险操作反馈
- 总览、Ping、执行、通知、主题和设置页的块状卡片继续补齐点击反馈，避免“看起来能点但没反应”的静态面板
- 筛选结果会同步影响列表、摘要和部分图表；主要列表已补空状态，方便调试无匹配数据的界面表现
- 设置页已补运行时配置校验/复制/重载反馈，限制项参数支持搜索、分组筛选、选择和保存草稿；功能/安全设计网格支持搜索和标记筛选
- 公开状态页订阅入口已接入受控输入和 mock 订阅反馈，方便调试公开页基础交互
- 公开状态页、主题页、部署页和日志页继续拆成页面级组件，页面本身只保留状态管理与布局编排

当前阶段仍然以 mock 数据和信息架构验证为主。

需要明确：

- 绝大多数页面数据仍直接来自 `src/features/**/model/mock-*.ts`
- mock 数据已按调试场景扩充：多区域节点、API/WSS/RPC/Ping 目标、远程执行审批/失败/计划状态、通知投递、账户锁定、主题沙箱失败和部署形态
- 当前按钮反馈、筛选、导出、执行、上传、构建等操作仍为前端 mock 行为，通过 `sonner` toast 展示结果，不代表后端已执行
- 真实认证、权限、远程执行、主题上传和后端联调尚未接通
- 当前更准确的定义是“高完成度监控后台原型”，不是“真实后端已打通的成品系统”

## 当前性能

- 主包与后台已拆分，后台通过懒加载进入单独 chunk
- 后台 Provider 只在 `/admin` 路由树挂载
- 服务器页已去掉页面内 `@tanstack/react-table` 依赖，节点页构建分包维持在约 `9KB`

## 当前后台方向

这轮改动的重点不是“换主题”，而是让后台更像真实探针面板：

- `/admin` 总览页只做总览该做的事：状态、异常、关键趋势。
- `/admin/nodes` 以节点列表和节点状态扫描为主。
- `/admin/ping` 以探针/目标列表为主，同时区分目标组、协议健康、公开展示范围和外联限制。
- `/admin/executions` 以高风险操作、模板、批量下发、终端入口和审计链路为主。
- `/admin/notifications` 以策略、静默、渠道和投递历史为主。
- `/admin/logs` 以审计追踪、筛选和失败回溯为主。
- `/admin/accounts` 以角色、会话、MFA、Passkey 和权限边界为主。
- `/admin/themes` 以主题治理和公开隔离边界为主。
- `/admin/deployment` 以交付策略、运行时配置和缓存策略为主。
- 左侧栏已经压成更平的模块索引，不再强调卡片式品牌区。
- 顶部和移动端壳层持续暴露 HttpOnly、HTTPS/WSS 和会话隔离状态。
- 各页面继续遵循“每个页面专注自己的主任务”，避免总览承担过多次级信息。

## 外部参考落点

- Komari：公开页采用更直接的节点快读面板，让访客先看到区域、在线状态、资源压力和延迟
- Nezha / 哪吒：后台总览保留异常队列，执行页进一步补出计划任务、批量动作、审批队列、Web 终端等运维控制面入口
- NodeGet：部署、设置和节点页强调 headless Dashboard、HTTPS/WSS-only、主控接入、一次性注册 Token 和细粒度 Token Scope

## 当前优先项

- 继续减少 `/admin` 总览页里的非总览信息，让状态、异常和关键趋势保持主位
- 继续压平侧栏和顶栏的装饰性表现，保持控制台而不是展示页的气质
- 继续强化实体优先页面，让列表、表格和主对象操作优先于摘要卡片
- 继续把危险操作的前端反馈补实：审批、二次确认、输出脱敏、批量熔断、终端审计和公开展示白名单
- 保持运行时配置、主题系统和 API client 架构稳定，不为视觉调整打乱底层边界

## 本地运行

```bash
pnpm install
pnpm dev
```

## 验证命令

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

当前状态：以上命令已在本地通过。

额外检查：

- 已用 Playwright 对 `/admin/nodes`、`/admin/themes`、`/admin/settings`、`/admin/deployment` 做桌面截图抽样
- 已检查移动端 `/admin/nodes`、`/admin/deployment` 布局，无横向溢出
- 本轮已追加检查移动端 `/admin/executions`、`/admin/nodes`、`/admin/ping`，390px 视口下 `scrollWidth === innerWidth`
- 本轮功能补全后已追加无头 Playwright 交互抽样：节点空筛选、Ping 搜索、执行模板联动、日志时间窗口、主题筛选、部署方案选择和总览刷新 toast 均通过
- 本轮继续补齐了总览、Ping、执行、通知、主题和设置页的卡片/列表点击反馈，并在本地 dev 服务上抽样确认 toast 正常出现
- 本轮移动端抽样已覆盖 `/admin`、`/admin/nodes`、`/admin/ping`、`/admin/executions`、`/admin/logs`、`/admin/notifications`、`/admin/accounts`、`/admin/themes`、`/admin/deployment`，390px 视口无横向溢出
