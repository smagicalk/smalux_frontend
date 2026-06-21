import type { SettingLimitGroup } from "@/features/settings/model/setting-limits";
import { Badge } from "@/shared/ui/badge";
import { InteractiveCardButton } from "@/shared/ui/card";

type SettingLimitsGridProps = {
  groups: readonly SettingLimitGroup[];
  onSelectRow: (key: string) => void;
};

export function SettingLimitsGrid({ groups, onSelectRow }: SettingLimitsGridProps) {
  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/80 bg-[color:var(--surface-muted)] p-4 text-sm text-muted-foreground">
        当前筛选没有命中任何限制项参数。
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {groups.map((group) => (
        <section
          key={group.title}
          className="rounded-[1.25rem] border border-white/45 bg-[color:var(--surface-muted)] p-4 dark:border-white/8 dark:bg-white/6"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <group.icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <h3 className="truncate font-semibold tracking-[-0.02em]">{group.title}</h3>
            </div>
            <Badge variant="outline">{group.badge}</Badge>
          </div>
          <dl className="mt-4 grid gap-2 text-sm">
            {group.rows.map(([key, value]) => (
              <InteractiveCardButton
                key={key}
                tone="default"
                padding="sm"
                className="grid gap-1"
                onClick={() => onSelectRow(key)}
              >
                <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {key}
                </dt>
                <dd className="break-words text-sm font-semibold tracking-[-0.02em]">{value}</dd>
              </InteractiveCardButton>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
