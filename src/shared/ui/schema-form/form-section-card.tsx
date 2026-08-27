import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";
import type { FormSectionSchema } from "./types";

export interface FormSectionCardProps {
  section: FormSectionSchema;
  children: ReactNode;
  className?: string;
  compact?: boolean;
}

export function FormSectionCard({ section, children, className, compact }: FormSectionCardProps) {
  const [collapsed, setCollapsed] = useState(Boolean(section.defaultCollapsed));
  const Icon = section.icon;
  const isCollapsible = Boolean(section.collapsible);

  return (
    <Card className={cn("overflow-hidden border-border/80 bg-card/60 backdrop-blur-sm shadow-xs transition-all", className)}>
      <CardHeader
        onClick={() => isCollapsible && setCollapsed(!collapsed)}
        className={cn(
          "flex flex-row items-center justify-between border-b border-border/60 bg-muted/20 select-none",
          compact ? "px-4 py-3" : "px-5 py-4",
          isCollapsible && "cursor-pointer hover:bg-muted/40 transition-colors"
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0 shadow-2xs">
              <Icon className="size-4" />
            </div>
          )}
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-bold text-foreground truncate">
                {section.title}
              </CardTitle>
              {section.badge && (
                <Badge variant={section.badge.variant || "primary"} className="text-[10px] px-1.5 py-0 h-4 font-mono">
                  {section.badge.text}
                </Badge>
              )}
            </div>
            {section.description && (
              <CardDescription className="text-xs text-muted-foreground truncate">
                {section.description}
              </CardDescription>
            )}
          </div>
        </div>

        {isCollapsible && (
          <button
            type="button"
            className="rounded-lg p-1 text-muted-foreground hover:text-foreground transition-transform"
            aria-label={collapsed ? "展开分块" : "收起分块"}
          >
            <ChevronDown className={cn("size-4 transition-transform duration-200", collapsed ? "-rotate-90" : "rotate-0")} />
          </button>
        )}
      </CardHeader>

      {!collapsed && (
        <CardContent className={cn(compact ? "p-4" : "p-5 sm:p-6")}>
          <div className="grid grid-cols-12 gap-x-4 gap-y-4 sm:gap-y-5">
            {children}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
