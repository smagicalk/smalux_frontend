export type SchemaFieldType =
  | "text"
  | "number"
  | "slider"
  | "switch"
  | "select"
  | "checkbox-group"
  | "textarea"
  | "code";

export interface SchemaOption {
  label: string;
  value: string | number;
  description?: string;
  badge?: string;
}

export interface SchemaField {
  id: string;
  label: string;
  type: SchemaFieldType;
  description?: string;
  required?: boolean;
  defaultValue: unknown;
  options?: SchemaOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
  group?: string;
  dependsOn?: {
    field: string;
    equals: unknown;
  };
}

export interface AgentTaskSchema {
  id: string;
  name: string;
  category: "builtin" | "plus";
  version?: string;
  description: string;
  iconName: string;
  defaultIntervalSec: number;
  tags: string[];
  fields: SchemaField[];
}

export interface NodeTaskInstance {
  schema: AgentTaskSchema;
  enabled: boolean;
  intervalSec: number;
  values: Record<string, unknown>;
  status: "running" | "idle" | "paused" | "uninstalled";
  lastDispatchedAt: string;
  reportedSupportNotice?: string;
}
