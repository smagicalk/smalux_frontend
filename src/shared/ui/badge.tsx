import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border bg-transparent text-foreground",
        success: "border-transparent bg-[color:var(--surface-success)] text-[color:var(--success)]",
        warning: "border-transparent bg-[color:var(--surface-warning)] text-[color:var(--warning)]",
        danger: "border-transparent bg-[color:var(--surface-danger)] text-[color:var(--danger)]"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

type BadgeProps = ComponentProps<"span"> & VariantProps<typeof badgeVariants>;
export type BadgeVariant = NonNullable<BadgeProps["variant"]>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}