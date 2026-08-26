# Smalux 文档索引与架构指南

本文档目录记录 `smalux` 前端的长期设计约束、接口规范与安全审计策略，优先服务后续开发、联调和生产安全评审。

---

## 📚 文档列表

- [架构设计](./architecture.md)：前端领域分层、模块职责、双协议客户端（RESTful HTTP + WebSocket/JSON-RPC 2.0）、状态管理与自动化测试策略。
- [模块设计](./modules.md)：五大高内聚领域划分（总览驾驶舱、基础设施资产、自动化运维、告警中心、系统与安全）。
- [功能路线与特性规范](./features.md)：后台优先的功能域、P0/P1/P2 阶段拆分、多端会话管理、TOTP 双因子与数据容灾。
- [安全设计与审计](./security.md)：多端登录会话下线、TOTP 2FA 防降级、CSRF、WebSocket 安全、主题沙箱隔离、数据备份 AES-256 加密与全流程审计。
- [API 契约与通信协议规范](./api-contracts.md)：RESTful HTTP 接口清单、WebSocket 推送协议、入参出参 Zod Schema 与实体模型。
- [主题系统设计](./theme-system.md)：后台主题定制、公开大盘主题包规范、上传限制与 manifest 沙箱隔离。
- [部署架构设计](./deployment.md)：独立静态 CDN 部署、Nginx 反代分流、Rust Web 单二进制内置与运行时配置。

---

## 🛡️ 核心工程原则

1. **去硬编码与 API Mock 1:1 对齐**：所有业务模块统一由 TanStack Query Hooks 驱动，内置完整的 Mock Engine 保证脱机开发与线上后端无缝切换。
2. **页面只负责 UI 编排**：业务逻辑收敛于 `features/*/hooks` 或 `shared/api`。
3. **双协议协同分工**：80% 业务操作走标准 RESTful HTTP，20% 高频遥测走 WebSocket / JSON-RPC 2.0。
4. **统一设计系统与暗黑美学**：全站使用语义化 CSS Token、Lucide 图标与 Radix UI。
5. **严密安全与审计体系**：高危操作强制流转审批，敏感配置 AEAD 加密，异地冷备与本地存储互斥隔离。
