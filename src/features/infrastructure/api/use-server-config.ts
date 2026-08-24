import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRpc } from "@/app/providers/rpc-context";
import { methods } from "@/shared/api/methods";
import { queryKeys } from "@/shared/api/query-keys";
import type { HostServer, ServerConfigFormState } from "../types";
import { toast } from "sonner";

/**
 * 主机配置操作事件回调配置
 */
export interface UseServerConfigOptions {
  /** 配置成功保存后触发 */
  onSaved?: (updatedConfig: ServerConfigFormState) => void;
  /** 主机从集群解绑注销后触发 */
  onDeleted?: (serverId: string) => void;
}

/**
 * 初始加载中的配置空骨架对象
 * 
 * 预设全量字段的安全默认值，确保下游表单与输入框组件在异步数据返回前不会发生空指针崩溃（Null Pointer Exception）。
 */
const EMPTY_CONFIG: ServerConfigFormState = {
  name: "",
  groups: [],
  tags: [],
  autoLocation: true,
  location: "",
  trafficLimitValue: 1000,
  trafficLimitUnit: "GB",
  trafficLimitGb: 1000,
  trafficCalculation: "outbound",
  trafficResetDay: 1,
  publicVisible: true,
  maintenanceMode: false,
  price: 0,
  currency: "CNY",
  billingCycle: "monthly",
  expiresAt: "",
  autoRenew: false,
  note: "",
  cpuThreshold: 85,
  cpuDurationSec: 60,
  memThreshold: 90,
  memDurationSec: 60,
  diskThreshold: 90,
  diskDurationSec: 300,
  netThresholdMb: 100,
  offlineTimeoutSec: 60,
  enableNotify: false,
  notifyChannels: [],
  agentToken: "",
  allowRemoteExec: false
};

/**
 * 服务器节点配置读取、修改保存与注销解绑 Hook
 * 
 * 功能职责：
 * 1. `fetchConfig`: 调用 `agent.getConfig` 获取节点完整业务与监控阈值配置。
 * 2. `saveConfig`: 调用 `agent.updateConfig` 保存最新配置并自动失效集群缓存。
 * 3. `resetConfig`: 纯前端无网络开销回滚至最近一次保存的快照。
 * 4. `deleteServer`: 调用 `agent.decommission` 从集群彻底注销解绑该节点。
 * 
 * 全量流程经由 `RpcClient` 统一调度，支持 Mock、WebSocket 和 HTTP。
 * 
 * @param serverId 目标服务器 ID
 * @param _fallbackServer 保留入参兼容
 * @param options 保存/删除成功后的回调配置
 */
export function useServerConfig(
  serverId: string | undefined,
  /** @deprecated 保留入参兼容 */
  _fallbackServer?: Partial<HostServer>,
  options?: UseServerConfigOptions
) {
  const { client } = useRpc();
  const qc = useQueryClient();

  const [config, setConfig] = useState<ServerConfigFormState>(EMPTY_CONFIG);
  const [savedSnapshot, setSavedSnapshot] = useState<ServerConfigFormState>(EMPTY_CONFIG);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 从服务端获取最新配置
  const fetchConfig = useCallback(async () => {
    if (!serverId) return;
    setIsLoading(true);
    try {
      const fresh = await client.call(
        "agent.getConfig",
        { serverId },
        methods["agent.getConfig"].result
      );
      setConfig(fresh);
      setSavedSnapshot(fresh);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `加载主机配置失败: ${err.message}`
          : "加载主机配置失败，请检查网络连接"
      );
    } finally {
      setIsLoading(false);
    }
  }, [serverId, client]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // 提交并保存完整配置
  const saveConfig = async (
    customConfig?: Partial<ServerConfigFormState>
  ): Promise<boolean> => {
    if (!serverId) return false;
    setIsSaving(true);

    const payloadToSave: ServerConfigFormState = {
      ...config,
      ...(customConfig ?? {})
    };

    try {
      await client.call(
        "agent.updateConfig",
        { serverId, ...payloadToSave },
        methods["agent.updateConfig"].result
      );

      setConfig(payloadToSave);
      setSavedSnapshot(payloadToSave);

      // 失效服务器列表缓存，让主机列表即时体现更名或分组变更
      qc.invalidateQueries({ queryKey: ["servers"] });
      qc.setQueryData(queryKeys.serverConfig(serverId), payloadToSave);

      toast.success(`主机 [${payloadToSave.name}] 配置与报警策略已成功更新并生效`);
      options?.onSaved?.(payloadToSave);
      return true;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "保存主机配置失败，请检查网络连接"
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // 重置回退为当前快照
  const resetConfig = useCallback(() => {
    if (savedSnapshot) {
      setConfig(savedSnapshot);
      toast.info("已重置为服务器已保存的原始配置");
    }
  }, [savedSnapshot]);

  // 注销并解绑节点
  const deleteServer = async (): Promise<boolean> => {
    if (!serverId) return false;
    setIsDeleting(true);
    try {
      await client.call(
        "agent.decommission",
        { serverId },
        methods["agent.decommission"].result
      );

      toast.success(`节点 [${serverId}] 已成功从集群注销并解绑`);

      // 失效并清理缓存
      qc.invalidateQueries({ queryKey: ["servers"] });
      qc.removeQueries({ queryKey: queryKeys.serverConfig(serverId) });
      qc.removeQueries({ queryKey: queryKeys.serverStatus(serverId) });

      options?.onDeleted?.(serverId);
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "注销节点失败");
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    config,
    setConfig,
    isLoading,
    isSaving,
    isDeleting,
    saveConfig,
    resetConfig,
    deleteServer,
    refetch: fetchConfig
  };
}
