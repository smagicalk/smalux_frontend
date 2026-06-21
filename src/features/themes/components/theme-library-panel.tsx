import { toast } from "sonner";

import { ThemeLibraryFilters } from "@/features/themes/components/theme-library-filters";
import { ThemeLibraryList } from "@/features/themes/components/theme-library-list";
import type { PublicTheme, ThemeStatus } from "@/features/themes/model/mock-themes";

type ThemeLibraryPanelProps = {
  themes: readonly PublicTheme[];
  statusFilter: ThemeStatus | "all";
  onStatusFilterChange: (value: ThemeStatus | "all") => void;
  onReset: () => void;
};

export function ThemeLibraryPanel({
  themes,
  statusFilter,
  onStatusFilterChange,
  onReset
}: ThemeLibraryPanelProps) {
  return (
    <div className="grid gap-4">
      <ThemeLibraryFilters
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
        onReset={onReset}
      />
      <ThemeLibraryList
        themes={themes}
        onInspect={(theme) =>
          toast.info(theme.name, {
            description: `${theme.status} · v${theme.version} · ${theme.author}`
          })
        }
        onConfigure={(theme) =>
          toast.info("已打开主题参数", {
            description: `${theme.name} · ${theme.configuration.length} 个参数。`
          })
        }
        onRollback={(theme) =>
          toast.warning("已生成回滚预案", {
            description: `${theme.name} 将回滚到上一版本快照。`
          })
        }
      />
    </div>
  );
}
