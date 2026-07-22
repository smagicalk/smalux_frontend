# smalux 会话纪要

> 2026-07-22 精简快照。旧文件中的逐轮流水账、过时路由和重复验证已合并到本文件；以下内容是后续会话的权威基线。

## 当前基线

- 工作区：`F:/code/node/smalux_frontend`
- 分支：`vibe-dev`
- 定位：高完成度的“监控 + 运维控制台”前端原型，真实认证、权限和生产后端尚未接通。
- 技术栈：Vite 8、React 19、TypeScript 6、Tailwind CSS v4、TanStack Router / Query、Zustand、Zod、Radix/shadcn、ECharts、uPlot、Vitest、Playwright。
- `/` 重定向到 `/admin`，当前没有公开状态页路由。
- 后台路由共 14 个：总览、服务器、服务器详情、远程执行、计划任务、服务监控、告警、通知、日志、Token/权限、账户、主题、设置、部署。
- Shell 和所有页面均按路由懒加载；桌面使用侧栏，移动端使用底部导航。

## 数据与通信

- `src/shared/api/methods.ts` 是 RPC 契约公共入口，领域 Schema 位于 `src/shared/api/schemas/`。
- 主通道为 WebSocket + JSON-RPC，连接失败时由 HTTP `/rpc` 兜底；服务端业务错误不会被 HTTP fallback 隐藏。
- WebSocket 支持并发建连复用、请求超时、心跳、断线重连、活动订阅重放和 dispose；当前协议没有远端 `.stop` 命令。
- Mock transport 默认启用，数据位于 `src/shared/api/mock/`；RPC 写操作与实时监控共享 mock backend 状态。
- TanStack Query 负责请求缓存和 mutation 失效；Zustand monitoring store 保存高频实时样本，页面使用节流版本号控制聚合刷新。
- 运行时 endpoint 会校验 scheme 和路径，配置加载失败时原子回退默认值。

## 模块职责

- 总览：舰队状态、资源水位、实时趋势、异常队列、事件流和快捷入口。
- 服务器：搜索、状态筛选、实时指标排序、分布图、计费信息、Agent 安装命令和服务器详情。
- 服务器详情：CPU、内存、磁盘、网络、延迟、连接数与进程监控，支持图表放大和设备分项。
- 远程执行：任务下发、风险等级、审批队列、模板和执行日志。
- 计划任务：状态统计、下次执行分布、筛选排序和启停操作。
- 服务监控：目标健康、延迟、协议分布、分组排序和目标管理。
- 告警 / 通知：规则、历史、静默、渠道、投递趋势和成功率。
- 日志 / Token / 账户：审计筛选、Scope、有效期、MFA、Passkey、角色与会话管理。
- 主题 / 设置 / 部署：主题生命周期、运行时配置、交付模式和注入参数。

## 服务器指标契约

- `ServerMetrics` 保留聚合字段，并兼容可选 `cpuCores`、`networkInterfaces`、`disks`、`processes` 分项；旧 Agent 缺少分项时默认空数组。
- CPU 汇总为逻辑核心平均值；网络汇总为网卡之和；磁盘容量和 IO 汇总为设备之和。
- 设备历史按名称对齐共享时间轴，中途缺报使用 `null`，不会伪造成 0。
- TCP、UDP、磁盘 IO、进程列表各自服从监听开关；未监听时显示模块遮罩，合法零值仍正常绘图。
- CPU、网络、磁盘分项弹窗使用折线图；磁盘图例固定为上读下写两行且设备顺序对应。
- 连接数趋势和延迟检测支持手型提示与弹窗；uPlot 迷你图保留绘图区内边距，避免零值线被底边裁切。
- 详情底部连接趋势与进程列表桌面各占一半，移动端纵向排列；进程支持 CPU、内存和网络排序。

## 服务器管理

- 添加服务器只填写名称、备注和标签；区域、IP、系统和架构由 Agent 上报，未上报区域显示“未分组”。
- `Server` 包含可选 `price`、`currency`、`expiresAt`、`billingCycle`，旧响应保持兼容。
- 计费周期支持月付、季付、半年付、年付、二年付、三年付和一次性；30 天内到期或已到期使用危险色。
- `agent.update` 只更新操作员维护的计费字段，不覆盖 Agent 身份和运行状态。
- 安装弹窗按当前 origin 生成脚本与 RPC 默认地址；生成的 `curl | sudo bash` 参数使用 POSIX 单引号安全转义并可复制。

## 视觉基线

- 界面保持高密度、工具化和可扫描，不使用营销型 hero、卡片嵌套或大圆角装饰。
- 全局提供 primary、cyan、violet、magenta、success、warning、danger 语义色，浅色和深色主题均由 CSS token 驱动。
- 15 个页面标题分支全部显式设置模块色：监控偏青、任务与审计偏紫/洋红、告警偏红、部署和账户偏绿、设置偏琥珀。
- `StatTile` 支持完整语义色、淡色面板背景、趋势和进度；页面内继续混合状态色，避免单色主题。
- 服务器页额外区分状态筛选、区域/状态/架构/CPU 分布、CPU/内存/磁盘、计费字段和操作按钮。
- 移动端关闭固定背景和 `backdrop-filter`，使用高不透明度 token 背景，保持视觉层次并降低滚动重绘。

## 图表与性能

- ECharts 使用 `echarts/core` 按需注册 Line、Bar、Pie、Radar、Scatter、Heatmap、Funnel、Gauge 及所需组件；uPlot 负责高频实时折线。
- `EChart` 直接管理 ECharts 实例，不再使用 `echarts-for-react` 运行时包装；ResizeObserver 回调合并到单个 animation frame。
- 路由懒加载保持不变，页面进入时由 Vite 并行预加载动态依赖。
- 本轮 ECharts chunk 从 703.20 KB（gzip 235.70 KB）降到 681.10 KB（gzip 228.18 KB），转换模块从 2787 降到 2773。
- ECharts 仍超过 Vite 默认 500 KB 警戒线；进一步下降需要按图表族拆运行时或替换部分小图，不能通过单纯提高 warning 阈值掩盖。

## 测试与验证

- `src/test/setup.ts` 提供 Vitest / Testing Library 环境。
- 任务 query key 已按筛选条件区分，mutation 仍通过稳定前缀统一失效。
- 通信层覆盖 HTTP/WS/Mock、Schema 错误、fallback、重连、订阅恢复、dispose、URL 安全和服务器计费更新。
- 当前基线：`pnpm typecheck` 通过；`pnpm lint` 0 error、0 warning；`pnpm test` 5 个文件、32 条用例通过；`pnpm build` 通过。
- Playwright 覆盖 14 个路由 × 桌面/移动两个视口，共 28 次访问：无白屏、横向溢出、console error 或 page error。
- 所有图表 canvas 尺寸非零；ECharts 页面均检测到实际绘制像素。
- 当前修改文件保持无 BOM UTF-8，中文抽样正常，`git diff --check` 通过。

## 已知缺口

- 认证、授权、真实用户会话和服务端权限守卫未接入。
- 业务数据仍以 mock 为主，真实 Agent / WebSocket / HTTP 后端需要联调。
- WebSocket 远端取消订阅协议、重连退避上限和更多异常网络测试仍需补充。
- ECharts 共享 chunk 仍偏大；应先测量各路由真实使用的图表类型，再决定拆包边界。
- 当前工作树包含尚未提交的服务器管理、全页面配色和性能优化改动，后续操作不得回滚这些改动。

## 下一步建议

1. 接真实后端前先补认证与权限路由守卫。
2. 增加 WebSocket 重连、订阅停止和坏消息隔离的集成测试。
3. 用构建 manifest 与浏览器性能记录确认 ECharts 按路由的实际下载成本，再按图表族拆分。
4. 真实 Agent 联调时保持“监听关闭、零值、缺失采样”三种状态语义不混用。
