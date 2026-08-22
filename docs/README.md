# smalux 文档索引

本文档目录记录 `smalux` 前端的长期设计约束，优先服务后续开发、联调和安全评审。

## 文档列表

- [架构设计](./architecture.md)：前端分层、模块职责、协议客户端、状态和测试策略。
- [模块设计](./modules.md)：通知、服务器、远程执行、Ping、账户、日志、主题和设置模块边界。
- [功能路线](./features.md)：后台优先的功能域、P0/P1/P2 阶段拆分和复用要求。
- [安全设计](./security.md)：认证、CSRF、WebSocket、主题上传、Agent、审计和安全响应头。
- [API 契约文档](./api-contracts.md)：JSON-RPC 2.0 接口清单、WebSocket 推送协议、入参出参 Zod Schema 与实体模型。
- [主题系统](./theme-system.md)：后台主题、公开主题包、上传设置参数和 manifest。
- [部署设计](./deployment.md)：独立静态部署、Nginx 部署、Rust Web 内置和运行时配置。

## 当前原则

- 后台先做，公开主页最后打磨。
- 页面只负责编排，业务逻辑进入 feature/model 或 shared/api。
- 所有后端交互都通过 HTTP、WebSocket、JSON-RPC 客户端封装。
- 主题、图表、状态色全部使用 CSS variables 和语义 token。
- 移动端必须有独立导航和适合小屏的数据展示形态。
- 安全设计不能只靠前端，需要后端、部署层和 Agent 通道共同实现。
