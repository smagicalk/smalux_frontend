import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/shared/ui/card";
import { InteractiveCardButton } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";

const paletteGroups = [
  {
    title: "角色色",
    colors: [
      {
        label: "Primary",
        className: "bg-primary"
      },
      {
        label: "Accent",
        className: "bg-accent"
      },
      {
        label: "Info",
        className: "bg-info"
      }
    ]
  },
  {
    title: "状态色",
    colors: [
      {
        label: "Success",
        className: "bg-success"
      },
      {
        label: "Warning",
        className: "bg-warning"
      },
      {
        label: "Danger",
        className: "bg-danger"
      }
    ]
  },
  {
    title: "图表色",
    colors: [
      {
        label: "Chart 1",
        className: "bg-chart-1"
      },
      {
        label: "Chart 2",
        className: "bg-chart-2"
      },
      {
        label: "Chart 3",
        className: "bg-chart-3"
      },
      {
        label: "Chart 4",
        className: "bg-chart-4"
      }
    ]
  }
];

export function ColorPaletteCard() {
  return (
    <Card tone="muted">
      <CardHeader>
        <CardTitle>颜色系统</CardTitle>
        <CardDescription>监控后台与公开状态页共享同一套语义 token，但承担不同的呈现任务。</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {paletteGroups.map((group) => (
          <section key={group.title} className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold tracking-[-0.02em]">{group.title}</h3>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {group.colors.map((color) => (
                <InteractiveCardButton
                  key={color.label}
                  tone="muted"
                  padding="sm"
                  className="flex items-center gap-3"
                  onClick={() =>
                    toast.info(color.label, {
                      description: color.className
                    })
                  }
                >
                  <span className={cn("size-10 rounded-xl border border-white/50", color.className)} />
                  <span className="text-sm font-medium text-muted-foreground">{color.label}</span>
                </InteractiveCardButton>
              ))}
            </div>
          </section>
        ))}
      </CardContent>
    </Card>
  );
}
