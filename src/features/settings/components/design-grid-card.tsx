import { SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { DesignCatalogItem } from "@/features/settings/model/design-catalog";
import { Badge } from "@/shared/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/shared/ui/card";
import { InteractiveCardButton } from "@/shared/ui/card";
import { Field, Select } from "@/shared/ui/form-controls";

type DesignGridCardProps = {
  title: string;
  description: string;
  items: DesignCatalogItem[];
};

export function DesignGridCard({ title, description, items }: DesignGridCardProps) {
  const [query, setQuery] = useState("");
  const [badgeFilter, setBadgeFilter] = useState("all");
  const badges = useMemo(() => Array.from(new Set(items.map((item) => item.badge))), [items]);
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        [item.title, item.description, item.badge].join(" ").toLowerCase().includes(normalizedQuery);
      const matchesBadge = badgeFilter === "all" || item.badge === badgeFilter;

      return matchesQuery && matchesBadge;
    });
  }, [badgeFilter, items, query]);

  const announceItem = (item: DesignCatalogItem) => {
    toast.info(item.title, {
      description: `${item.badge} · ${item.description}`
    });
  };

  return (
    <Card tone="muted">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Badge variant="outline">{filteredItems.length}/{items.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <Field label="搜索">
            <div className="flex h-11 items-center gap-2 rounded-xl border border-input bg-white/70 px-3 transition focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/15 dark:bg-white/6">
              <SearchIcon className="size-4 text-muted-foreground" aria-hidden />
              <input
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                placeholder="名称 / 描述 / 标记"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </Field>
          <Field label="标记">
            <Select value={badgeFilter} onChange={(event) => setBadgeFilter(event.target.value)}>
              <option value="all">全部标记</option>
              {badges.map((badge) => (
                <option key={badge} value={badge}>
                  {badge}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => (
            <InteractiveCardButton
              key={item.title}
              tone="muted"
              padding="md"
              className="flex min-w-0 gap-3"
              onClick={() => announceItem(item)}
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--surface-muted)] text-muted-foreground dark:bg-white/8">
                <item.icon aria-hidden />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold tracking-[-0.02em]">{item.title}</h3>
                  <Badge variant={item.badgeVariant}>{item.badge}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </div>
            </InteractiveCardButton>
          ))}
        </div>
        {filteredItems.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/80 bg-white/45 p-4 text-sm text-muted-foreground dark:bg-white/6">
            当前筛选没有命中任何设计项。
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
