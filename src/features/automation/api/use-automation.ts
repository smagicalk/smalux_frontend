/**
 * 自动化运维统一数据 Hook 导出层
 * 
 * 整合并对外暴露来自 tasks 和 cron 模块的 RPC hooks，
 * 供 automation-page.tsx 及相关自动化运维组件消费。
 */
export {
  useTasks,
  useTaskTemplates,
  useTaskVariables,
  useDispatchTask,
  useApproveTask
} from "@/features/automation/hooks/use-tasks";

export {
  useCrons,
  useCronLogs,
  useCreateCron,
  useUpdateCron,
  useToggleCron,
  useDeleteCron
} from "@/features/automation/hooks/use-cron";
