import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRightIcon, SearchIcon } from "lucide-react";

import { navigationItems } from "@/app/shell/navigation";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";

type QuickSearchProps = {
  className?: string;
  compact?: boolean;
};

const suggestedQueries = ["token", "wss", "审批", "公开"];

export function QuickSearch({ className, compact = false }: QuickSearchProps) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return navigationItems.slice(0, 5);
    }

    return navigationItems
      .map((item) => {
        const haystack = [item.label, item.description, ...item.keywords]
          .join(" ")
          .toLowerCase();

        return {
          item,
          matched: haystack.includes(normalizedQuery)
        };
      })
      .filter((result) => result.matched)
      .map((result) => result.item);
  }, [query]);

  const openFirstResult = () => {
    const firstResult = results[0];

    if (!firstResult) {
      return;
    }

    void navigate({
      to: firstResult.to
    });
    setQuery("");
  };

  return (
    <div className={cn("group/search relative min-w-0", className)}>
      <label className="flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm">
        <SearchIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          placeholder="搜索节点、探针、日志、命令"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              openFirstResult();
            }
          }}
        />
      </label>

      <div className="absolute left-0 right-0 top-11 z-30 hidden rounded-md border border-border bg-card p-2 shadow-[var(--shadow-panel)] group-focus-within/search:block">
        <div className="mb-2 flex items-center justify-between px-2 py-1">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {query ? "search" : "quick jump"}
            </p>
            {!query ? (
              <p className="mt-1 truncate text-[11px] text-muted-foreground">常用：服务器、执行、Ping、设置、安全边界</p>
            ) : null}
          </div>
          <Badge variant="outline">{results.length}</Badge>
        </div>

        {!query ? (
          <div className="mb-2 flex flex-wrap gap-1.5 px-2">
            {suggestedQueries.map((item) => (
              <button
                key={item}
                type="button"
                className="rounded-md border border-border bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setQuery(item)}
              >
                {item}
              </button>
            ))}
          </div>
        ) : null}

        {results.length > 0 ? (
          <div className="grid gap-1">
            {results.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group flex items-center justify-between gap-3 rounded-lg border border-transparent transition-colors hover:bg-muted",
                  compact ? "p-2" : "p-2.5"
                )}
                onClick={() => setQuery("")}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={cn(
                      "flex shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground",
                      compact ? "size-8" : "size-8"
                    )}
                  >
                    <item.icon className="size-4" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold tracking-[-0.02em]">{item.label}</p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
                <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition group-hover:text-foreground" aria-hidden />
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted p-4 text-sm text-muted-foreground">
            没有匹配的后台模块
          </div>
        )}
      </div>
    </div>
  );
}
