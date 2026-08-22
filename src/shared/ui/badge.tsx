import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/shared/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums transition-colors",
  {
    variants: {
      variant: {
        neutral: "bg-muted/80 border border-border text-muted-foreground",
        outline: "border border-border text-foreground bg-transparent",
        success: "bg-success/10 border border-success/20 text-success",
        warning: "bg-warning/10 border border-warning/20 text-warning",
        danger: "bg-danger/10 border border-danger/20 text-danger",
        primary: "bg-primary/10 border border-primary/20 text-primary",
        info: "bg-info/10 border border-info/20 text-info"
      }
    },
    defaultVariants: { variant: "neutral" }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "size-1.5 rounded-full",
            variant === "success" && "bg-success pulse-dot",
            variant === "warning" && "bg-warning",
            variant === "danger" && "bg-danger pulse-dot",
            variant === "primary" && "bg-primary",
            variant === "info" && "bg-info",
            (!variant || variant === "neutral" || variant === "outline") && "bg-muted-foreground"
          )}
        />
      )}
      {children}
    </span>
  );
}
