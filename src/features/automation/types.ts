export type TaskStatus = "pending" | "running" | "success" | "failed" | "timeout" | "approved" | "rejected";
export type TaskRisk = "low" | "medium" | "high";

export interface TaskRecord {
  id: string;
  serverId: string;
  serverName: string;
  command: string;
  status: TaskStatus;
  risk: TaskRisk;
  scope: string;
  startedAt: number;
  finishedAt?: number;
  durationMs?: number;
  exitCode?: number;
  output?: string;
  approver?: string;
}

export interface TaskTemplate {
  id: string;
  name: string;
  command: string;
  risk: TaskRisk;
  scope: string;
  requiresApproval: boolean;
  description?: string;
}

export interface CronJob {
  id: string;
  name: string;
  serverId: string;
  serverName: string;
  expression: string;
  command: string;
  enabled: boolean;
  lastRunAt?: number;
  nextRunAt?: number;
  lastStatus?: "success" | "failed" | "running";
}
