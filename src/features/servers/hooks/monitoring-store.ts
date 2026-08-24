import { create } from "zustand";

import type { ServerMetrics } from "@/shared/api/methods";

/**
 * 每个主机保留的历史时序指标最大采样点数（120点 ≈ 2秒/点 x 4分钟滚动窗口）
 */
const HISTORY_LIMIT = 120;

/**
 * 实时监控指标状态接口
 * 
 * 存储结构设计考量（高并发低延迟 v2 架构）：
 * 1. **O(1) 原地局部更新（In-Place Mutation）**：
 *    采用 Map 按 serverId 索引存储。当收到单个服务器的新采样点时，仅更新对应 serverId 的键值对，
 *    而不需要使用不可变展开语法（如 `...state.latest`）重建整个 Map。
 *    在 100+ 节点高频推流场景下，单批次处理复杂度从 O(N²) 降低到 O(N)。
 * 2. **细粒度单节点订阅 vs 全局集群订阅**：
 *    - 单节点订阅者（如单个主机卡片）：直接通过 `latest.get(id)` 订阅，仅当该主机数据变动时重渲染。
 *    - 全局聚合订阅者（如总览大盘趋势图）：依赖单调递增计数器 `tick`，配合 `useThrottledMonitoring`
 *      将 1 秒内到达的数十次局部批次节流合并为 1 次大盘重绘，避免图表高频刷新卡顿。
 */
interface MonitoringState {
  /** 各服务器最新实时采样数据（键为 serverId） */
  latest: Map<string, ServerMetrics>;
  /** 各服务器滚动时序历史队列（键为 serverId） */
  history: Map<string, ServerMetrics[]>;
  /** 单调递增版本号计数器：每批次数据写入后自增，驱动全表聚合选择器 */
  tick: number;
  /** 写入单个主机的遥测指标 */
  upsert: (metrics: ServerMetrics) => void;
  /** 批量写入多台主机的遥测指标（单次更新仅 bump 一次 tick） */
  upsertBatch: (samples: ServerMetrics[]) => void;
  /** 重置清空所有实时数据 */
  reset: () => void;
}

export const useMonitoringStore = create<MonitoringState>((set) => ({
  latest: new Map(),
  history: new Map(),
  tick: 0,
  upsert: (metrics) =>
    set((state) => {
      applySample(state, metrics);
      return { tick: state.tick + 1 };
    }),
  upsertBatch: (samples) =>
    set((state) => {
      for (const m of samples) applySample(state, m);
      // 一批样本仅递增一次 tick，避免 100 台机器数据同时到达时触发 100 次级联重渲染
      return { tick: state.tick + 1 };
    }),
  reset: () =>
    set({
      latest: new Map(),
      history: new Map(),
      tick: 0
    })
}));

/**
 * 将单条遥测样本写入 Map 状态
 * 
 * 关键机制：
 * 1. 数组浅拷贝局部隔离：仅为当前更新的主机创建新的数组引用，使仅关注该主机的组件（如 useServerHistory）正常响应更新。
 * 2. **时间戳严格单调防御（Monotonic Guard）**：
 *    在 React StrictMode（开发模式下组件会进行 Mount -> Unmount -> Mount 两次执行）或网络乱序时，
 *    历史回放种子数据可能重复推入。如果新推入的样本其 ts <= 末尾已有样本的 ts，则自动丢弃，
 *    彻底防止 ECharts / uPlot 等时间轴折线出现“同一时间点来回折返”的渲染 Bug。
 */
function applySample(state: MonitoringState, metrics: ServerMetrics): void {
  state.latest.set(metrics.serverId, metrics);
  const prev = state.history.get(metrics.serverId);

  // 单调时间戳防御拦截：丢弃非严格递增的时序点
  if (prev && prev.length > 0 && metrics.ts <= prev[prev.length - 1].ts) {
    return;
  }

  if (prev) {
    // 保持队列长度不超过 HISTORY_LIMIT
    const next = prev.length >= HISTORY_LIMIT ? prev.slice(prev.length - HISTORY_LIMIT + 1) : prev.slice();
    next.push(metrics);
    state.history.set(metrics.serverId, next);
  } else {
    state.history.set(metrics.serverId, [metrics]);
  }
}
