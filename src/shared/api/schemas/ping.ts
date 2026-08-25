import { z } from "zod";

/**
 * 网络拨测探针支持的检测协议类型
 * - http: HTTP/HTTPS 状态码及可用性检测
 * - tcp: TCP 端口握手连通性与延迟检测
 * - icmp: ICMP Ping 丢包率与网络延迟探测
 * - wss: WebSocket 双向握手与延迟检测
 */
export const pingProtocolSchema = z.enum(["http", "tcp", "icmp", "wss"]);
export type PingProtocol = z.infer<typeof pingProtocolSchema>;

/**
 * 网络拨测监控目标（Ping Target）数据契约 Schema
 */
export const pingTargetSchema = z.object({
  /** 拨测目标唯一 ID */
  id: z.string(),
  /** 目标显示名称（如 "公网 DNS 8.8.8.8", "核心 API 网关"） */
  name: z.string(),
  /** 目标探测网络地址（IP、域名或 URL） */
  address: z.string(),
  /** 探测协议类型 */
  protocol: pingProtocolSchema,
  /**
   * 探测目标业务分组：
   * - public: 公网公共服务
   * - control: 控制面服务
   * - notify: 通知网关
   * - private: 内网私有服务
   */
  group: z.enum(["public", "control", "notify", "private"]),
  /** 是否启用该探测探针 */
  enabled: z.boolean(),
  /** 实时探测往返延迟（毫秒，RTT Latency） */
  latencyMs: z.number().optional(),
  /** 过去 24 小时服务可用率 SLA（0.0 ~ 1.0，如 0.999 表示 99.9%） */
  uptime: z.number().optional(),
  /** 上一次探测采样的 Unix 时间戳（毫秒） */
  lastCheckAt: z.number().optional(),
  /** 上一次探测结果是否正常通过 */
  lastOk: z.boolean().optional()
});
export type PingTarget = z.infer<typeof pingTargetSchema>;

/**
 * 拨测目标列表查询响应契约
 */
export const pingListResultSchema = z.object({
  /** 拨测目标数组 */
  targets: z.array(pingTargetSchema),
  /** 总探测目标数 */
  total: z.number().optional().default(0)
});

/**
 * 新增拨测目标入参契约
 */
export const pingCreateParamsSchema = z.object({
  /** 目标名称 */
  name: z.string(),
  /** 探测地址 */
  address: z.string(),
  /** 协议类型 */
  protocol: pingProtocolSchema,
  /** 业务分组（默认 "private"） */
  group: z.enum(["public", "control", "notify", "private"]).default("private")
});

/**
 * 删除拨测目标入参契约
 */
export const pingDeleteParamsSchema = z.object({
  /** 目标 ID */
  id: z.string()
});
