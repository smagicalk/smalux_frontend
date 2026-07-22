import { useMemo, useState } from "react";
import { Palette, Upload } from "lucide-react";

import { useThemes } from "@/features/themes/hooks/use-themes";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";
import { EmptyState, FilterPills, StatTile } from "@/shared/ui/layout";

import { UploadDialog } from "../components/upload-dialog";
import { ThemeCard, ThemeSkeleton } from "../components/theme-list";
import { StatusFunnel } from "../components/theme-charts";
import { SORT_OPTS, STATUS_OPTS, type SortKey, type StatusFilter } from "../lib/theme-meta";

/**
 * The themes page. Owns status filter + sort + upload-open state and renders
 * the KPI strip + status funnel; the upload dialog, each card, and the funnel
 * each live in their own component.
 */
export function ThemesPage() {
  const { data, isLoading } = useThemes();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("updated");
  const [uploadOpen, setUploadOpen] = useState(false);

  const themes = useMemo(() => {
    const list = (data?.themes ?? []).filter((t) => (status === "all" ? true : t.status === status));
    if (sort === "name") return list.sort((a, b) => a.name.localeCompare(b.name));
    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [data, status, sort]);

  const stats = useMemo(() => {
    const all = data?.themes ?? [];
    return {
      total: all.length,
      published: all.filter((t) => t.status === "published").length,
      draft: all.filter((t) => t.status === "draft").length,
      archived: all.filter((t) => t.status === "archived").length,
      public: all.filter((t) => t.publicVisible).length
    };
  }, [data]);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="主题"
        tone="magenta"
        subtitle={`${data?.themes.length ?? 0} 套`}
        action={<Button size="sm" onClick={() => setUploadOpen(true)}><Upload className="size-3.5" />上传主题</Button>}
      />
      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <StatTile label="主题总数" value={stats.total} accent="magenta" icon={<Palette className="size-4" />} />
          <StatTile label="已发布" value={stats.published} accent="success" />
          <StatTile label="草稿" value={stats.draft} accent="violet" />
          <StatTile label="已归档" value={stats.archived} accent="warning" />
          <StatTile label="公开可见" value={stats.public} accent="cyan" />
        </div>

        <div className="glass cornered relative overflow-hidden rounded-md border border-border p-2">
          <span className="absolute inset-x-0 top-0 h-px opacity-60" style={{ background: "linear-gradient(90deg, transparent, var(--primary), transparent)" }} />
          <div className="px-1 pb-1 text-xs text-muted-foreground">状态流转</div>
          <StatusFunnel themes={data?.themes ?? []} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <FilterPills options={STATUS_OPTS} value={status} onChange={setStatus} />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-8 rounded-md border border-border bg-card px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {SORT_OPTS.map((o) => <option key={o.key} value={o.key}>按{o.label}</option>)}
          </select>
        </div>

        {isLoading ? (
          <ThemeSkeleton />
        ) : !themes.length ? (
          <EmptyState text="没有匹配的主题。" icon={<Palette className="size-8" />} action={<Button size="sm" onClick={() => setUploadOpen(true)}><Upload className="size-3.5" />上传主题</Button>} />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {themes.map((t) => <ThemeCard key={t.id} theme={t} />)}
          </div>
        )}
      </div>
    </div>
  );
}
