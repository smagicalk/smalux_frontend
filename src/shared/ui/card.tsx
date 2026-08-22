import * as React from "react";
import { cn } from "@/shared/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  variant?: "default" | "glass" | "subtle";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, variant = "default", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border border-border/80 text-card-foreground transition-all duration-200",
        variant === "default" && "bg-card shadow-xs",
        variant === "glass" && "glass border-border/60",
        variant === "subtle" && "bg-muted/40 border-border/40",
        hover && "hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1 p-4 pb-2", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-base font-semibold leading-none tracking-tight text-foreground", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-xs text-muted-foreground", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-4 pt-2", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-4 pt-0", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";
