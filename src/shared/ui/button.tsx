import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold tracking-[-0.02em] transition disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:opacity-95",
        secondary:
          "bg-[color:var(--surface-muted)] text-secondary-foreground hover:-translate-y-0.5 hover:bg-secondary",
        outline:
          "border border-border/80 bg-white/55 hover:-translate-y-0.5 hover:bg-[color:var(--surface-muted)] dark:bg-white/5",
        ghost:
          "text-muted-foreground hover:bg-[color:var(--surface-muted)] hover:text-foreground",
        danger:
          "bg-danger text-primary-foreground shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:opacity-95"
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-6",
        icon: "size-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
