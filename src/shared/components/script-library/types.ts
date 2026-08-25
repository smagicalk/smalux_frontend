export interface ScriptItem {
  id: string;
  category: string;
  title: string;
  desc?: string;
  command: string;
  risk?: "low" | "medium" | "high";
  scope?: string;
  updatedAt?: number;
}

export interface ScriptGroup {
  key: string;
  label: string;
}

export interface CreateScriptInput {
  title: string;
  category: string;
  desc?: string;
  command: string;
  risk?: "low" | "medium" | "high";
}

export interface UpdateScriptInput extends Partial<CreateScriptInput> {
  id: string;
}
