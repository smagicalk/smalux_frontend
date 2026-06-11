# 安全设计

## 安全目标

`smalux` 是监控类系统，后台入口、Agent 通道、主题上传和通知配置都属于高价值目标。安全设计目标是：

- 后台会话不暴露长期 token。
- 写操作防 CSRF。
- WebSocket 不被跨站滥用。
- 主题上传不影响后台安全。
- Agent 上报防伪造、防重放。
- 敏感配置不明文存储。
- 危险操作可审计、可追踪。

## 认证

推荐方案：

- HttpOnly Cookie。
- Secure。
- SameSite。
- 短会话。
- refresh rotation。
- 管理员 MFA / Passkey。

Cookie 建议：

```txt
__Host-smalux_session
```

前端要求：

- 不把长期 token 存入 localStorage。
- 启动时调用 `/api/auth/session` 获取会话状态。
- 权限守卫在路由层和服务端同时实现。

## CSRF

适用范围：

- 创建节点。
- 删除节点。
- 创建/吊销 Token。
- 修改告警。
- 上传主题。
- 启用主题。
- 修改系统设置。

设计：

- 写操作携带 CSRF token。
- SameSite Cookie 只是辅助。
- 服务端校验 token、Origin、Referer。
- JSON-RPC 写 method 也必须走 CSRF 或等效机制。

## WebSocket

用途：

- 实时监控数据。
- 节点状态。
- 事件流。
- 终端或任务执行。

要求：

- 生产只允许 WSS。
- 校验 Origin。
- 使用 Cookie 会话或一次性 WS ticket。
- 连接建立后做订阅级权限判断。
- 心跳和超时断开。
- 消息体使用 schema 校验。
- 限制订阅数量和消息大小。

前端要求：

- WS 数据进入 store。
- 批量更新和节流。
- 不让单条消息触发整页重渲染。

## JSON-RPC

适用：

- 刷新节点。
- 测试通知。
- 批量操作。
- 任务执行。
- 危险命令。

要求：

- 每个 method 独立鉴权。
- 限制 batch 大小。
- 写 method 记录审计。
- 危险 method 需要二次确认。
- 响应使用 Zod 校验。

## 远程执行安全

远程执行是高风险模块，不能只做前端按钮。

要求：

- 每次执行必须写审计日志。
- 直接执行需要二次确认。
- 高风险命令需要审批或更高权限。
- 定时执行需要记录创建人、修改人、启用人。
- 执行目标必须展示影响范围。
- 输出日志需要脱敏。
- 超时时间、最大并发、重试次数必须有限制。
- 禁止未授权用户查看敏感输出。

建议：

- 命令模板由管理员维护。
- Operator 只能使用授权模板。
- Viewer 只能查看允许范围内的执行结果。

## 主题上传

风险：

主题包可能包含 HTML、CSS、JS，本质上是上传可执行前端代码。

服务端校验：

- 限制 zip 大小。
- 禁止路径穿越。
- 禁止绝对路径。
- 必须包含 manifest。
- 必须包含 `dist/index.html`。
- 限制文件类型。
- 解压到独立目录。
- 支持预览、启用、回滚、删除。

隔离要求：

- 公开主题页面不携带后台 Cookie。
- 公开主题只能访问公开 API。
- 后台和公开主题使用不同 CSP。

系统设置必须包含上传限制：

- 最大 zip 大小。
- 最大解压后大小。
- 最大文件数量。
- 允许文件类型。
- 是否允许脚本。
- 是否要求预览图。
- 最大主题数量。

## Agent 通道

注册：

- 注册 token 一次性使用。
- 创建后只展示一次。
- 服务端只存 hash 或加密密文。

上报：

- HMAC-SHA256。
- timestamp。
- nonce。
- 防重放窗口。
- 服务端校验时钟偏差。

运维：

- 支持密钥轮换。
- 支持吊销 Agent。
- 高安全环境可选 mTLS。

远程执行和 Agent 通道关系：

- Agent 必须验证任务签名。
- Agent 需要回传执行状态。
- Agent 输出不能直接信任，服务端仍需校验消息格式。
- Agent 离线时定时任务应进入失败或待执行状态，由后端策略决定。

## Ping 与通知外联安全

Ping 目标和通知 Webhook 都可能造成 SSRF 风险。

要求：

- 服务端校验目标 URL。
- 可配置是否允许内网地址。
- 限制请求方法。
- 限制重定向。
- 限制探测频率。
- 限制通知重试。
- 敏感 token 加密存储。

## 敏感配置

敏感项：

- Webhook token。
- SMTP 密码。
- Agent secret。
- 第三方集成密钥。
- 主题仓库 token。

存储：

- 密码使用 Argon2id。
- 可逆敏感配置使用 AEAD 加密。
- 密文记录 key version。
- 主密钥来自环境变量、KMS 或外部 secret manager。

## 安全响应头

后台建议：

```txt
Content-Security-Policy
Strict-Transport-Security
X-Content-Type-Options: nosniff
Referrer-Policy
Permissions-Policy
```

公开主题建议：

- CSP 更严格。
- 不允许访问后台 API。
- 不共享后台 Cookie。

## 审计

必须记录：

- 操作人。
- 操作时间。
- IP。
- User-Agent。
- 操作类型。
- 目标资源。
- 成功/失败。
- 失败原因。

审计事件：

- 登录、登出。
- MFA 变更。
- Token 创建/吊销。
- Agent 密钥轮换。
- 主题上传/启用/删除。
- 告警规则修改。
- 节点删除。
- 系统设置修改。
