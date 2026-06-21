import { Link } from "@tanstack/react-router";
import { ArrowRightIcon } from "lucide-react";

import { navigationSections } from "@/app/shell/navigation";
import { Badge } from "@/shared/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/shared/ui/card";

export function ModuleShortcuts() {
  return (
    <Card tone="muted">
      <CardHeader>
        <CardTitle>模块切换</CardTitle>
        <CardDescription>这里更像探针面板的功能切换区，而不是宣传式入口卡片。</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-3">
        {navigationSections.map((section) => (
          <section key={section.label} className="grid gap-2 rounded-xl bg-card p-3 ">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {section.label}
              </h3>
              <Badge variant="outline">{section.items.length}</Badge>
            </div>
            <div className="grid gap-1.5">
              {section.items
                .filter((item) => item.to !== "/admin")
                .map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="group flex items-center justify-between gap-3 rounded-lg border border-transparent p-2.5 transition hover:border-border hover:bg-muted "
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground ">
                        <item.icon className="size-4" aria-hidden />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold tracking-[-0.02em]">{item.label}</p>
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition group-hover:text-foreground" aria-hidden />
                  </Link>
                ))}
            </div>
          </section>
        ))}
      </CardContent>
    </Card>
  );
}
