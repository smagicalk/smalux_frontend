import { useState, useMemo } from "react";
import { useTasks as useRpcTasks } from "@/features/tasks/hooks/use-tasks";
import { useCrons as useRpcCrons } from "@/features/cron/hooks/use-cron";
import type { TaskRecord, TaskTemplate, CronJob } from "../types";
import {
  MOCK_TASK_RECORDS,
  MOCK_TASK_TEMPLATES,
  MOCK_CRON_JOBS
} from "../mock/automation-mock";

/**
 * Isolated automation feature hook for task dispatch, templates, and cron scheduling.
 */
export function useAutomationData() {
  const { data: rpcTasksData, isLoading: isLoadingTasks, refetch: refetchTasks } = useRpcTasks();
  const { data: rpcCronData, isLoading: isLoadingCron, refetch: refetchCron } = useRpcCrons();

  const [templates] = useState<TaskTemplate[]>(MOCK_TASK_TEMPLATES);

  // 1. Transform Tasks
  const tasks: TaskRecord[] = useMemo(() => {
    const rpcList = rpcTasksData?.tasks ?? [];
    if (!rpcList || rpcList.length === 0) {
      return MOCK_TASK_RECORDS;
    }

    return rpcList.map((t) => ({
      id: t.id,
      serverId: t.serverId || "srv-hkg-01",
      serverName: t.serverName || "集群节点",
      command: t.command,
      status: t.status as TaskRecord["status"],
      risk: (t.risk as TaskRecord["risk"]) || "low",
      scope: t.scope || "node:exec",
      startedAt: t.startedAt || 0,
      finishedAt: t.finishedAt,
      durationMs: t.durationMs,
      exitCode: t.exitCode,
      output: t.output,
      approver: t.approver
    }));
  }, [rpcTasksData]);

  // 2. Transform Cron Jobs
  const cronJobs: CronJob[] = useMemo(() => {
    const rpcCrons = rpcCronData?.crons ?? [];
    if (!rpcCrons || rpcCrons.length === 0) {
      return MOCK_CRON_JOBS;
    }

    return rpcCrons.map((c) => ({
      id: c.id,
      name: c.name,
      serverId: c.serverId || "srv-tok-01",
      serverName: c.serverName || "集群节点",
      expression: c.expression,
      command: c.command,
      enabled: c.enabled,
      lastRunAt: c.lastRunAt,
      nextRunAt: c.nextRunAt,
      lastStatus: (c.lastStatus as CronJob["lastStatus"]) || "success"
    }));
  }, [rpcCronData]);

  return {
    tasks,
    templates,
    cronJobs,
    isLoading: isLoadingTasks || isLoadingCron,
    refetchTasks,
    refetchCron
  };
}
