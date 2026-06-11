export const queryKeys = {
  auth: {
    session: ["auth", "session"] as const
  },
  nodes: {
    all: ["nodes"] as const,
    list: (filters: NodeListQuery = {}) => ["nodes", "list", filters] as const,
    detail: (nodeId: string) => ["nodes", "detail", nodeId] as const,
    metrics: (nodeId: string, range: string) => ["nodes", "metrics", nodeId, range] as const
  },
  themes: {
    all: ["themes"] as const,
    list: ["themes", "list"] as const,
    detail: (themeId: string) => ["themes", "detail", themeId] as const
  },
  settings: {
    runtime: ["settings", "runtime"] as const
  }
};

export type NodeListQuery = {
  group?: string;
  status?: string;
  search?: string;
};
