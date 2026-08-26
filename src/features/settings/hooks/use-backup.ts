/**
 * 数据存储、自动备份与多端异地容灾 TanStack Query Hooks
 * 
 * 提供：
 * 1. 存储指标大盘读取 (`useStorageStats`)
 * 2. 自动备份计划的增删改查、启停与立即执行 (`useBackupPlans`, `useCreateBackupPlan`, `useUpdateBackupPlan`, `useToggleBackupPlan`, `useDeleteBackupPlan`, `useRunBackupPlan`)
 * 3. 历史快照文件的查询、手动即时生成、高危覆盖还原、单项删除与规则批量清理 (`useBackups`, `useCreateBackup`, `useRestoreBackup`, `useDeleteBackup`, `usePruneBackups`)
 * 4. 业务数据按范围清理与远程 S3/WebDAV 连通性测试 (`useCleanData`, `useTestRemoteStorage`)
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/query-keys";
import { httpClient } from "@/shared/api/http/http-client";
import type {
  AutoBackupPlan,
  BackupArchive,
  RemoteStorageConfig,
  StorageStats
} from "@/features/settings/mock/settings-mock";

/**
 * 获取存储分布与容量大盘指标
 * 
 * 对应后端接口：`GET /api/v1/system/storage-stats`
 * @returns 包含数据库、时序指标、大盘主题、审计日志、告警历史与任务日志的体积指标
 */
export function useStorageStats() {
  return useQuery({
    queryKey: queryKeys.storageStats,
    queryFn: () => httpClient.get<StorageStats>("/api/v1/system/storage-stats")
  });
}

/**
 * 获取自动定时备份计划列表
 * 
 * 对应后端接口：`GET /api/v1/system/backup-plans`
 * @returns 备份计划数组 `{ plans: AutoBackupPlan[] }`
 */
export function useBackupPlans() {
  return useQuery({
    queryKey: queryKeys.backupPlans,
    queryFn: () => httpClient.get<{ plans: AutoBackupPlan[] }>("/api/v1/system/backup-plans")
  });
}

/**
 * 创建新自动定时备份计划
 * 
 * 对应后端接口：`POST /api/v1/system/backup-plans`
 * 成功后自动重新加载备份计划列表缓存
 */
export function useCreateBackupPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (plan: Omit<AutoBackupPlan, "id" | "createdAt">) =>
      httpClient.post<AutoBackupPlan>("/api/v1/system/backup-plans", plan),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.backupPlans });
    }
  });
}

/**
 * 更新已存在的自动定时备份计划
 * 
 * 对应后端接口：`PUT /api/v1/system/backup-plans/:id`
 * 成功后自动刷新备份计划列表缓存
 */
export function useUpdateBackupPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, plan }: { id: string; plan: Partial<AutoBackupPlan> }) =>
      httpClient.put<AutoBackupPlan>(`/api/v1/system/backup-plans/${id}`, plan),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.backupPlans });
    }
  });
}

/**
 * 快速启停指定自动备份计划
 * 
 * 对应后端接口：`PUT /api/v1/system/backup-plans/:id/toggle`
 */
export function useToggleBackupPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      httpClient.put<{ ok: boolean }>(`/api/v1/system/backup-plans/${id}/toggle`, { enabled }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.backupPlans });
    }
  });
}

/**
 * 删除指定自动备份计划
 * 
 * 对应后端接口：`DELETE /api/v1/system/backup-plans/:id`
 */
export function useDeleteBackupPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => httpClient.delete<{ ok: boolean }>(`/api/v1/system/backup-plans/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.backupPlans });
    }
  });
}

/**
 * 立即触发执行一次指定的自动备份计划
 * 
 * 对应后端接口：`POST /api/v1/system/backup-plans/:id/run`
 * 成功后自动联动刷新快照列表与存储容量大盘缓存
 */
export function useRunBackupPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      httpClient.post<{ ok: boolean; backup?: BackupArchive; message: string }>(
        `/api/v1/system/backup-plans/${id}/run`
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.backups });
      qc.invalidateQueries({ queryKey: queryKeys.storageStats });
    }
  });
}

/**
 * 获取系统历史生成的备份快照归档列表
 * 
 * 对应后端接口：`GET /api/v1/system/backups`
 */
export function useBackups() {
  return useQuery({
    queryKey: queryKeys.backups,
    queryFn: () => httpClient.get<{ backups: BackupArchive[] }>("/api/v1/system/backups")
  });
}

/**
 * 手动创建即时备份快照包
 * 
 * 对应后端接口：`POST /api/v1/system/backups`
 * @param params.scope 备份范围（"all" 全量 / "configs_only" 仅配置）
 * @param params.encrypt 是否 AES-256 加密
 * @param params.notes 快照备注说明
 */
export function useCreateBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { scope: "all" | "configs_only"; encrypt: boolean; notes?: string }) =>
      httpClient.post<BackupArchive>("/api/v1/system/backups", params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.backups });
      qc.invalidateQueries({ queryKey: queryKeys.storageStats });
    }
  });
}

/**
 * 根据指定快照覆盖还原整个系统数据（高危操作）
 * 
 * 对应后端接口：`POST /api/v1/system/backups/:id/restore`
 * @param params.id 目标快照 ID
 * @param params.verifyKey 解密密钥或管理员确认密码
 */
export function useRestoreBackup() {
  return useMutation({
    mutationFn: ({ id, verifyKey }: { id: string; verifyKey?: string }) =>
      httpClient.post<{ ok: boolean }>(`/api/v1/system/backups/${id}/restore`, { verifyKey })
  });
}

/**
 * 删除单条历史备份快照
 * 
 * 对应后端接口：`DELETE /api/v1/system/backups/:id`
 */
export function useDeleteBackup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => httpClient.delete<{ ok: boolean }>(`/api/v1/system/backups/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.backups });
      qc.invalidateQueries({ queryKey: queryKeys.storageStats });
    }
  });
}

/**
 * 根据过期时间规则批量清理历史快照
 * 
 * 对应后端接口：`POST /api/v1/system/backups/prune`
 * @param rule 清理规则（"older_7d" 7天前 / "older_30d" 30天前 / "only_scheduled" 仅自动快照 / "all" 全部快照）
 */
export function usePruneBackups() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rule: "older_7d" | "older_30d" | "only_scheduled" | "all") =>
      httpClient.post<{ ok: boolean; removedCount: number }>("/api/v1/system/backups/prune", { rule }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.backups });
      qc.invalidateQueries({ queryKey: queryKeys.storageStats });
    }
  });
}

/**
 * 按范围安全清理各类历史业务数据以释放磁盘
 * 
 * 对应后端接口：`POST /api/v1/system/data-cleanup`
 * @param params.type 数据类型（"metrics" 时序指标 / "audit" 审计日志 / "alerts" 告警历史 / "tasks" 任务日志）
 * @param params.rule 清理天数范围（例如 "7", "30", "90", "all"）
 */
export function useCleanData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ type, rule }: { type: "metrics" | "audit" | "alerts" | "tasks"; rule?: string }) =>
      httpClient.post<{ ok: boolean; freedMb: number }>("/api/v1/system/data-cleanup", { type, rule }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.storageStats });
    }
  });
}

/**
 * 测试远程 S3 / WebDAV 异地冷备存储连通性与读写鉴权
 * 
 * 对应后端接口：`POST /api/v1/system/storage/test-remote`
 * @param config 远程存储参数（S3 或 WebDAV）
 * @returns 连通性测试结果 `{ ok: true, latencyMs: number, message: string }`
 */
export function useTestRemoteStorage() {
  return useMutation({
    mutationFn: (config: RemoteStorageConfig) =>
      httpClient.post<{ ok: boolean; latencyMs: number; message: string }>("/api/v1/system/storage/test-remote", config)
  });
}
