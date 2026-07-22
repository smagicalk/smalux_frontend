import { useMemo, useState } from "react";
import { Save } from "lucide-react";

import { useSaveSettings, useSettings } from "@/features/settings/hooks/use-settings";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";
import { EmptyState, Field, FilterPills } from "@/shared/ui/layout";
import { toast } from "@/shared/ui/toaster";
import type { Setting } from "@/shared/api/methods";
import { SettingsGroupSection } from "../components/settings-group-section";
const GROUP_ORDER: Setting["group"][] = ["general", "security", "limits", "network"];

type GroupFilter = "all" | Setting["group"];
const GROUP_OPTS: ReadonlyArray<{ key: GroupFilter; label: string }> = [
  { key: "all", label: "全部" },
  { key: "general", label: "通用" },
  { key: "security", label: "安全" },
  { key: "limits", label: "限制项" },
  { key: "network", label: "网络" }
];

/**
 * Runtime configuration. Settings are flat key/value pairs grouped by domain.
 * Read-only fields (server-enforced) are shown disabled. Edits collect into a
 * draft and save as one batch mutation.
 */
export function SettingsPage() {
  const { data, isLoading } = useSettings();
  const save = useSaveSettings();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<GroupFilter>("all");

  const settings = data?.settings ?? [];
  const visible = settings.filter((s) => (tab === "all" ? true : s.group === tab));

  const grouped = useMemo(() => {
    const map = new Map<Setting["group"], Setting[]>();
    for (const s of visible) {
      const arr = map.get(s.group) ?? [];
      arr.push(s);
      map.set(s.group, arr);
    }
    return GROUP_ORDER.filter((g) => map.has(g)).map((g) => [g, map.get(g)!] as const);
  }, [visible]);

  const dirtyKeys = Object.keys(draft);
  const dirty = dirtyKeys.length > 0;

  const saveAll = () => {
    const changes = dirtyKeys
      .filter((k) => draft[k] !== settings.find((s) => s.key === k)?.value)
      .map((k) => ({ key: k, value: draft[k] }));
    if (!changes.length) return;
    save.mutate(changes, {
      onSuccess: () => {
        toast.success(`已保存 ${changes.length} 项配置`);
        setDraft({});
      },
      onError: () => toast.error("保存失败")
    });
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="设置"
        tone="warning"
        action={
          dirty ? (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setDraft({})}>放弃</Button>
              <Button size="sm" onClick={saveAll} disabled={save.isPending}>
                <Save className="size-3.5" />保存
              </Button>
            </div>
          ) : null
        }
      />

      <div className="px-4 py-2">
        <FilterPills options={GROUP_OPTS} value={tab} onChange={setTab} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <EmptyState text="加载中…" />
        ) : (
          <div className="mx-auto max-w-2xl space-y-4">
            {grouped.map(([group, items]) => {
              return (
                <SettingsGroupSection
                  key={group}
                  group={group}
                  items={items}
                  draft={draft}
                  onDraftChange={(key, value) => setDraft((current) => ({ ...current, [key]: value }))}
                />
              );
            })}
            <Field label="提示">
              <p className="text-xs text-muted-foreground">
                只读项（如 HttpOnly Cookie）由服务端强制启用，无法在此修改。修改后点击右上角「保存」批量提交。
              </p>
            </Field>
          </div>
        )}
      </div>
    </div>
  );
}
