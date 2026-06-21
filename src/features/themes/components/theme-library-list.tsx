import type { PublicTheme } from "@/features/themes/model/mock-themes";
import { ThemeLibraryItem } from "@/features/themes/components/theme-library-item";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";

type ThemeLibraryListProps = {
  themes: readonly PublicTheme[];
  onInspect: (theme: PublicTheme) => void;
  onConfigure: (theme: PublicTheme) => void;
  onRollback: (theme: PublicTheme) => void;
};

export function ThemeLibraryList({
  themes,
  onInspect,
  onConfigure,
  onRollback
}: ThemeLibraryListProps) {
  return (
    <Card tone="strong">
      <CardHeader>
        <CardTitle>公开主题</CardTitle>
        <CardDescription>
          上传、预览、启用、回滚和参数配置都集中在这里，避免主题管理被拆成碎片功能。
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {themes.map((theme) => (
          <ThemeLibraryItem
            key={theme.id}
            theme={theme}
            onInspect={onInspect}
            onConfigure={onConfigure}
            onRollback={onRollback}
          />
        ))}
      </CardContent>
    </Card>
  );
}
