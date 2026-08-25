import { z } from "zod";
import {
  billingCycleSchema,
  serverMetricsSchema,
  serverSchema,
  serverStatusSchema
} from "./common";

/**
 * 主机列表筛选与分页入参契约
 */
export const agentListParamsSchema = z
  .object({
    /** 部署地域筛选（如 "香港", "Tokyo"） */
    region: z.string().optional(),
    /** 运行状态筛选（online / warning / offline） */
    status: serverStatusSchema.optional(),
    /** 模糊搜索关键词（匹配主机名、IP、标签、地域） */
    search: z.string().optional(),
    /** 业务分组筛选 */
    group: z.string().optional(),
    /** 当前请求页码（从 1 开始） */
    page: z.number().optional(),
    /** 每页条数（如 12） */
    limit: z.number().optional(),
    /** 排序依据字段 */
    sortBy: z.string().optional(),
    /** 排序方向（asc 升序, desc 降序） */
    sortOrder: z.enum(["asc", "desc"]).optional()
  })
  .default({});

/**
 * 主机列表查询响应契约
 */
export const agentListResultSchema = z.object({
  /** 主机服务器数组 */
  servers: z.array(serverSchema),
  /** 匹配的主机总数 */
  total: z.number(),
  /** 当前页码 */
  page: z.number().optional(),
  /** 每页条数 */
  limit: z.number().optional(),
  /** 计算出的总页数 */
  totalPages: z.number().optional(),
  /** 全集群已存在的分组及节点数量统计 */
  availableGroups: z.array(z.object({ group: z.string(), count: z.number() })).optional()
});

export type AgentListParams = z.infer<typeof agentListParamsSchema>;
export type AgentListResult = z.infer<typeof agentListResultSchema>;

/**
 * 实时监控指标推流订阅入参契约
 */
export const agentSummarySubscribeParamsSchema = z
  .object({
    /** 需要订阅的目标主机 ID 列表（留空表示全量订阅） */
    serverIds: z.array(z.string()).optional()
  })
  .default({});

export const agentSummarySampleSchema = serverMetricsSchema;

/**
 * 实时网络拨测订阅入参契约
 */
export const agentPingSubscribeParamsSchema = z
  .object({
    /** 需要订阅的目标主机 ID 列表 */
    serverIds: z.array(z.string()).optional()
  })
  .default({});

/**
 * 单个拨测探针往返延迟数据
 */
export const pingProbeSchema = z.object({
  /** 探测目标名称或地址 */
  target: z.string(),
  /** 往返时延（毫秒，超时则为 null） */
  latencyMs: z.number().nullable()
});
export type PingProbe = z.infer<typeof pingProbeSchema>;

/**
 * 单台主机秒级网络拨测采样快照
 */
export const pingSampleSchema = z.object({
  /** 上报主机 ID */
  serverId: z.string(),
  /** 采样时间戳（毫秒） */
  ts: z.number(),
  /** 包含的所有探针点延迟列表 */
  probes: z.array(pingProbeSchema)
});
export type PingSample = z.infer<typeof pingSampleSchema>;

/**
 * 历史网络拨测查询时间窗口
 */
export const pingHistoryRangeSchema = z.enum(["1h", "6h", "24h", "7d"]);
export type PingHistoryRange = z.infer<typeof pingHistoryRangeSchema>;

/**
 * 历史网络拨测入参契约
 */
export const pingHistoryParamsSchema = z.object({
  /** 主机 ID */
  serverId: z.string(),
  /** 时间跨度 */
  range: pingHistoryRangeSchema
});

/**
 * 历史网络拨测响应契约
 */
export const pingHistoryResultSchema = z.object({
  /** 主机 ID */
  serverId: z.string(),
  /** 查询的时间范围 */
  range: pingHistoryRangeSchema,
  /** 降采样桶聚合步长（毫秒） */
  intervalMs: z.number(),
  /** 降采样后的历史采样点序列 */
  samples: z.array(pingSampleSchema)
});
export type PingHistoryResult = z.infer<typeof pingHistoryResultSchema>;

/**
 * 注册新主机 Agent 入参契约
 */
export const agentRegisterParamsSchema = z.object({
  /** 主机名称 */
  name: z.string().trim().min(1),
  /** 地域信息 */
  region: z.string().trim().min(1).optional(),
  /** 备注说明 */
  note: z.string().optional(),
  /** 是否公开可见 */
  publicVisible: z.boolean().optional(),
  /** 标签列表 */
  tags: z.array(z.string()).optional(),
  /** IP 地址 */
  ipv4: z.string().optional(),
  /** 操作系统 */
  os: z.string().optional(),
  /** 架构 */
  arch: z.string().optional()
});
export type AgentRegisterParams = z.infer<typeof agentRegisterParamsSchema>;

/**
 * 更新主机财务与续费信息入参契约
 */
export const agentUpdateParamsSchema = z.object({
  /** 主机 ID */
  serverId: z.string(),
  /** 单价 */
  price: z.number().nonnegative().nullable(),
  /** 计费币种 */
  currency: z.string().trim().min(1),
  /** 到期时间戳（毫秒） */
  expiresAt: z.number().nullable(),
  /** 续费周期 */
  billingCycle: billingCycleSchema.nullable()
});
export type AgentUpdateParams = z.infer<typeof agentUpdateParamsSchema>;

/**
 * 查询单机硬件与内核规格入参契约
 */
export const agentHardwareParamsSchema = z.object({
  /** 目标主机 ID */
  serverId: z.string()
});
export type AgentHardwareParams = z.infer<typeof agentHardwareParamsSchema>;

/**
 * 服务器硬件与 Linux 内核环境详情响应契约
 */
export const agentHardwareResultSchema = z.object({
  /** 主机 ID */
  serverId: z.string(),
  /** CPU 物理型号（如 "AMD EPYC 7763 64-Core"） */
  cpuModel: z.string(),
  /** 物理/逻辑核心数（如 16） */
  cpuCores: z.number(),
  /** CPU 指令集架构（如 "x86_64"） */
  cpuArch: z.string(),
  /** CPU 特性指令集（如 ["AVX2", "AES-NI", "SSE4.2"]） */
  cpuFeatures: z.array(z.string()).default([]),
  
  /** 物理内存总量（GB） */
  memTotalGb: z.number(),
  /** 内存代际（如 "DDR4 ECC", "DDR5"） */
  memType: z.string(),
  /** 内存运行频率（如 "3200 MHz"） */
  memSpeed: z.string().optional(),
  
  /** 物理磁盘总容量（GB） */
  diskTotalGb: z.number(),
  /** 磁盘介质类型（如 "NVMe PCIe 4.0 SSD", "SATA SSD"） */
  diskType: z.string(),
  /** 存储总线接口 */
  diskInterface: z.string().optional(),
  
  /** 操作系统发行版 */
  os: z.string(),
  /** Linux 内核版本号（如 "6.8.0-generic"） */
  kernelVersion: z.string(),
  /** 内核网络与系统特性（如 ["BBR v3", "eBPF", "io_uring"]） */
  kernelFeatures: z.array(z.string()).default([]),
  
  /** 虚拟化架构（如 "KVM", "Bare Metal 裸金属", "VMware"） */
  virtSystem: z.string(),
  /** 连续运行时长字符串（如 "48天 12小时"） */
  uptime: z.string(),
  /** 平均负载字符串 */
  load: z.string(),
  /** 运行中的 Agent 守护进程版本 */
  agentVersion: z.string(),
  /** 采样校验时间戳（毫秒） */
  lastCheckedAt: z.number().optional()
});
export type AgentHardwareResult = z.infer<typeof agentHardwareResultSchema>;

/**
 * 即时抓取单机进程快照入参契约
 */
export const agentSampleProcessesParamsSchema = z.object({
  /** 目标主机 ID */
  serverId: z.string()
});
export type AgentSampleProcessesParams = z.infer<typeof agentSampleProcessesParamsSchema>;

/**
 * 即时抓取进程快照响应契约
 */
export const agentSampleProcessesResultSchema = z.object({
  /** 是否成功下发抓取 */
  ok: z.boolean(),
  /** 快照时间戳 */
  timestamp: z.string().optional(),
  /** 报错信息（若有） */
  error: z.string().optional(),
  /** 进程采集模式 */
  mode: z.enum(["enabled", "disable_auto", "forbidden"]).optional()
});
export type AgentSampleProcessesResult = z.infer<typeof agentSampleProcessesResultSchema>;

/**
 * 主机连接状态与探针健康度入参契约
 */
export const agentStatusParamsSchema = z.object({ serverId: z.string() });
export type AgentStatusParams = z.infer<typeof agentStatusParamsSchema>;

/**
 * 主机连接状态与探针健康度响应契约
 */
export const agentStatusResultSchema = z.object({
  /** 连接状态（online / warning / offline） */
  status: z.enum(["online", "warning", "offline"]),
  /** 状态文案（如 "正常连接"） */
  statusText: z.string(),
  /** 状态徽章文案 */
  badgeText: z.string(),
  /** 辅助说明文案 */
  subtitle: z.string(),
  /** 通信协议（如 "TLS / WebSocket"） */
  protocol: z.string(),
  /** 协议详细握手信息 */
  protocolDetail: z.string(),
  /** 实时通信往返时延（毫秒） */
  latencyMs: z.number(),
  /** 延迟抖动（毫秒，Jitter） */
  jitterMs: z.number(),
  /** 丢包率字符串（如 "0.0%"） */
  lossRate: z.string(),
  /** 链路连接质量等级（如 "极佳", "良好"） */
  quality: z.string(),
  /** 心跳上报频率 */
  interval: z.string(),
  /** 最近一次心跳时间（如 "1 秒前"） */
  lastPing: z.string(),
  /** Agent 自身 CPU 占用（如 "0.2%"） */
  cpuUsage: z.string(),
  /** Agent 自身常驻物理内存占用（如 "14.2 MB"） */
  memRss: z.string(),
  /** Agent 当前版本号 */
  version: z.string(),
  /** 是否为最新版本 */
  isLatest: z.boolean(),
  /** 是否允许远程执行命令 */
  allowRemoteExec: z.boolean(),
  /** Agent 守护进程操作系统 PID */
  pid: z.number()
});
export type AgentStatusResult = z.infer<typeof agentStatusResultSchema>;

/**
 * 单机详细网络配置与 BGP 状态入参契约
 */
export const agentNetworkDetailsParamsSchema = z.object({ serverId: z.string() });
export type AgentNetworkDetailsParams = z.infer<typeof agentNetworkDetailsParamsSchema>;

/**
 * 单机详细网络配置与 BGP 状态响应契约
 */
export const agentNetworkDetailsResultSchema = z.object({
  /** 是否分配了 IPv4 */
  hasIpv4: z.boolean(),
  /** 是否分配了 IPv6 */
  hasIpv6: z.boolean(),
  /** 是否为 IPv4/IPv6 双栈网络 */
  isDualStack: z.boolean(),
  /** 主 IPv4 地址 */
  ipv4: z.string(),
  /** 默认 IPv4 网关 */
  ipv4Gateway: z.string(),
  /** 子网掩码 */
  ipv4Mask: z.string(),
  /** 出口 ASN 自治域编号（如 "AS13335"） */
  ipv4Asn: z.string(),
  /** 出口网络运营商/ISP（如 "Cloudflare, Inc."） */
  ipv4Isp: z.string(),
  /** 最大传输单元（MTU，如 1500） */
  ipv4Mtu: z.number(),
  /** 主 IPv6 地址 */
  ipv6: z.string(),
  /** 默认 IPv6 网关 */
  ipv6Gateway: z.string(),
  /** IPv6 前缀掩码长度（如 "/64"） */
  ipv6Prefix: z.string(),
  /** IPv6 作用域 */
  ipv6Scope: z.string(),
  /** IPv6 分配方式（如 "SLAAC / Static"） */
  ipv6Allocation: z.string(),
  /** 主物理网卡名称（如 "eth0"） */
  nicName: z.string(),
  /** 物理网卡芯片型号（如 "Intel I210 Gigabit"） */
  nicModel: z.string(),
  /** 物理网卡协商速率（如 "10 Gbps"） */
  nicSpeed: z.string(),
  /** 网卡硬件 MAC 地址 */
  nicMac: z.string(),
  /** 网卡双工模式（如 "Full Duplex"） */
  nicDuplex: z.string(),
  /** 累计接收数据量字符串（如 "1.24 TB"） */
  nicRxBytes: z.string(),
  /** 累计发送数据量字符串（如 "890 GB"） */
  nicTxBytes: z.string(),
  /** 累计接收数据包总数 */
  nicRxPackets: z.number(),
  /** 累计发送数据包总数 */
  nicTxPackets: z.number(),
  /** 上游 DNS 解析服务器列表 */
  dnsServers: z.array(z.string()),
  /** 当前 ESTABLISHED 活跃 TCP 连接数 */
  tcpEstablished: z.number(),
  /** 当前 TIME_WAIT 状态 TCP 连接数 */
  tcpTimeWait: z.number(),
  /** 当前 SYN_RECV 半开连接数 */
  tcpSynRecv: z.number(),
  /** 已建立连接的 BGP 对等体数量 */
  bgpPeers: z.number(),
  /** BGP 协议运行状态 */
  bgpStatus: z.string()
});
export type AgentNetworkDetailsResult = z.infer<typeof agentNetworkDetailsResultSchema>;

/**
 * 多地域网络延迟探测入参契约
 */
export const agentProbeRegionsParamsSchema = z.object({ serverId: z.string() });
export type AgentProbeRegionsParams = z.infer<typeof agentProbeRegionsParamsSchema>;

/**
 * 全球各探测节点往返数据
 */
export const globalProbeRegionSchema = z.object({
  /** 探测点 ID */
  id: z.string(),
  /** 探测点城市名称（如 "中国香港", "日本东京", "美国硅谷"） */
  name: z.string(),
  /** 探测目标网络地址 */
  target: z.string(),
  /** 标识颜色代码 */
  color: z.string(),
  /** 基准网络延迟（毫秒） */
  baseLatency: z.number(),
  /** 实时往返时延（毫秒） */
  currentLatency: z.number(),
  /** 延迟抖动（毫秒） */
  jitter: z.number(),
  /** 丢包率字符串 */
  loss: z.string(),
  /** 链路状态（up: 优良, degraded: 劣化, down: 中断） */
  status: z.enum(["up", "degraded", "down"]),
  /** 骨干网运营商 */
  isp: z.string(),
  /** 区域简称代码（如 "HK", "TYO", "SJC"） */
  regionCode: z.string()
});
export type GlobalProbeRegion = z.infer<typeof globalProbeRegionSchema>;

/**
 * 全球多地域探测结果列表响应契约
 */
export const agentProbeRegionsResultSchema = z.object({
  /** 各地域探测数据数组 */
  regions: z.array(globalProbeRegionSchema)
});
export type AgentProbeRegionsResult = z.infer<typeof agentProbeRegionsResultSchema>;

/**
 * 单机全量配置表单数据入参契约
 */
export const agentGetConfigParamsSchema = z.object({ serverId: z.string() });
export type AgentGetConfigParams = z.infer<typeof agentGetConfigParamsSchema>;

/**
 * 关联绑定的通知渠道简要配置
 */
const notifyChannelConfigSchema = z.object({
  /** 渠道 ID */
  id: z.string(),
  /** 渠道名称 */
  name: z.string(),
  /** 渠道类型 */
  type: z.string(),
  /** 推送目标地址 */
  target: z.string().optional(),
  /** 是否启用 */
  enabled: z.boolean()
});

/**
 * 单机服务器全量运维配置响应契约
 */
export const agentServerConfigResultSchema = z.object({
  /** 主机可读名称 */
  name: z.string(),
  /** 分组列表 */
  groups: z.array(z.string()),
  /** 标签列表 */
  tags: z.array(z.string()),
  /** 是否开启自动识别地理位置 */
  autoLocation: z.boolean(),
  /** 手动指定的地理位置机房名称 */
  location: z.string(),
  /** 每月流量配额限制数值 */
  trafficLimitValue: z.number(),
  /** 流量配额单位（MB / GB / TB / PB） */
  trafficLimitUnit: z.enum(["MB", "GB", "TB", "PB"]),
  /** 换算后的月度流量配额总量（GB） */
  trafficLimitGb: z.number(),
  /**
   * 流量计费计算模式：
   * - outbound: 仅计出网流量
   * - inbound: 仅计入网流量
   * - both: 双向流量合并累计
   * - max: 取出入网单向最大值
   */
  trafficCalculation: z.enum(["outbound", "both", "inbound", "max"]),
  /** 每月流量重置清零日（1~31） */
  trafficResetDay: z.number(),
  /** 是否对外公开展示 */
  publicVisible: z.boolean(),
  /** 是否处于维护中模式 */
  maintenanceMode: z.boolean(),
  /** 机器成本金额 */
  price: z.number(),
  /** 币种 */
  currency: z.string(),
  /** 计费周期 */
  billingCycle: z.string(),
  /** 到期时间字符串 */
  expiresAt: z.string(),
  /** 到期是否自动续费 */
  autoRenew: z.boolean(),
  /** 备注说明 */
  note: z.string(),
  /** CPU 告警阈值（百分比） */
  cpuThreshold: z.number(),
  /** CPU 告警判定持续时间（秒） */
  cpuDurationSec: z.number(),
  /** 内存告警阈值（百分比） */
  memThreshold: z.number(),
  /** 内存告警判定持续时间（秒） */
  memDurationSec: z.number(),
  /** 磁盘告警阈值（百分比） */
  diskThreshold: z.number(),
  /** 磁盘告警判定持续时间（秒） */
  diskDurationSec: z.number(),
  /** 网络带宽超标阈值（MB/s） */
  netThresholdMb: z.number().optional(),
  /** 判定节点失联离线的超时阈值（秒） */
  offlineTimeoutSec: z.number(),
  /** 是否开启阈值报警外发通知 */
  enableNotify: z.boolean(),
  /** 关联绑定的报警通知推送渠道列表 */
  notifyChannels: z.array(notifyChannelConfigSchema),
  /** Agent 接入认证 Token */
  agentToken: z.string(),
  /** 是否允许控制台远程执行命令 */
  allowRemoteExec: z.boolean()
});
export type AgentServerConfigResult = z.infer<typeof agentServerConfigResultSchema>;

/**
 * 保存修改单机服务器全量配置入参契约
 */
export const agentUpdateConfigParamsSchema = agentServerConfigResultSchema.extend({
  /** 目标主机 ID */
  serverId: z.string()
});
export type AgentUpdateConfigParams = z.infer<typeof agentUpdateConfigParamsSchema>;

/**
 * 下线注销并删除主机入参契约
 */
export const agentDecommissionParamsSchema = z.object({
  /** 待下线主机 ID */
  serverId: z.string()
});
export type AgentDecommissionParams = z.infer<typeof agentDecommissionParamsSchema>;
