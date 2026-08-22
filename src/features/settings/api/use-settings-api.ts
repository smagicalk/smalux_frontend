import { useState, useMemo } from "react";
import { useSettings as useRpcSettings } from "../hooks/use-settings";
import type {
  SystemConfigItem,
  AccountUserItem,
  ApiTokenItem,
  ThemeItem,
  DeploymentTargetItem
} from "../types";
import {
  MOCK_SYSTEM_CONFIGS,
  MOCK_ACCOUNT_USERS,
  MOCK_API_TOKENS,
  MOCK_THEMES,
  MOCK_DEPLOYMENT_TARGETS
} from "../mock/settings-mock";

/**
 * Isolated settings feature hook for system configs, users, tokens, and themes.
 */
export function useSettingsData() {
  const { data: rpcSettingsData, isLoading, refetch } = useRpcSettings();

  const [users] = useState<AccountUserItem[]>(MOCK_ACCOUNT_USERS);
  const [tokens] = useState<ApiTokenItem[]>(MOCK_API_TOKENS);
  const [themes] = useState<ThemeItem[]>(MOCK_THEMES);
  const [deploymentTargets] = useState<DeploymentTargetItem[]>(MOCK_DEPLOYMENT_TARGETS);

  // 1. Transform System Configs
  const configs: SystemConfigItem[] = useMemo(() => {
    const rpcConfigs = rpcSettingsData?.settings ?? [];
    if (!rpcConfigs || rpcConfigs.length === 0) {
      return MOCK_SYSTEM_CONFIGS;
    }

    return rpcConfigs.map((c) => ({
      key: c.key,
      label: c.label,
      value: c.value,
      group: c.group as SystemConfigItem["group"],
      editable: c.editable,
      description: `系统配置项: ${c.key}`
    }));
  }, [rpcSettingsData]);

  return {
    configs,
    users,
    tokens,
    themes,
    deploymentTargets,
    isLoading,
    refetch
  };
}
