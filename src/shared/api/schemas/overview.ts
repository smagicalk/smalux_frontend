import { z } from "zod";

/**
 * 总览大盘全景驾驶舱 HUD 聚合指标入参契约
 */
export const overviewStatsParamsSchema = z.object({}).default({});

/**
 * 总览大盘全景驾驶舱 HUD 聚合指标响应契约
 * 
 * 对应 `overview.stats` API，提供全网集群综合健康度与关键 SLA 数据。
 */
export const overviewStatsResultSchema = z.object({
  /** 全集群综合健康评分（0~100 分，如 98.5） */
  healthScore: z.number(),
  /** 全网服务可用性 SLA 达标百分比（如 99.98） */
  sla: z.number(),
  /** 当前在线节点总数（台） */
  onlineCount: z.number(),
  /** 全网纳管节点总机台数（台） */
  totalCount: z.number(),
  /** 节点在线率（百分比 0~100） */
  onlineRate: z.number(),
  /** 全网瞬时进出吞吐量（带单位字符串，如 "12.45 GB/s"） */
  throughput: z.string(),
  /** 当前承载的活跃 TCP/UDP 网络连接总数（带单位字符串，如 "158,240 活跃"） */
  activeConnections: z.string(),
  /** 全网平均 CPU 利用率（百分比 0~100） */
  avgCpu: z.number(),
  /** 全网平均内存利用率（百分比 0~100） */
  avgMemory: z.number(),
  /** 全网平均磁盘已用空间利用率（百分比 0~100） */
  avgDisk: z.number(),
  /** 当前正处于未解决状态的告警规则事件总数 */
  activeAlertsCount: z.number()
});

export type OverviewStatsParams = z.infer<typeof overviewStatsParamsSchema>;
export type OverviewStatsResult = z.infer<typeof overviewStatsResultSchema>;
