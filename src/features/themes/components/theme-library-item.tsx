import { RotateCcwIcon, Settings2Icon } from "lucide-react";

import { themeStatusMeta } from "@/features/themes/model/theme-display";
import type { PublicTheme } from "@/features/themes/model/mock-themes";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

type ThemeLibraryItemProps = {
  theme: PublicTheme;
  onInspect: (theme: PublicTheme) => void;
  onConfigure: (theme: PublicTheme) => void;
  onRollback: (theme: PublicTheme) => void;
};

export function ThemeLibraryItem({
  theme,
  onInspect,
  onConfigure,
  onRollback
}: ThemeLibraryItemProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="rounded-xl border border-border bg-muted p-4 text-left transition  hover:bg-muted hover:shadow-[var(--shadow-soft)]   "
      onClick={() => onInspect(theme)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onInspect(theme);
        }
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold tracking-[-0.02em]">{theme.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {theme.short} · v{theme.version} · {theme.author}
          </p>
        </div>
        <Badge variant={themeStatusMeta[theme.status].variant}>
          {themeStatusMeta[theme.status].label}
        </Badge>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {theme.configuration.map((item) => (
          <div key={item.key} className="rounded-xl bg-card p-3 ">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-1 truncate text-sm font-semibold tracking-[-0.02em]">
              {String(item.value)}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            onConfigure(theme);
          }}
        >
          <Settings2Icon data-icon="inline-start" aria-hidden />
          参数
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={(event) => {
            event.stopPropagation();
            onRollback(theme);
          }}
        >
          <RotateCcwIcon data-icon="inline-start" aria-hidden />
          回滚
        </Button>
      </div>
    </div>
  );
}
