import { useEffect } from "react";

import { methods } from "@/shared/api/methods";
import type { ServerMetrics } from "@/shared/api/methods";
import { useRpc } from "@/app/providers/rpc-context";
import { useMonitoringStore } from "./monitoring-store";

/**
 * 实时监控推流生命周期管理 Hook
 * 
 * 订阅指定 serverId（或全部服务器）的实时遥测指标流。
 * 推送到的采样数据会自动写入全局 `monitoring-store`；该 Hook 本身仅负责维护 WebSocket 订阅生命周期。
 * 业务组件无需直接重新执行此 Hook，而是通过 `useServerMetrics(id)` 选择器精准按需监听，
 * 避免每秒数据刷新触发整个页面的全量重绘。
 * 
 * 微任务批处理机制（Microtask Batching）：
 * 传输层在单个时钟周期可能同步分发数十甚至上百台主机的采样数据。
 * 本 Hook 通过 `queueMicrotask` 将同步突发样本积攒为单次 `upsertBatch` 提交，
 * 使得 100 台节点的单轮推流仅触发 1 次 Zustand Store 变更，性能极高。
 * 
 * @param serverIds 可选，要监听的主机 ID 列表；缺省则订阅全部主机
 */
export function useMonitoring(serverIds?: string[]) {
  const { client } = useRpc();
  const upsertBatch = useMonitoringStore((s) => s.upsertBatch);

  useEffect(() => {
    let pending: ServerMetrics[] = [];
    let flushScheduled = false;

    const flush = () => {
      flushScheduled = false;
      if (pending.length) {
        upsertBatch(pending);
        pending = [];
      }
    };

    const scheduleFlush = () => {
      if (flushScheduled) return;
      flushScheduled = true;
      // 微任务延迟执行：将同一个事件循环内同步到达的多条样本合并为一次写入
      queueMicrotask(flush);
    };

    const unsubscribe = client.subscribe(
      "agent.summary.subscribe",
      { serverIds },
      methods["agent.summary.subscribe"].result,
      (sample) => {
        if (sample) {
          pending.push(sample);
          scheduleFlush();
        }
      }
    );

    return () => {
      unsubscribe();
      flush();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, upsertBatch, serverIds?.join(",")]);
}

/**
 * 稳定的空数组单例：防止在主机暂无历史时用 `?? []` 创建临时新数组引用引发 Zustand 死循环重渲染
 */
const EMPTY_HISTORY: never[] = [];

/**
 * 单台主机最新指标选择器 Hook
 * 
 * @param serverId 主机 ID
 * @returns 该主机最新一帧 ServerMetrics（未就绪时为 undefined）
 */
export function useServerMetrics(serverId: string) {
  return useMonitoringStore((s) => s.latest.get(serverId));
}

/**
 * 单台主机滚动历史时序选择器 Hook（用于详情页趋势图表渲染）
 * 
 * @param serverId 主机 ID
 * @returns 该主机的滚动采样点数组（未就绪时返回稳定空数组）
 */
export function useServerHistory(serverId: string) {
  return useMonitoringStore((s) => s.history.get(serverId) ?? EMPTY_HISTORY);
}
