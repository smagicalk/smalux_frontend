import type { BadgeVariant } from "@/shared/ui/badge";

import type { ThemeStatus } from "@/features/themes/model/mock-themes";

export const themeStatusMeta: Record<ThemeStatus, { label: string; variant: BadgeVariant }> = {
  active: { label: "已启用", variant: "success" },
  preview: { label: "预览中", variant: "warning" },
  draft: { label: "草稿", variant: "secondary" }
};
