import { useEffect, useRef, useState } from "react";

import type { ServerMetrics } from "@/shared/api/methods";
import { useMonitoringStore } from "./monitoring-store";

type LatestMap = Map<string, ServerMetrics>;
type HistoryMap = Map<string, ServerMetrics[]>;

/**
 * 节流式监控全局大盘数据选择器 Hook
 * 
 * 为什么需要该 Hook：
 * Store 内部为了极致性能对 per-server Map 进行了原地更新，并通过单调自增 `tick` 标识数据版本。
 * 总览大盘（Overview）需要汇聚全部服务器的 CPU / 内存 / 流量历史并计算全集群平均值和吞吐。
 * 如果直接在每个 WebSocket 批次都全量重算全集群 Map，会导致十几个图表组件每秒重绘几十次，CPU 负载极高。
 * 
 * 双边缘节流机制（Leading + Trailing Throttle）：
 * 1. 前沿触发（Leading Edge）：静默期后的第一个 `tick` 立即触发重绘，使图表在数据刚刚到达的第一时间完成首屏填充（无白屏等待）。
 * 2. 后沿合并（Trailing Edge）：在 `intervalMs`（默认 1000ms）窗口内涌入的后续所有局部 tick 统一合并在窗口结束时刷新一次。
 * 
 * 每次刷新都会生成一份不可变的 Map/Array 快照给选择器函数 `select`，使图表组件可以安心使用常规 React 依赖。
 * 
 * @template T 选择器派生数据的类型
 * @param select 数据派生选择器函数
 * @param intervalMs 节流刷新周期（毫秒，默认 1000ms）
 */
export function useThrottledMonitoring<T>(
  select: (latest: LatestMap, history: HistoryMap) => T,
  intervalMs = 1000
): T {
  const tick = useMonitoringStore((s) => s.tick);
  const selectRef = useRef(select);

  useEffect(() => {
    selectRef.current = select;
  }, [select]);

  const [snapshot, setSnapshot] = useState<T>(() => readSnapshot(select));

  const lastRefreshAt = useRef(0);
  const lastRefreshTick = useRef(0);
  const lastSeenTick = useRef(0);
  const trailingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = (atTick: number) => {
    lastRefreshTick.current = atTick;
    lastSeenTick.current = atTick;
    lastRefreshAt.current = Date.now();
    setSnapshot(readSnapshot(selectRef.current));
  };

  useEffect(() => {
    if (tick === lastRefreshTick.current) return;
    lastSeenTick.current = tick;

    const since = Date.now() - lastRefreshAt.current;
    if (since >= intervalMs) {
      // 前沿立即执行
      refresh(tick);
    } else if (trailingTimer.current === null) {
      // 安排后沿在时间窗口结束时统一刷新
      trailingTimer.current = setTimeout(() => {
        trailingTimer.current = null;
        refresh(lastSeenTick.current);
      }, intervalMs - since);
    }
  }, [tick, intervalMs]);

  useEffect(() => () => {
    if (trailingTimer.current) clearTimeout(trailingTimer.current);
  }, []);

  return snapshot;
}

/**
 * 从 Zustand Store 读取一份干净的只读不可变数据快照并执行派生计算
 */
function readSnapshot<T>(select: (latest: LatestMap, history: HistoryMap) => T): T {
  const { latest, history } = useMonitoringStore.getState();
  const latestSnapshot = new Map(latest);
  const historySnapshot = new Map(
    [...history].map(([serverId, samples]) => [serverId, [...samples]])
  );
  return select(latestSnapshot, historySnapshot);
}
