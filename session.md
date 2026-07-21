# smalux 会话纪要

## 当前上下文

- 当前仓库：`F:/code/node/smalux_frontend`
- 当前分支：`dev`
- 项目名称：`smalux`
- 当前代码状态：前端原型已可运行，公开页与后台页已拆分，后台主要模块页面与轻量图表体系已经落地。
- 当前功能状态：路由、运行时配置和 API client 骨架已具备，但绝大多数页面仍然直接消费 mock 数据。
- 本轮继续推进页面级模块化：`public`、`themes`、`deployment`、`logs` 页面已拆成独立区块组件，页面本身只负责状态和编排。
- 本次会话目标：查看你最近补充的项目文件，并把 `README.md`、`session.md` 同步到当前真实状态。

## 本次复查范围

- `package.json`：确认脚本、依赖和当前实际可执行验证命令。
- `src/app/router/router.tsx`：确认路由矩阵已经覆盖 `/` 与全部 `/admin/*` 页面。
- `docs/README.md`：确认文档索引结构已建立。
- 当前页面实现：重点复查了 `nodes`、`themes`、`settings`、`deployment`、导航与共享图表层。

## 本次复查结论

- 公开页与后台页已经完全分离：`/` 面向展示，后台页面全部挂在 `/admin` 下。
- 后台页面已包含：总览、服务器、Ping、远程执行、通知、账户、日志、主题、设置、部署。
- 当前图表实现以 `src/shared/charts/*` 的轻量 SVG 组件为主，不是 README 旧版本里暗示的 `uPlot/Recharts` 主驱动。
- 节点页已经移除页面内 `@tanstack/react-table` 使用，实际页面分包从约 `55KB` 压到约 `9KB`。
- 桌面侧栏和移动底栏都已改为精确高亮，避免 `/admin/nodes` 同时点亮 `/admin`。

## 当前 UI 约束

- 总览页只保留总览真正需要的信息：当前状态、异常队列和少量支撑趋势
- 实体页优先展示主对象：`nodes` 看节点，`ping` 看目标与链路，`logs` 看审计追踪，`notifications` 看策略与投递
- 左侧栏应表现为扁平的模块索引，而不是装饰性卡片栈
- 共享 UI 继续基于现有 shadcn 风格原语，但保持更高密度、更小徽标和更弱卡片感

## 本轮外部参考落地

- Komari：公开页新增节点快读区，把节点区域、在线状态、CPU、内存、磁盘、流量和延迟放到公开状态页主流程里。
- Nezha / 哪吒：后台总览保留异常队列，并补充计划任务、批量动作、Web 终端等运维控制面摘要。
- NodeGet：设置与部署补充 headless Dashboard、HTTPS/WSS-only、主控接入、细粒度 Token Scope 和插件/Worker 风险边界。
- 本轮继续把这些参考点落到实体页：执行页补批量动作与终端边界，节点页补 Agent 接入与 Token Scope，Ping 页补目标组、API/WSS 健康和公开展示边界。

## 当前优先项

1. 继续减少总览页的杂讯信息。
2. 继续压平侧栏和顶栏的壳层表现。
3. 继续推进实体优先页面，让列表/表格压过摘要卡片。
4. 保持 runtime config、theme 和 API client 架构稳定。

## 关键文件

- `src/app/shell/app-shell.tsx`
- `src/app/shell/quick-search.tsx`
- `src/app/shell/mobile-bottom-nav.tsx`
- `src/features/dashboard/pages/dashboard-page.tsx`
- `src/features/dashboard/components/*`
- `src/features/nodes/pages/nodes-page.tsx`
- `src/features/nodes/components/nodes-table.tsx`
- `src/features/ping/pages/ping-page.tsx`
- `src/shared/ui/card.tsx`
- `src/shared/ui/page-header.tsx`
- `src/shared/ui/stat-card.tsx`
- `src/shared/ui/badge.tsx`

## 已确认方向

- 先做后台管理界面，公开主页/主监控页最后打磨。
- 项目是“监控 + 运维控制台”，不是通用 SaaS 内容后台。
- 页面不应该只是统一换肤，而应该按职责分成值班台、节点面、链路面、审计面、策略面、治理面。
- 这轮额外确认后，总览页要减负，侧栏不能继续做成高卡片感壳层，每个页面只专注自己的主任务。
- 需要明确：当前项目更接近“高完成度监控后台原型”，还不是“真实后端已打通的成品系统”。
- 本轮继续拆分页面级组件后，主题页、部署页、日志页、公开状态页、节点页、执行页、Ping 页、通知页和账户页的页内职责更清晰，页面本身只保留状态和布局。
- 部署方式需要同时考虑：
  - 单独静态部署
  - Nginx 静态资源 + API/WS/RPC 反代
  - Rust Web 内置静态前端
- 与后端交互暂定：
  - HTTP：登录、用户、节点、主题、设置、告警等 CRUD
  - WebSocket：实时监控数据、在线状态、事件流、终端等
  - JSON-RPC：命令型动作、批量操作、测试通知、刷新节点等

## 推荐技术栈

- 构建与基础：Vite、React 19、TypeScript、pnpm
- 路由：TanStack Router
- 请求与缓存：TanStack Query
- 表格与虚拟滚动：TanStack Table、TanStack Virtual
- UI 与样式：Tailwind CSS v4、shadcn/ui、Radix UI
- 图标：lucide-react
- 状态管理：Zustand
- 表单与校验：React Hook Form、Zod
- 图表：
  - 当前实现：共享轻量 SVG 图表组件
  - 后续候选：uPlot / Recharts
- 测试：Vitest、Testing Library、Playwright

## 本轮关键判断

最开始的问题不是“组件不现代”，而是页面和母版更像现代 SaaS 后台，而不是 `komari / nezha / nodeget` 这种探针面板。

因此这轮真正的调整重点是：

- 压缩标题区、卡片、徽标和背景装饰。
- 降低侧栏卡片感，改成更平、更薄、更像模块索引。
- 首页去 KPI 卡化，不再堆过多模块入口和重复摘要。
- 节点页、Ping 页优先展示实体列表，把图表退为解释层。
- 让“每个页面专注自己的事”成为新的布局规则。

## 本轮实现结果

### 1. 共享母版与全局视觉

已调整：

- `src/app/styles/globals.css`
- `src/shared/ui/card.tsx`
- `src/shared/ui/page-header.tsx`
- `src/shared/ui/button.tsx`
- `src/shared/ui/badge.tsx`
- `src/shared/ui/progress.tsx`
- `src/shared/ui/metric-pill.tsx`
- `src/shared/ui/percent-bar.tsx`
- `src/shared/ui/stat-card.tsx`

方向变化：

- 背景更干净，装饰性渐变进一步减弱。
- 卡片 padding 收紧，阴影与圆角压薄。
- `Badge` 更像数据标签，而不是装饰性 pill。
- `StatCard` 从大 KPI 卡压成更紧凑的摘要条。
- `PageHeader` 改成更薄的标题条，不再像 hero header。

### 2. 后台 Shell 与搜索

已调整：

- `src/app/shell/app-shell.tsx`
- `src/app/shell/quick-search.tsx`
- `src/app/shell/mobile-bottom-nav.tsx`

方向变化：

- 左侧栏去掉高卡片感结构，改成更平的模块导航。
- 顶栏改成更薄的控制条。
- 搜索框更像快速跳转入口，而不是功能发现面板。
- 整体壳层更接近探针面板，不再像展示型后台。

### 3. 总览页减负

这轮最终进一步收紧为：

- 总览页只保留当前状态、异常队列和关键趋势。
- 左侧栏继续压平，不再保留高卡片感品牌块。
- 节点页进一步收敛到“看节点 + 做节点操作”。
- Ping 页进一步收敛到“目标列表 + 薄摘要 + 趋势解释层”。


已调整：

- `src/features/dashboard/pages/dashboard-page.tsx`
- `src/features/dashboard/components/runtime-status-strip.tsx`
- `src/features/dashboard/components/overview-metrics.tsx`
- `src/features/dashboard/components/dashboard-charts.tsx`
- `src/features/dashboard/components/operations-grid.tsx`
- `src/features/dashboard/components/module-shortcuts.tsx`
- `src/features/dashboard/components/node-health-grid.tsx`

方向变化：

- 总览页移除了不必要的模块入口和重复节点速览。
- 首页现在只保留：当前运行状态、异常队列、关键趋势。
- `OverviewMetrics` 已从大 KPI 卡压成紧凑摘要块。
- `DashboardCharts` 仍保留趋势，但存在感弱于异常与状态区。
- `OperationsGrid` 更接近异常 / 事件队列，而不是说明卡阵列。

### 4. 实体优先页面

已调整：

- `src/features/nodes/pages/nodes-page.tsx`
- `src/features/nodes/components/nodes-table.tsx`
- `src/features/nodes/components/node-mobile-cards.tsx`
- `src/features/ping/pages/ping-page.tsx`

方向变化：

- 节点页继续以节点表格和状态扫描为主。
- 节点速览从大卡片列表压成更紧凑的列表式摘要。
- Ping 页把探针 / 目标列表放到主位，右侧摘要退为辅助。
- 趋势图继续保留，但不再盖过目标列表。
- 节点页新增 Agent 接入边界：WSS 出站接入、一次性注册 Token、分批密钥轮换。
- 节点页新增 Token Scope 与区域治理：把 `node:read`、`node:exec`、`node:terminal`、公开主题读取等权限拆开呈现。
- Ping 页新增目标组与展示范围：Public、Control、Notify、Private 分层，明确哪些可公开展示、哪些只在后台可见。
- Ping 页新增协议健康：HTTP、TCP、ICMP、WSS 分开说明监测重点，并把 API/WSS 健康纳入后台探测边界。

### 4.1 远程执行控制面

已调整：

- `src/features/executions/pages/executions-page.tsx`

方向变化：

- 执行页不再只展示直接执行、模板、计划和记录。
- 新增批量动作边界：目标预演、组内并发上限、失败熔断和回滚模板。
- 新增审批队列：高风险写操作、批量目标阈值、终端提权会话分开呈现。
- 审批队列新增下发冻结状态，明确待审批项清空前不能进入执行队列的能力边界。
- 直接执行区补充 Token Scope、JSON-RPC 执行通道和 WSS-only 终端通道。
- 新增 Web 终端安全入口：强调按会话授权、WSS、Origin 校验、独立审计编号和默认关闭的危险能力。

### 5. 其他后台页面

已完成职责化重排的页面：

- `src/features/executions/pages/executions-page.tsx`
- `src/features/notifications/pages/notifications-page.tsx`
- `src/features/logs/pages/logs-page.tsx`
- `src/features/accounts/pages/accounts-page.tsx`
- `src/features/themes/pages/themes-page.tsx`
- `src/features/settings/pages/settings-page.tsx`
- `src/features/deployment/pages/deployment-page.tsx`
- `src/features/public/pages/public-status-page.tsx`

方向变化：

- 执行页更像高风险操作面。
- 通知页更像告警编排面。
- 日志页更像审计追踪面。
- 账户页更像权限边界面。
- 主题页更像主题治理面。
- 部署页更像交付策略面。
- 公开页和后台气质已分离。

### 6. 共享图表与交互

已调整：

- `src/shared/charts/*`
- `src/shared/ui/form-controls.tsx`
- `src/app/shell/navigation.ts`
- `src/app/shell/quick-search.tsx`
- `src/app/shell/app-shell.tsx`

方向变化：

- 图表底板、网格线、图例和密度已统一。
- 增加共享表单控件层，减少页面里各写各的输入样式。
- 主要交互页的 hover / focus / 行级反馈已做一致性收口。
- 快速搜索扩展 Token、WSS、审批、终端、公开展示、Nginx、Rust 内置等关键词。
- 搜索空状态新增运维查询提示，顶部和移动端壳层补充 HttpOnly、HTTPS/WSS、WSS-only 等安全状态提示。

## 文档更新

本轮同步更新：

- `README.md`
- `session.md`

文档已明确说明：

- 当前后台方向已经偏探针监控面板，而不是通用 SaaS 后台。
- 公开页与后台页的路由边界。
- 当前图表、性能和验证状态。

## 功能真实性判断

重新搜索后可以确认：

- 路由、运行时配置加载、HTTP / WS / JSON-RPC client 骨架都已经存在。
- 但 `dashboard`、`nodes`、`ping`、`executions`、`notifications`、`accounts`、`logs`、`themes`、`deployment` 等页面，当前仍主要直接依赖 `mock-*` 数据文件。
- 所以当前更准确的描述是“高完成度监控后台原型”，而不是“真实业务已接通的后台系统”。

## Mock 数据调试集

本轮已扩充 mock 数据，让前端调试覆盖更完整：

- `nodes`：扩展为 10 台节点，覆盖 Edge、Core、Database、Cache、Worker、Proxy，多区域在线、预警和离线状态。
- `ping`：新增 WSS、JSON-RPC、数据库端口、代理入口、私网拒绝样例，覆盖 HTTP/TCP/ICMP 与启用/禁用状态。
- `executions`：新增 Agent 重启、网络诊断、内核采集模板，补充定时任务、待审批任务、失败、运行中、计划和成功执行记录。
- `notifications`：新增 Discord、WeCom、Web 终端、主题上传、静默窗口等投递与抑制场景。
- `accounts`：新增审计只读、锁定用户、主题维护邀请、多设备会话。
- `logs`：补充审批冻结、Web 终端、主题沙箱失败、私网目标拒绝、密钥轮换等审计链路。
- `themes` / `deployment`：新增草稿主题、公开资源隔离、企业预览主题、Headless Dashboard 和容器镜像交付场景。
- 图表指标已同步扩展，避免页面列表数据与图表体量明显不一致。

## 页面功能补全

本轮继续把后台页面从静态展示推进到可调试的前端 mock 交互：

- 总览页：刷新视图按钮接入 `sonner` 反馈，汇总节点、Ping 和日志窗口数据。
- 后台 Shell：通知按钮给出 mock 通知中心反馈，避免顶栏空操作。
- 节点页：筛选节点按钮反馈当前命中数，搜索、状态、分组筛选继续联动列表、摘要和轮换操作文案；节点列表补无结果空状态。
- Ping 页：搜索、状态、协议筛选联动目标列表和摘要；目标列表补无结果空状态。
- 执行页：模板库按钮反馈模板数量和审批模板数量；目标、模板、命令预览、风险、Scope 和审批状态保持联动。
- 日志页：搜索、模块、结果和时间窗口都变成真实前端筛选；导出任务基于当前筛选结果生成 mock 文件名；日志列表补无结果空状态。
- 通知页：渠道类型和投递状态筛选分别联动渠道列表与历史事件；渠道和历史事件均补无结果空状态。
- 账户页：角色、状态筛选联动用户列表、MFA 和 Passkey 摘要；用户列表补无结果空状态。
- 主题页：生命周期筛选联动主题列表、生命周期分布和参数类型图表；主题预览、参数、回滚和上传都有 mock 反馈。
- 部署页：部署模式可点击选择并展示当前方案；交付状态按 mock 数据动态统计，实施复杂度补充 Headless 和容器镜像。
- 设置页：运行时配置支持校验、复制和模拟重载；限制项参数支持搜索、分组筛选、当前参数选择和保存草稿；功能设计/安全设计网格支持搜索和标记筛选。
- 公开状态页：订阅邮箱变成受控输入，订阅按钮会做基础邮箱校验并给出 mock 反馈。

需要明确：这些动作仍是前端 mock 交互，用于调试页面功能和状态联动；没有接入真实认证、上传、远程执行、通知投递或部署任务。

## 验证状态

本次复查已经完成实际验证。

已通过：

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

额外完成：

- Playwright 桌面截图抽样：`/admin/nodes`、`/admin/themes`、`/admin/settings`、`/admin/deployment`
- Playwright 移动端抽样：`/admin/nodes`、`/admin/deployment`
- 本轮追加 Playwright 移动端抽样：`/admin/executions`、`/admin/nodes`、`/admin/ping`
- DOM 检查：移动端 `scrollWidth === innerWidth`，无横向溢出
- 本轮页面功能补全后追加无头 Playwright 交互抽样：节点空筛选、Ping 搜索、执行模板联动、日志时间窗口、主题筛选、部署方案选择和总览刷新 toast 均通过
- 本轮移动端抽样覆盖 `/admin`、`/admin/nodes`、`/admin/ping`、`/admin/executions`、`/admin/logs`、`/admin/notifications`、`/admin/accounts`、`/admin/themes`、`/admin/deployment`，390px 视口无横向溢出
- 本次会话中已确认本地预览可访问：`http://127.0.0.1:4173/admin/nodes`

当前视觉验收标准：

- `/admin` 比早期版本更轻、更聚焦，减少说明型卡片
- `/admin/nodes` 明确以节点和节点操作为主，而不是额外分析页
- `/admin/ping` 明确以目标和链路质量为主，而不是解释型摘要页
- 侧栏整体应更平、更工具化，避免装饰性过强

## 本轮补充

- 继续补齐“点了没反应”的区域：总览页的 runtime status / overview metrics / recent events / 运维控制面，Ping 页的监测目标和安全限制，执行页的模板、定时任务和执行记录，通知页的模板行，主题页的参数/回滚/安全规则，设置页的颜色系统。
- 执行页继续拆分为 `execution-overview-cards`、`execution-boundary-panels`、`execution-direct-panel`、`execution-template-panel`、`execution-scheduled-panel`、`execution-runs-panel`、`execution-terminal-panel`，页面入口只保留模板联动、目标选择和 toast 编排。
- Ping 页继续拆分为 `ping-filters-panel`、`ping-targets-panel`、`ping-summary-card`、`ping-boundary-panels`、`ping-charts-panel`、`ping-security-rules-panel`，并新增 `model/ping-display.ts` 管理状态、分组、协议健康和安全规则展示元数据。
- 通知页继续拆分为 `notification-overview-cards`、`notification-filters-panel`、`notification-channels-panel`、`notification-templates-panel`、`notification-policies-panel`、`notification-history-panel`，并新增 `model/notification-display.ts` 管理策略严重度和投递状态展示元数据。
- 账户页继续拆分为 `account-overview-cards`、`account-filters-panel`、`account-users-panel`、`account-roles-panel`、`account-sessions-panel`，并新增 `model/account-display.ts` 管理账户状态展示元数据。
- 节点页继续拆分为 `node-filters-panel`、`node-fleet-status-card`、`node-operations-card`、`node-agent-boundary-card`、`node-governance-card`，并新增 `model/node-display.ts` 管理状态颜色、Agent 接入、Token Scope 和区域治理展示元数据。
- 节点列表组件 `nodes-list`、`nodes-table`、`node-mobile-cards` 不再直接调用 toast，改为接收 `onInspect` 回调，业务反馈统一留在页面层。
- 设置页限制项继续拆分为 `setting-limits-filter-bar`、`setting-limits-summary`、`setting-limits-grid`，并新增 `model/setting-limits.ts` 管理主题上传、Ping、远程执行、通知、Agent 注册和日志保留参数。
- `SettingLimitsCard` 现在只负责搜索状态、分组筛选、当前参数选择和保存草稿反馈，限制项数据与展示列表已下沉。
- 总览页运维控制面继续拆分为 `operations-exception-card`、`recent-events-card`、`control-plane-card`，并新增 `model/operations.ts` 管理异常摘要和控制面入口数据。
- 部署洞察继续拆分为 `deployment-charts-panel`、`deployment-runtime-injection-card`、`deployment-nginx-card`、`deployment-rust-embed-card`，并新增 `model/deployment-insights.ts` 管理运行时注入、Nginx 片段和 Rust 内置提示。
- 主题库继续拆分为 `theme-library-filters`、`theme-library-list`、`theme-library-item`，并新增 `model/theme-display.ts` 管理主题生命周期状态展示元数据。
- 公开状态页继续拆分为 `public-status-header`、`public-service-list`、`public-subscribe-card`、`public-region-card`、`public-service-status`，并新增 `model/public-status-summary.ts` 管理公开状态摘要和最近检查条。
- 部署目标面板继续拆分为 `deployment-target-card` 和 `selected-deployment-summary`，单个部署模式卡片、选中方案摘要和页面选择状态职责分离。
- 设置页安全洞察继续拆分为 `settings-security-insights` 和 `model/security-insights.ts`，安全覆盖率、配置成熟度、风险分层和限制项风险数据不再堆在页面文件。
- 日志页继续抽离 `model/log-filters.ts`，搜索、模块、结果和时间窗口筛选变成可单测的纯函数；`log-list-panel` 不再直接调用 toast，改由页面传入 `onLogClick`。
- 新增 `public-status-summary.test.ts` 与 `log-filters.test.ts`，覆盖公开状态摘要和日志筛选核心规则。
- 节点页继续抽离 `model/node-filters.ts`，分组选项、搜索、状态和分组筛选成为可复用纯函数，并补 `node-filters.test.ts`。
- 账户页继续抽离 `model/account-filters.ts`，角色/状态筛选、MFA/Passkey 可见用户摘要从页面下沉，并补 `account-filters.test.ts`。
- 通知页继续抽离 `model/notification-filters.ts`，渠道类型筛选、投递状态筛选和通知概览摘要从页面下沉，并补 `notification-filters.test.ts`。
- Ping 页继续抽离 `model/ping-filters.ts`，目标搜索、状态和协议筛选从页面下沉，并补 `ping-filters.test.ts`。
- 公开节点快读区继续拆分为 `public-node-card` 和 `public-node-metric`，`public-fleet-section` 只保留标题、说明和列表编排。
- 主题页继续抽离 `model/theme-insights.ts`，生命周期分布、参数类型聚合、上传趋势和上传限制从页面下沉，并补 `theme-insights.test.ts`。
- 设置页限制项继续抽离 `model/setting-limit-filters.ts`，分组筛选、关键字筛选和可见行计数从组件下沉，并补 `setting-limit-filters.test.ts`。
- 主题治理面板继续拆分为 `theme-upload-settings-card` 和 `theme-governance-charts`，`theme-governance-panel` 只保留布局编排。
- 执行页继续抽离 `model/execution-selection.ts`，模板选择、审批模板计数、失败执行计数、风险标签、Token Scope 和影响范围从页面/组件下沉，并补 `execution-selection.test.ts`。
- 部署页继续抽离 `model/deployment-page-insights.ts`，部署评分序列、缓存策略、交付复杂度和运行态分段从页面下沉，并补 `deployment-page-insights.test.ts`。
- 执行直接面板继续拆分 `execution-confirmation-guard`，高风险二次确认提示和按钮从命令表单区域分离。
- 重新搜索同类面板后，参考哪吒服务器公开备注里的账单周期、金额、到期、自动续费、流量配额和流量类型字段，将节点页操作命名从“添加节点”调整为“添加服务器”。
- 新增共享 `Dialog` 组件，基于已安装的 `@radix-ui/react-dialog` 封装 Overlay、Content、Header、Title、Description、Body、Footer 和 Close。
- 新增 `add-server-dialog`，表单包含服务器名称、价格金额/货币单位、计费周期（免费、按日、按周、按半月、按月、按年、按两年、按三年）、到期时间、永久有效、自动延续、流量计算方式（上行+下行、只算上行、只算下行）、额度和单位（GB/TB/PB）。
- 新增 `model/server-create-form.ts` 和 `server-create-form.test.ts`，对服务器草稿表单做基础校验与提交摘要生成；提交仍为前端 mock toast，不代表真实后端已创建服务器。
- 按“后台监控不需要悬浮、不要无意义信息”的反馈继续简化 `add-server-dialog`：删除头部摘要条、实时预览、安全边界说明、图标分区和描述文案，只保留标题、字段、错误提示和底部操作按钮。
- `DialogContent` 现在支持 `closeClassName` 覆盖；共享 Dialog 默认去掉大阴影，遮罩保留克制半透明底层，避免弹窗看起来像展示页悬浮卡片。
- 继续修复顶部后台监控标题栏：移除 header 内层圆角、阴影和半透明卡片样式，搜索框也去掉悬浮阴影；添加服务器弹窗的流量字段改为两列自适应布局，额度和单位不再挤在同一窄列。
- 本轮 Playwright 坐标检查确认：顶部内层 `borderRadius=0px`、`boxShadow=none`；弹窗输入控件无重叠，桌面和移动端均无横向溢出。
- 继续压平共享 `PageHeader`，去掉页面标题卡片的圆角、边框背景和阴影，只保留底部分隔线；添加服务器弹窗改成 `max-w-xl`、紧凑 `h-9` 输入控件，验证后弹窗高度从约 664px 降到约 576px。
- 本轮 Playwright 复查：页面标题 `borderRadius=0px`、`boxShadow=none`，弹窗控件 `overlaps=[]`，桌面和移动端横向溢出均为 0。
- 价格字段继续补充货币单位，支持 CNY、USD、EUR、GBP、JPY、HKD、TWD、SGD、AUD、CAD；提交摘要会输出金额和货币中文/代码，弹窗布局改为服务器名称独占一行、价格和货币同一行，避免重叠。
- 本轮安全检测：`pnpm audit --audit-level low` 无已知漏洞；源码未命中 `dangerouslySetInnerHTML`、`eval(`、`new Function`、`innerHTML`；已移除 Google Fonts 远程请求；运行时端点增加相对路径或 http(s)/ws(s) scheme 校验；主题 localStorage 读写改为可降级。
- 已删除依赖包目录 `node_modules/.pnpm/nanoid@3.3.12/node_modules/nanoid/.claude`，仓库内复查没有再命中 `.claude`。
- 修正主题页的结构问题：外层主题卡片不再是嵌套按钮，改为可键盘访问的 `div role="button"`，内部 `参数` 和 `回滚` 按钮通过 `stopPropagation()` 独立工作。
- 新起了本地 dev 服务 `http://127.0.0.1:5173`，用它验证最新源码而不是旧预览。
- 已用 Playwright 抽样确认这些点击会在页面尾部生成对应 toast，包含总览刷新、Ping 异常、HTTP API、后台 API、执行模板、通知模板、主题参数、颜色 swatch 和主题安全规则。
- 这轮验证仍然保持 `pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm build` 全部通过；当前单元测试为 15 个文件、37 条用例。

## 下一步建议

1. 下一阶段优先把 `mock-*` 数据逐步替换为真实 HTTP / WS / JSON-RPC 数据流。
2. 如果继续做前端体验，优先补真实表单流和危险操作反馈，而不是继续堆说明卡片。

## 2026-07-20 当前会话更新

> 本节是当前 `redesign` 工作树的权威状态，覆盖上文中与当前实现冲突的旧描述；上文仅作为历史记录保留。

### 当前基线

- 当前分支为 `redesign`，工作区包含用户已有的大规模未提交重构，本次没有回滚或覆盖这些改动。
- `/` 当前重定向到 `/admin`，没有公开状态页路由。
- 后台包含总览、服务器、服务器详情、任务、计划任务、Ping、告警、通知、日志、Token、账户、主题、设置和部署 14 个页面组件；Shell 与页面均按路由懒加载。
- 数据访问以 WebSocket + JSON-RPC 为主通道，HTTP `/rpc` 为兜底；当前默认使用 `src/shared/api/mock/` 的 mock transport，真实认证、权限和后端联调尚未完成。

### 本次完成

- 恢复 `src/test/setup.ts`，补充任务筛选 query key 回归测试；`queryKeys.tasks` 保留为 mutation 失效前缀，列表查询改用包含筛选条件的 `queryKeys.taskList(filters)`。
- 清理全部 ESLint error/warning；颜色数组依赖和 Fast Refresh 公共导出边界已明确处理。
- 将集群监控节流 hook 改为每批生成不可变 Map/数组快照，避免原地 mutation 导致图表冻结，也不再需要高频原始 `tick` 绕过节流语义。
- ECharts 从全量运行时切换为 `echarts/core` 按需注册，覆盖 Line、Bar、Pie、Radar、Scatter、Heatmap、Funnel、Gauge 及实际使用的组件。
- 修复 `echarts-for-react/lib/core` 深层 CommonJS 默认导入在 Vite/Rolldown 生产包中被解析为对象所造成的 React #130 白屏，改用包内 `esm/core` 后通过原始浏览器反馈环。
- 路由、架构、模块和功能文档已同步到当前 redesign 实现。

### 验证结果

- `pnpm typecheck`：通过。
- `pnpm lint`：通过，0 error、0 warning。
- `pnpm test`：3 个测试文件、9 条用例全部通过。
- `pnpm build`：通过；主入口约 307.18 KB（gzip 96.85 KB）。
- ECharts chunk 从约 1,138.89 KB 降至 703.20 KB（gzip 235.70 KB），减少约 38%；仍高于 Vite 默认 500 KB 阈值，因此构建保留一条大 chunk 提示。
- Playwright 图表回归：6 个图表密集路由 × 2 个视口，共 12 次访问，所有 canvas 均为非零尺寸，无 console/page error、无横向溢出。
- Playwright 全入口回归：13 个可直接访问的后台入口 × 2 个视口，共 26 次访问，`errors=[]`、`overflows=[]`。
- 本次涉及文件与 `session.md` 均保持原有无 BOM UTF-8 编码，中文抽样无乱码。

### 当前遗留

- 真实认证、权限守卫和后端数据接入尚未实现，当前业务流程仍以 mock transport 为默认数据源。
- ECharts 已显著减小，但共享图表运行时仍为 703.20 KB；若必须消除 500 KB 提示，需要按页面拆分注册集合或改用更轻量图表实现。
- WebSocket 重连、消息解析和 transport 失败路径仍缺少专项自动化测试。

### 下一步建议

1. 为 JSON-RPC transport、WebSocket 重连和异常消息解析补集成测试。
2. 增加认证状态与权限路由守卫，再开始真实后端联调。
3. 依据实际首屏性能数据决定是否继续拆分 ECharts 注册集合，避免只为消除阈值提示增加维护复杂度。

## 2026-07-21 通信层测试更新

### 本次完成

- 新增 `src/shared/api/transport/transport.test.ts`，通过 transport 公共接口覆盖 8 个关键行为：HTTP 非 2xx 错误、JSON-RPC 错误信息保留、WebSocket 请求/响应、异常通知隔离、响应 schema 校验、断线重连、连接失败转 HTTP `/rpc`、业务 `RpcError` 不触发 HTTP 兜底。
- 修复 `RpcClient` 只按配置二选一、没有真正执行 HTTP fallback 的问题：WS 连接不可用且不是业务 `RpcError` 时，同一次调用会使用 HTTP transport；显式测试 transport、业务错误和已连接状态下的 schema 错误不会被兜底掩盖。
- 修复 WebSocket 响应 schema 校验异常逃出 message handler、导致 RPC Promise 无法稳定结束的问题；现在 schema 不匹配会正常 reject 原调用。

### 验证结果

- `pnpm typecheck`：通过。
- `pnpm lint`：通过，0 error、0 warning。
- `pnpm test`：4 个测试文件、17 条用例全部通过，其中新增通信层测试 8 条。
- `pnpm build`：通过；ECharts chunk 仍为 703.20 KB，只有既有的大 chunk 提示。
- 本轮文件与 `session.md` 均保持无 BOM UTF-8 编码。

### 后续重点

- 通信层基础失败路径已有自动化保护；后续可补心跳超时、连续重连退避、订阅恢复和真实服务端协议契约测试。
- 真实认证、权限守卫与后端联调仍未完成。

## 2026-07-21 前端模块化拆分更新

### 本次拆分

- 服务器详情页新增 `hooks/use-server-detail-series.ts`，集中 CPU、内存、网络总量/上下行和磁盘 IO 序列派生；`server-detail-body` 只保留订阅、生命周期和布局编排。
- 服务器详情页新增 `components/server-identity-strip.tsx`，封装状态、标签、系统信息、公网 IP 和最后上报时间展示。
- 设置页新增 `components/settings-group-section.tsx`，封装单个设置分组的元数据、字段列表和草稿编辑回调；页面继续负责筛选、批量保存和 toast。
- 日志页新增 `components/logs-filter-bar.tsx`，封装搜索、模块、结果、操作人和排序筛选；页面继续负责查询参数、统计和结果表格。
- 服务器列表页新增 `hooks/use-sorted-servers.ts`，隔离静态排序与实时指标排序对 monitoring store 的订阅；新增 `components/server-filter-bar.tsx`，封装搜索、状态和排序控件。
- Ping 页新增 `lib/ping-overview.ts`，集中目标筛选、排序和集群统计；新增 `components/ping-target-list.tsx`，封装加载、空状态和目标表格。

### 拆分边界

- 保留现有页面和组件的对外调用方式，没有把每个小 JSX 片段机械拆成文件。
- 总览图表区暂不硬拆：多个图表共享同一批节流聚合数据，继续拆成多个文件会增加 props 搬运和重复计算；后续应先按数据域确定边界。
- 新增模块均包含职责注释，组件通过明确 props 与回调通信，没有引入跨模块状态。

### 验证

- `pnpm typecheck`：通过。
- `pnpm lint`：通过，0 error、0 warning。
- `pnpm test`：5 个测试文件、19 条用例全部通过；新增 Ping 派生逻辑测试覆盖异常优先排序和分组筛选下的全局统计。
- `pnpm build`：通过；主入口约 307.48 KB，ECharts chunk 703.20 KB，仍只有既有大 chunk 提示。
- 新增/修改文件均为无 BOM UTF-8，`git diff --check` 无空白错误。
- Playwright 抽查服务器列表/真实详情、设置、日志、Ping 的桌面和移动端；无 console/page error、无横向溢出，详情页 11 个 canvas 均可见。

## 2026-07-21 API 注释与拆分边界更新

### 本次完成

- 为 `methods.ts` 补充 API 组合入口说明，明确领域 schema、方法目录、JSON-RPC envelope 校验和方法级 result 校验之间的关系。
- 为 `Transport`、`RpcClient` 和 `RpcError` 补充契约注释，明确网络错误、schema 错误与服务端业务错误的区别，以及只有 WS 不可用的非业务错误才允许 HTTP fallback。
- 为 HTTP transport 补充无状态连接语义、请求 ID、响应 envelope、结果校验和不支持推送订阅的说明。
- 为 WebSocket transport 补充并发建连复用、请求超时、响应路由、通知隔离、心跳、断线重连、订阅清理和 dispose 生命周期说明。
- 为 query key 与运行时 URL 工具补充缓存前缀、过滤条件序列化和 endpoint 安全边界说明。
- 为 mock backend 补充状态所有权说明：RPC 路由、写操作和实时指标共享服务器与 runtime 状态，当前保留单一组合根，避免为了文件体积硬拆出状态同步依赖。

### 当前边界

- 页面第一阶段模块化拆分已经完成；总览图表共享聚合区和 mock backend 暂不继续机械拆分。
- API 已按 `schemas/`、`transport/`、`mock/`、`methods.ts` 分层；`methods.ts` 是稳定公共入口，领域 schema 仍各自维护。
- WebSocket 重连会保留本地订阅映射并自动重放 `.start`；当前协议仍没有对应的 `.stop` 命令，取消订阅只清理本地路由状态。

### 验证

- `pnpm typecheck`：通过。
- `pnpm lint`：通过，0 error、0 warning。
- `pnpm test`：5 个测试文件、19 条用例全部通过。
- `pnpm build`：通过；主入口 307.48 KB，ECharts chunk 703.20 KB，仍只有既有的大 chunk 提示。
- `git diff --check`：通过。
- 本轮修改保持无 BOM UTF-8，中文抽样正常。

## 2026-07-21 API 测试与生命周期补强

### TDD 修复

- 新增“断线重连后恢复活动订阅”测试，先复现新 socket 不发送 `.start` 的失败，再让订阅记录保留原始参数，并只在非首次连接成功时重放注册。
- 新增“首次 socket 打开前 dispose”测试，先复现调用 Promise 永久 pending 的超时，再区分连接前关闭与已建立连接断线，使前者立即 reject。
- `.start` 是流注册控制请求，其响应不再误用推送 payload schema 校验；真正的推送数据仍在通知分发时逐条校验。

### 补充覆盖

- HTTP transport：覆盖非法 JSON-RPC envelope 和方法 result schema 不匹配。
- MockTransport：覆盖调用结果校验、initialBatch、sampleBatch、坏样本隔离与 unsubscribe 停止定时器。
- Runtime endpoint：覆盖允许的相对路径/HTTP(S)/WS(S)、危险 scheme 拒绝、路径拼接和 HTTP 到 WebSocket 协议转换。
- 通信层测试由 8 条增加到 17 条；项目总测试由 19 条增加到 28 条。

### 注释补充

- MockTransport 新增异步边界、schema 一致性、初始历史顺序、批次优先级、坏样本隔离和 timer 所有权说明。
- Runtime config 新增部署输入信任边界、无缓存加载和配置失败时原子回退默认值的说明。
- WebSocket transport 新增订阅恢复、控制请求响应和连接前关闭处理说明。

### 验证

- `pnpm typecheck`：通过。
- `pnpm lint`：通过，0 error、0 warning。
- `pnpm test`：5 个测试文件、28 条用例全部通过。
- `pnpm build`：通过；主入口 307.79 KB，ECharts chunk 703.20 KB，仍只有既有的大 chunk 提示。

## 2026-07-21 服务器指标分项弹窗

### 数据契约

- `ServerMetrics` 新增可选 `cpuCores`、`networkInterfaces`、`disks` 分项；字段默认空数组，旧 Agent 只上报汇总数据时仍可正常解析和展示。
- CPU 总占用定义为全部逻辑核心平均值；网络收发总计为网卡分项之和；磁盘容量与 IO 总计为块设备分项之和。
- Mock telemetry 为 x86_64 节点生成 4 个逻辑核心、为 arm64 节点生成 8 个逻辑核心，并提供 `eth0`、`wg0`、`/dev/vda1`、`/dev/vdb1` 明细。

### 交互

- CPU 弹窗增加“趋势 / 核心明细”，固定显示“全部 CPU”总计行，再列出 `CPU 0...n`。
- 网络总流量、网络上行和网络下行弹窗增加“趋势 / 网卡明细”，展示全部网卡总计及各接口下行、上行、合计。
- 磁盘 IO 卡改为整卡可点击；弹窗增加“趋势 / 硬盘明细”，展示全部硬盘及各设备的挂载点、容量、读速和写速。
- 当真实 Agent 未提供分项时，趋势仍正常显示，明细标签页明确提示仅有汇总数据，不生成虚假设备名称。

### 验证

- `pnpm typecheck`：通过。
- `pnpm lint`：通过，0 error、0 warning。
- `pnpm test`：5 个测试文件、30 条用例全部通过；新增旧 Agent 兼容和 mock 分项严格加总测试。
- `pnpm build`：通过；服务器详情路由 chunk 30.32 KB，ECharts chunk 703.20 KB，仍只有既有的大 chunk 提示。
- Playwright：1440x1000 与 390x844 两个视口均完成 CPU、磁盘、网络弹窗点击和分项标签切换；总计与分项可见，HTTP 200，无 console/page error、无页面横向溢出。

## 2026-07-21 分项折线图更新

> 本节覆盖上一节中“分项明细为当前快照表格”的交互描述；数据契约与兼容策略保持不变。

### 本次调整

- 新增通用 `metricBreakdownOption`，统一提供时间轴、tooltip、百分比/速率纵轴、滚动图例、系列聚焦和缺失采样断点。
- `useServerDetailSeries` 按设备名称将每次监控采样对齐到共享时间轴；设备中途缺报使用 `null`，不会显示为错误的 0。
- CPU 核心明细改为每个逻辑核心一条折线，图例为 `CPU 0...n`。
- 网络总流量、上行、下行明细改为每张网卡一条折线，图例为接口名称。
- 磁盘明细改为每块设备的读速与写速分别一条折线；图例包含设备名称和方向，过长时由 ECharts 分页。
- 弹窗标题仍显示实时汇总值；分项标签页专注设备历史与图例，不再重复展示快照表。

### 验证

- `pnpm typecheck`：通过。
- `pnpm lint`：通过，0 error、0 warning。
- `pnpm test`：5 个测试文件、30 条用例全部通过。
- `pnpm build`：通过；服务器详情路由 chunk 29.47 KB，ECharts chunk 703.20 KB，仍只有既有的大 chunk 提示。
- Playwright：1440x1000 与 390x844 均完成 CPU、磁盘、网络分项标签切换；每个弹窗均有一个 320px 高的非零 canvas，HTTP 200，无 console/page error、无页面横向溢出。

## 2026-07-21 监听状态与运维明细补充

### 指标展示

- 磁盘分项折线图将图例固定为两行：上行集中显示各设备“读”，下行集中显示对应设备“写”；设备列顺序保持一致，便于横向配对比较。
- 实时指标网格补齐右下角空单元格，并使用与有数据指标完全相同的 `bg-card` 背景色，避免露出网格底色。
- 服务器详情底部新增 TCP / UDP 连接数趋势和进程列表；桌面端各占一半，移动端按顺序纵向排列。
- 进程列表支持按 CPU、内存和网络吞吐排序，同时保留三项实时数值，避免切换排序后丢失对照信息。

### 数据与监听语义

- `ServerMetrics` 新增可选 `processesEnabled` 与 `processes`；默认关闭并回退为空数组，旧 Agent 未提供进程采样时仍可兼容解析。
- 连接趋势分别服从 `tcpConnectionsEnabled` 与 `udpConnectionsEnabled`；只展示真实启用的协议，不用零值伪造未监听协议的曲线。
- 服务器详情所有图表统一使用“未监听”遮罩。遮罩只由监听能力或采样可用性决定，合法的零值仍按正常图表展示。
- Mock telemetry 增加进程 CPU、内存、上下行网络样本，用于排序和实时刷新验证。

### 验证

- `pnpm typecheck`：通过。
- `pnpm lint`：通过，0 error、0 warning。
- `pnpm test`：5 个测试文件、30 条用例全部通过；通信层定向测试 19 条全部通过。
- `pnpm build`：通过；服务器详情路由 chunk 32.91 KB（gzip 10.52 KB），ECharts chunk 703.20 KB（gzip 235.70 KB），仍只有既有的大 chunk 提示。
- Playwright：1440x1000 下连接趋势与进程列表同排等宽，390x844 下纵向排列；两种视口均无横向溢出。
- Playwright：磁盘读写图例为上下两行且设备顺序对应；CPU、内存、网络排序标签均可切换，网络排序结果随数值变化。
- Playwright：未监听磁盘显示模块级遮罩；连接趋势 canvas 尺寸非零；页面无 console error 或 page error。
- 实时指标空单元格与其余单元格的计算背景色均为 `oklch(1 0 0)`。
