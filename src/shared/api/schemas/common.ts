import { z } from "zod";

/**
 * 服务器在线状态枚举
 * - online: 在线正常（近期有稳定心跳与遥测上报）
 * - warning: 预警状态（高负载或部分探针异常）
 * - offline: 离线失联（超过心跳超时阈值未收到 Agent 上报）
 */
export const serverStatusSchema = z.enum(["online", "warning", "offline"]);
export type ServerStatus = z.infer<typeof serverStatusSchema>;

/**
 * 财务续费与账单周期枚举
 */
export const billingCycleSchema = z.enum([
  "monthly",     // 按月付
  "quarterly",   // 按季付
  "semiannual",  // 半年付
  "yearly",      // 年付
  "biennial",    // 两年付
  "triennial",   // 三年付
  "one_time"     // 一次性买断
]);
export type BillingCycle = z.infer<typeof billingCycleSchema>;

/**
 * 主机服务器基础资产（Server / HostServer）数据契约 Schema
 */
export const serverSchema = z.object({
  /** 主机全局唯一标识 ID（如 "srv-hkg-01"） */
  id: z.string(),
  /** 主机可读名称（如 "香港网关-01", "东京边缘节点"） */
  name: z.string(),
  /** 主机部署地域与机房标识（如 "香港", "Tokyo", "ap-east-1"） */
  region: z.string(),
  /** 节点自定义备注说明信息 */
  note: z.string().optional().default(""),
  /** 当前节点在线连通状态 */
  status: serverStatusSchema,
  /** 是否对外公开展示（用于多租户或访客大盘权限控制） */
  publicVisible: z.boolean().default(true),
  /** 自定义标签与业务分组列表（如 ["核心网关", "BGP Anycast"]） */
  tags: z.array(z.string()).default([]),
  /** 操作系统发行版（如 "Debian 12", "Ubuntu 22.04 LTS"） */
  os: z.string().optional(),
  /** 芯片架构（如 "x86_64", "aarch64", "arm64"） */
  arch: z.string().optional(),
  /** 安装的 Agent 守护进程版本（如 "v2.4.0"） */
  agentVersion: z.string().optional(),
  /** 内网/主网 IPv4 地址 */
  ipv4: z.string().optional(),
  /** 内网/主网 IPv6 地址 */
  ipv6: z.string().optional(),
  /** 是否开启公网 IP 披露展示（若为 false 则前端对公网 IP 进行脱敏/隐藏） */
  publicIpEnabled: z.boolean().default(true),
  /** 公网出口 IPv4 地址 */
  publicIp: z.string().nullable().default(null),
  /** 上一次收到心跳上报的 Unix 时间戳（毫秒） */
  lastSeenAt: z.number().optional(),
  /** 机器单价与成本 */
  price: z.number().nonnegative().nullable().optional(),
  /** 计费币种（如 "USD", "CNY"） */
  currency: z.string().min(1).optional(),
  /** 机器服务到期时间戳（毫秒） */
  expiresAt: z.number().nullable().optional(),
  /** 财务计费结算周期 */
  billingCycle: billingCycleSchema.nullable().optional(),
  /** 是否允许通过控制台下发远程运维命令（远程执行开关） */
  allowRemoteExec: z.boolean().optional(),
  /** 是否启用详细进程快照采集 */
  enableProcessCollection: z.boolean().optional(),
  /**
   * 进程采集模式策略：
   * - enabled: 正常启用实时采样
   * - disable_auto: 禁用自动后台轮询采样（仅允许手动按需触发）
   * - forbidden: 安全策略硬禁用（禁止采集进程）
   */
  processCollectionMode: z.enum(["enabled", "disable_auto", "forbidden"]).optional()
});
export type Server = z.infer<typeof serverSchema>;

/**
 * 逻辑 CPU 核心负载明细
 */
export const cpuCoreMetricSchema = z.object({
  /** 核心序号或名称（如 "CPU 0", "CPU 1"） */
  name: z.string(),
  /** 该核心利用率（0~1 比例） */
  usage: z.number()
});
export type CpuCoreMetric = z.infer<typeof cpuCoreMetricSchema>;

/**
 * 独立网卡网络吞吐明细
 */
export const networkInterfaceMetricSchema = z.object({
  /** 网卡接口名称（如 "eth0", "wg0"） */
  name: z.string(),
  /** 实时下行接收速率（B/s） */
  rxSpeed: z.number(),
  /** 实时上行发送速率（B/s） */
  txSpeed: z.number(),
  /** 累计接收数据量（B） */
  rxTotal: z.number().optional(),
  /** 累计发送数据量（B） */
  txTotal: z.number().optional()
});
export type NetworkInterfaceMetric = z.infer<typeof networkInterfaceMetricSchema>;

/**
 * 独立磁盘挂载卷 I/O 与容量明细
 */
export const diskMetricSchema = z.object({
  /** 设备名称（如 "/dev/vda1"） */
  name: z.string(),
  /** 挂载盘符路径（如 "/", "/data"） */
  mountPoint: z.string(),
  /** 磁盘总容量（字节） */
  total: z.number(),
  /** 已使用容量（字节） */
  used: z.number(),
  /** 瞬时读速率（B/s） */
  readSpeed: z.number().nullable().optional(),
  /** 瞬时写速率（B/s） */
  writeSpeed: z.number().nullable().optional()
});
export type DiskMetric = z.infer<typeof diskMetricSchema>;

/**
 * 进程快照简要信息
 */
export const processMetricSchema = z.object({
  /** 进程 PID */
  pid: z.number(),
  /** 进程名称 */
  name: z.string(),
  /** 瞬时 CPU 占用比例 */
  cpuUsage: z.number().optional(),
  /** 内存占用量（字节） */
  memUsed: z.number().optional(),
  /** 瞬时下行网络速率（B/s） */
  netRxSpeed: z.number().optional(),
  /** 瞬时上行网络速率（B/s） */
  netTxSpeed: z.number().optional()
});
export type ProcessMetric = z.infer<typeof processMetricSchema>;

/**
 * 服务器实时监控遥测数据包（ServerMetrics）数据契约 Schema
 * 
 * 对应 WebSocket `agent.summary.subscribe` 秒级推流报文。
 */
export const serverMetricsSchema = z.object({
  /** 上报主机 ID */
  serverId: z.string(),
  /** 遥测采样时间戳（毫秒） */
  timestamp: z.number().optional().default(0),
  /** 兼容字段：采样时间戳 ts */
  ts: z.number().default(0),
  /** 整体 CPU 利用率（0~1 比例或 0~100 百分比） */
  cpuUsage: z.number(),
  /** 系统总物理内存（字节，Bytes） */
  memTotal: z.number(),
  /** 已使用物理内存（字节，Bytes） */
  memUsed: z.number(),
  /** Swap 交换分区已使用（字节） */
  swapUsed: z.number().optional(),
  /** Swap 交换分区总量（字节） */
  swapTotal: z.number().optional(),
  /** 总磁盘容量（字节，Bytes） */
  diskTotal: z.number().optional().default(0),
  /** 已使用磁盘空间（字节，Bytes） */
  diskUsed: z.number().optional().default(0),
  /** 瞬时网络下行速率（字节/秒，B/s） */
  netRxSpeed: z.number().optional().default(0),
  /** 瞬时网络上行速率（字节/秒，B/s） */
  netTxSpeed: z.number().optional().default(0),
  /** 累计接收流量（字节） */
  netRxTotal: z.number().optional(),
  /** 累计发送流量（字节） */
  netTxTotal: z.number().optional(),
  /** 系统连续运行时长（秒，Uptime） */
  uptime: z.number().optional(),
  /** 1 分钟系统平均负载 */
  loadOne: z.number().optional(),
  /** 5 分钟系统平均负载 */
  loadFive: z.number().optional(),
  /** 15 分钟系统平均负载 */
  loadFifteen: z.number().optional(),
  /** 当前运行的进程总数 */
  processCount: z.number().optional(),
  /** TCP 连接数统计开关 */
  tcpEnabled: z.boolean().optional(),
  /** 活跃 TCP 连接数 */
  tcpConnections: z.number().nullable().optional(),
  /** UDP 连接数统计开关 */
  udpEnabled: z.boolean().optional(),
  /** 活跃 UDP 连接数 */
  udpConnections: z.number().nullable().optional(),
  /** 磁盘 I/O 采集开关 */
  diskIoEnabled: z.boolean().optional(),
  /** 磁盘总 I/O 速率 */
  diskIo: z.object({
    readSpeed: z.number().optional(),
    writeSpeed: z.number().optional()
  }).nullable().optional(),
  /** 各逻辑 CPU 核心负载分解明细 */
  cpuCores: z.array(cpuCoreMetricSchema).default([]),
  /** 各独立网卡流量分解明细 */
  networkInterfaces: z.array(networkInterfaceMetricSchema).default([]),
  /** 各独立磁盘挂载明细 */
  disks: z.array(diskMetricSchema).default([]),
  /** 是否开启了详细进程采集 */
  processesEnabled: z.boolean().default(false),
  /** 活跃进程列表快照 */
  processes: z.array(processMetricSchema).default([])
});

export type ServerMetrics = z.infer<typeof serverMetricsSchema>;

/**
 * 通用成功确认回执响应契约
 */
export const okResultSchema = z.object({
  /** 操作是否成功执行 */
  ok: z.literal(true),
  /** 补充说明或关联实体 ID */
  id: z.string().optional()
});
export type OkResult = z.infer<typeof okResultSchema>;

/**
 * 心跳探测响应契约
 */
export const pingResultSchema = z.object({
  /** 响应类型标头 */
  pong: z.literal(true),
  /** 服务端当前 Unix 时间戳（毫秒） */
  timestamp: z.number()
});
export type PingResult = z.infer<typeof pingResultSchema>;
