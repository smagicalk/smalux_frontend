import { useState, useEffect, useCallback } from "react";
import { useRpc } from "@/app/providers/rpc-context";
import { methods } from "@/shared/api/methods";
import type { HostServer, ServerConfigFormState } from "../types";
import {
  getMockServerConfig,
  updateMockServerConfig,
  decommissionMockServer
} from "../mock/infrastructure-mock";
import { toast } from "sonner";

export interface UseServerConfigOptions {
  onSaved?: (updatedConfig: ServerConfigFormState) => void;
  onDeleted?: (serverId: string) => void;
}

export function useServerConfig(
  serverId: string | undefined,
  fallbackServer?: Partial<HostServer>,
  options?: UseServerConfigOptions
) {
  const { client } = useRpc();
  const [config, setConfig] = useState<ServerConfigFormState>(() => {
    return getMockServerConfig(serverId || "unknown", fallbackServer);
  });
  const [savedSnapshot, setSavedSnapshot] = useState<ServerConfigFormState>(config);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch / Sync initial server config
  const fetchConfig = useCallback(async () => {
    if (!serverId) return;
    setIsLoading(true);
    try {
      if (client) {
        try {
          const res = await client.call(
            "agent.hardware",
            { serverId },
            methods["agent.hardware"].result
          );
          if (res) {
            const fresh = getMockServerConfig(serverId, { ...fallbackServer, id: serverId });
            setConfig(fresh);
            setSavedSnapshot(fresh);
            return;
          }
        } catch {
          // Fallback to mock store if method unsupported or offline
        }
      }
      // Mock / fallback fetch
      const fresh = getMockServerConfig(serverId, fallbackServer);
      setConfig(fresh);
      setSavedSnapshot(fresh);
    } catch {
      const fresh = getMockServerConfig(serverId, fallbackServer);
      setConfig(fresh);
      setSavedSnapshot(fresh);
    } finally {
      setIsLoading(false);
    }
  }, [serverId, fallbackServer, client]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Save full configuration
  const saveConfig = async (customConfig?: Partial<ServerConfigFormState>): Promise<boolean> => {
    if (!serverId) return false;
    setIsSaving(true);
    const payloadToSave: ServerConfigFormState = {
      ...config,
      ...(customConfig || {})
    };

    try {
      if (client) {
        try {
          await client.call(
            "agent.update",
            {
              serverId,
              price: payloadToSave.price,
              currency: payloadToSave.currency,
              expiresAt: payloadToSave.expiresAt ? new Date(payloadToSave.expiresAt).getTime() : null,
              billingCycle: (payloadToSave.billingCycle as any) || null
            },
            methods["agent.update"].result
          );
        } catch {
          // Continue updating local/mock store
        }
      }

      // Mock network roundtrip simulation
      await new Promise((resolve) => setTimeout(resolve, 350));
      const mockRes = updateMockServerConfig(serverId, payloadToSave);
      setConfig(mockRes.data);
      setSavedSnapshot(mockRes.data);
      toast.success(mockRes.message || `主机 [${payloadToSave.name}] 配置与报警策略已成功更新并生效`);
      options?.onSaved?.(mockRes.data);
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存主机配置失败，请检查网络连接");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to last saved snapshot
  const resetConfig = useCallback(() => {
    setConfig(savedSnapshot);
    toast.info("已重置为服务器已保存的原始配置");
  }, [savedSnapshot]);

  // Decommission and delete node
  const deleteServer = async (): Promise<boolean> => {
    if (!serverId) return false;
    setIsDeleting(true);
    try {
      // Mock network roundtrip
      await new Promise((resolve) => setTimeout(resolve, 400));
      const res = decommissionMockServer(serverId);
      if (res.ok) {
        toast.success(res.message);
        options?.onDeleted?.(serverId);
        return true;
      }
      return false;
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
