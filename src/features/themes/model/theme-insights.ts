import type { PublicTheme, ThemeStatus } from "@/features/themes/model/mock-themes";

export const uploadTrend = [2, 3, 2, 4, 5, 4, 6, 5, 7, 6, 8, 9];

export const packageLimitBars = [
  { label: "ZIP", value: 20 },
  { label: "解压", value: 80 },
  { label: "主题数", value: 20 },
  { label: "参数项", value: 48 }
];

const statusColor: Record<ThemeStatus, string> = {
  active: "var(--chart-1)",
  preview: "var(--chart-3)",
  draft: "var(--chart-4)"
};

const statusLabel: Record<ThemeStatus, string> = {
  active: "已启用",
  preview: "预览中",
  draft: "草稿"
};

export function filterThemesByStatus(themes: readonly PublicTheme[], statusFilter: ThemeStatus | "all") {
  return themes.filter((theme) => statusFilter === "all" || theme.status === statusFilter);
}

export function createThemeConfigTypeBars(themes: readonly PublicTheme[]) {
  return themes
    .flatMap((theme) => theme.configuration)
    .reduce<Array<{ label: string; value: number }>>((items, config) => {
      const existing = items.find((item) => item.label === config.type);
      if (existing) {
        existing.value += 1;
        return items;
      }

      return [...items, { label: config.type, value: 1 }];
    }, []);
}

export function createThemeStatusSegments(themes: readonly PublicTheme[]) {
  return (["active", "preview", "draft"] as const).map((status) => ({
    label: statusLabel[status],
    value: themes.filter((theme) => theme.status === status).length,
    color: statusColor[status]
  }));
}
