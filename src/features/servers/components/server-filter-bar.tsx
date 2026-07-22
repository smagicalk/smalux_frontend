import { Search } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { FilterPills } from "@/shared/ui/layout";
import type { ServerStatus } from "@/shared/api/methods";

import type { SortKey } from "../lib/server-meta";

const STATUS_OPTIONS = [
  { key: "all", label: "全部", activeClassName: "bg-primary text-primary-foreground" },
  { key: "online", label: "在线", activeClassName: "bg-success text-white", inactiveClassName: "bg-success/10 text-success hover:bg-success/15" },
  { key: "warning", label: "预警", activeClassName: "bg-warning text-background", inactiveClassName: "bg-warning/10 text-warning hover:bg-warning/15" },
  { key: "offline", label: "离线", activeClassName: "bg-danger text-white", inactiveClassName: "bg-danger/10 text-danger hover:bg-danger/15" }
] as const;

const SORT_OPTIONS: ReadonlyArray<{ key: SortKey; label: string }> = [
  { key: "name", label: "按名称" },
  { key: "region", label: "按区域" },
  { key: "cpu", label: "按 CPU" },
  { key: "mem", label: "按内存" },
  { key: "disk", label: "按磁盘" }
];

/** Sticky controls for filtering and sorting the fleet list. */
export function ServerFilterBar({
  search,
  status,
  sort,
  onSearchChange,
  onStatusChange,
  onSortChange,
  onClear
}: {
  search: string;
  status: ServerStatus | "all";
  sort: SortKey;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ServerStatus | "all") => void;
  onSortChange: (value: SortKey) => void;
  onClear: () => void;
}) {
  const hasFilter = search.length > 0 || status !== "all";

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-y border-primary/20 bg-background/85 px-4 py-2 shadow-[0_8px_24px_-22px_var(--primary)] backdrop-blur-xl">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-cyan" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="搜索名称 / 区域 / 标签"
          className="h-8 w-56 rounded-md border border-cyan/25 bg-cyan/5 pl-8 pr-2 text-sm outline-none backdrop-blur-sm transition-colors placeholder:text-muted-foreground/70 focus-visible:border-cyan/60 focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <FilterPills options={STATUS_OPTIONS} value={status} onChange={onStatusChange} />
      <select
        value={sort}
        onChange={(event) => onSortChange(event.target.value as SortKey)}
        className="ml-auto h-8 rounded-md border border-violet/25 bg-violet/5 px-2 text-sm outline-none backdrop-blur-sm focus-visible:border-violet/60 focus-visible:ring-2 focus-visible:ring-ring"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.key} value={option.key}>{option.label}</option>
        ))}
      </select>
      {hasFilter ? <Button size="sm" variant="ghost" onClick={onClear}>清除筛选</Button> : null}
    </div>
  );
}
