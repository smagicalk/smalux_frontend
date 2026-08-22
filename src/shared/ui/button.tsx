import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/shared/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 cursor-pointer [&_svg]:size-3.5 [&_svg]:shrink-0 select-none box-border",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-primary text-primary-foreground shadow-sm hover:brightness-110 active:scale-[0.98]",
        secondary:
          "border border-border/80 bg-muted text-foreground hover:bg-muted/80 active:scale-[0.98]",
        outline:
          "border border-border/90 bg-card/60 text-foreground hover:bg-muted hover:border-primary/40 active:scale-[0.98]",
        ghost:
          "border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground active:scale-[0.98]",
        danger:
          "border border-transparent bg-danger text-white shadow-sm hover:brightness-110 active:scale-[0.98]",
        subtle:
          "border border-transparent bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
      },
      size: {
        default: "h-9 px-3.5 text-sm",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-5 text-base",
        icon: "size-8"
      }
    },
    defaultVariants: { variant: "default", size: "default" }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
