import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/query-keys";
import { httpClient } from "@/shared/api/http/http-client";
import type { LogListResult } from "@/shared/api/methods";

/**
 * 获取全局操作审计与运行日志列表 Hook（HTTP GET /api/v1/system/logs）
 * 
 * @param filters 关键词搜索、模块筛选及操作结果（成功/失败）过滤
 */
export function useLogs(filters: { search?: string; module?: string; result?: "success" | "failure" } = {}) {
  return useQuery({
    queryKey: queryKeys.logs(filters),
    queryFn: () => httpClient.get<LogListResult>("/api/v1/system/logs", filters)
  });
}
