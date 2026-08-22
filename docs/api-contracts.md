# smalux API 契约与接口文档

本文档定义了 `smalux` 控制台与后端服务通信的唯一事实标准（Single Source of Truth）。
前后端交互采用 **JSON-RPC 2.0 over WebSocket** 为主通道，以 **HTTP POST `/rpc`** 为兜底通道。

---

## 1. 协议基础 (Protocol Foundation)

### 1.1 JSON-RPC 2.0 请求格式
客户端发送的所有 RPC 请求均遵循标准 JSON-RPC 2.0 规范，通过唯一的 `id` 实现连接多路复用：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "agent.list",
  "params": {
    "status": "online"
  }
}
```

### 1.2 成功响应
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "servers": [ ... ],
    "total": 10
  }
}
```

### 1.3 错误响应
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Invalid params: threshold must be positive",
    "data": { ... }
  }
}
```

### 1.4 服务端主动推送通知 (Server-Push Notifications)
对于订阅类通道（如实时遥测、事件流水），服务端主动下发无 `id` 的通知对象：
```json
{
  "jsonrpc": "2.0",
  "method": "agent.summary.subscribe",
  "params": {
    "serverId": "srv-hkg-01",
    "ts": 1774246800000,
    "cpu": 34.2,
    "memory": 58.0,
    "disk": 44.5,
    "tcp": 128,
    "udp": 42
  }
}
```

---

## 2. 核心 RPC 接口清单 (Methods Catalog)

### 2.1 主机与 Agent 管理 (`agent.*`)

| Method | 权限 Scope | 描述 | 入参 (Params) | 返回结果 (Result) |
| :--- | :--- | :--- | :--- | :--- |
| `agent.list` | `agent:read` | 获取服务器集群列表 | `{ region?: string, status?: "online" \| "warning" \| "offline", search?: string }` | `{ servers: Server[], total: number }` |
| `agent.info` | `agent:read` | 获取单个服务器详细元数据 | `{ id: string }` | `Server` 实体 |
| `agent.register` | `agent:write` | 注册新节点并生成接入命令 | `{ name: string, region: string, note?: string, tags?: string[] }` | `{ server: Server, token: string, installScript: string }` |
| `agent.update` | `agent:write` | 更新节点计费与操作员维护字段 | `{ id: string, name?: string, note?: string, price?: number, currency?: string, expiresAt?: number, billingCycle?: string }` | `Server` 实体 |
| `agent.summary.subscribe` | `agent:read` | **订阅实时性能遥测数据流 (1s/Tick)** | `{ serverIds?: string[] }` | *(Stream 推送 `ServerMetrics`)* |
| `agent.ping.subscribe` | `agent:read` | **订阅多节点 RTT 探测延迟流** | `{ serverIds?: string[] }` | *(Stream 推送 `PingSample`)* |
| `agent.ping.history` | `agent:read` | 获取指定时段的历史延迟聚合序列 | `{ serverId: string, range: "1h" \| "6h" \| "24h" \| "7d" }` | `{ serverId: string, range: string, points: [number, number][], intervalMs: number }` |

---

### 2.2 自动化运维与计划任务 (`task.*` / `crontab.*`)

| Method | 权限 Scope | 描述 | 入参 (Params) | 返回结果 (Result) |
| :--- | :--- | :--- | :--- | :--- |
| `task.list` | `task:read` | 获取远程命令执行记录 | `{ limit?: number, offset?: number, search?: string }` | `{ tasks: Task[], total: number }` |
| `task.dispatch` | `task:exec` | 下发远程指令或模板到目标集群 | `{ command: string, serverIds: string[], timeoutSec?: number, riskLevel?: "safe" \| "warning" \| "danger" }` | `{ taskId: string, dispatchedCount: number }` |
| `task.result` | `task:read` | 查询执行任务终端回显与退出码 | `{ taskId: string }` | `Task` 实体 (含 `outputs: Record<string, { stdout: string, stderr: string, exitCode: number }>`) |
| `crontab.list` | `cron:read` | 获取计划任务调度列表 | `{ search?: string, enabled?: boolean }` | `{ crons: CronJob[], total: number }` |
| `crontab.create` | `cron:write` | 创建或编辑计划调度任务 | `{ name: string, expression: string, command: string, serverIds: string[] }` | `CronJob` 实体 |
| `crontab.toggle` | `cron:write` | 启用 / 禁用指定计划任务 | `{ id: string, enabled: boolean }` | `{ id: string, enabled: boolean }` |

---

### 2.3 告警与通知渠道 (`alert.*` / `notification.*`)

| Method | 权限 Scope | 描述 | 入参 (Params) | 返回结果 (Result) |
| :--- | :--- | :--- | :--- | :--- |
| `alert.list` | `alert:read` | 获取告警规则与历史流水 | `{}` | `{ rules: AlertRule[], history: AlertHistory[] }` |
| `alert.create` | `alert:write` | 创建指标阈值告警规则 | `{ name: string, metric: string, operator: ">" \| "<" \| "==" \| "!=", threshold: number, windowSec: number, severity: "info" \| "warning" \| "critical" }` | `AlertRule` 实体 |
| `alert.silence` | `alert:write` | 静默指定告警事件 (1小时/永久) | `{ id: string, silenced: boolean }` | `{ id: string, silenced: boolean }` |
| `notification.channel.list` | `notify:read` | 获取通知推送渠道列表 | `{}` | `{ channels: NotificationChannel[] }` |
| `notification.channel.test` | `notify:write` | 发送连通性测试消息 | `{ channelId: string }` | `{ success: boolean, message: string }` |

---

### 2.4 服务探针与 Ping 监控 (`monitor.service.*`)

| Method | 权限 Scope | 描述 | 入参 (Params) | 返回结果 (Result) |
| :--- | :--- | :--- | :--- | :--- |
| `monitor.service.list` | `ping:read` | 获取 HTTP/TCP/ICMP 探测目标与 24h SLA | `{}` | `{ targets: PingTarget[], total: number }` |
| `monitor.service.probe` | `ping:write` | 立即触发全网探活探测 | `{ targetId?: string }` | `{ results: Array<{ targetId: string, latency: number, statusCode?: number, ok: boolean }> }` |

---

### 2.5 审计日志与系统安全 (`log.*` / `token.*` / `config.*`)

| Method | 权限 Scope | 描述 | 入参 (Params) | 返回结果 (Result) |
| :--- | :--- | :--- | :--- | :--- |
| `log.list` | `log:read` | 获取全局操作与登录审计流水 | `{ limit?: number, module?: string, search?: string }` | `{ logs: AuditLog[], total: number }` |
| `token.list` | `token:manage` | 获取 API Token 密钥列表 | `{}` | `{ tokens: ApiToken[], total: number }` |
| `token.create` | `token:manage` | 创建指定 Scope 的 API Token | `{ name: string, scopes: string[], expiresDays?: number }` | `{ token: ApiToken, secret: string }` |
| `config.read` | `config:read` | 读取运行时系统参数 | `{}` | `SystemConfig` 实体 |
| `config.edit` | `config:write` | 更新运行时系统配置 | `{ appName?: string, theme?: string }` | `SystemConfig` 实体 |

---

## 3. 核心实体模型定义 (Domain Entity Schemas)

### 3.1 Server 实体
```typescript
interface Server {
  id: string;                      // 唯一节点 ID (如 srv-hkg-01)
  name: string;                    // 节点名称 (如 hk-gateway-01)
  region: string;                  // 物理区域 (如 香港, 新加坡)
  status: "online" | "warning" | "offline"; // 运行状态
  os: string;                      // 操作系统 (如 Debian 12, Ubuntu 22.04)
  arch: string;                    // 架构 (如 x86_64, arm64)
  ipv4: string;                    // 内网/上报 IPv4
  publicIp?: string | null;        // 公开展示 IP
  price?: number;                  // 费用
  currency?: string;               // 币种 (如 CNY, USD)
  expiresAt?: number;              // 到期时间戳
  billingCycle?: "monthly" | "quarterly" | "semi-annual" | "annual" | "biennial" | "triennial" | "one-time";
  lastSeenAt: number;              // 最后心跳时间戳
}
```

### 3.2 ServerMetrics 实时遥测实体
```typescript
interface ServerMetrics {
  serverId: string;
  ts: number;                      // 采样毫秒时间戳
  cpu: number;                     // 0..100 CPU 利用率
  memory: number;                  // 0..100 内存使用率
  disk: number;                    // 0..100 磁盘使用率
  tcp: number;                     // TCP 活动连接数
  udp: number;                     // UDP 活动连接数
  networkInBytes?: number;         // 网卡入站流量 (Bytes/s)
  networkOutBytes?: number;        // 网卡出站流量 (Bytes/s)
  diskReadBytes?: number;          // 磁盘读取速度 (Bytes/s)
  diskWriteBytes?: number;         // 磁盘写入速度 (Bytes/s)
}
```
