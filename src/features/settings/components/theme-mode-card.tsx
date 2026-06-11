import { MoonIcon, MonitorIcon, SunIcon } from "lucide-react";
import { toast } from "sonner";

import { useThemeStore, type ThemeMode } from "@/shared/stores/theme-store";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/shared/ui/card";

const modes: Array<{
  mode: ThemeMode;
  label: string;
  icon: typeof SunIcon;
}> = [
  {
    mode: "light",
    label: "浅色",
    icon: SunIcon
  },
  {
    mode: "dark",
    label: "深色",
    icon: MoonIcon
  },
  {
    mode: "system",
    label: "跟随系统",
    icon: MonitorIcon
  }
];

export function ThemeModeCard() {
  const currentMode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);

  return (
    <Card>
      <CardHeader>
        <CardTitle>后台主题</CardTitle>
        <CardDescription>控制台色板需要支持日间扫描和夜间值班两种状态，不依赖单一背景色。</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-3">
          {modes.map((item) => (
            <Button
              key={item.mode}
              variant={currentMode === item.mode ? "secondary" : "outline"}
              className="h-auto justify-start rounded-[1.2rem] px-4 py-4"
              onClick={() => {
                setMode(item.mode);
                toast.info("后台主题已切换", {
                  description: item.label
                });
              }}
            >
              <item.icon data-icon="inline-start" aria-hidden />
              {item.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
