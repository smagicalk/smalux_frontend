import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/query-keys";
import { httpClient } from "@/shared/api/http/http-client";
import type { SettingListResult } from "@/shared/api/methods";

/**
 * 获取系统级运行配置项字典 Hook（HTTP GET /api/v1/system/configs）
 */
export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => httpClient.get<SettingListResult>("/api/v1/system/configs")
  });
}

/**
 * 批量保存修改的系统设置项 Hook（HTTP PUT /api/v1/system/configs）
 */
export function useSaveSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (changes: { key: string; value: string }[]) => {
      return httpClient.put("/api/v1/system/configs", { configs: changes });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.settings })
  });
}
