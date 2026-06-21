import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";

type CardTone = "default" | "muted" | "strong";

type CardProps = ComponentProps<"section"> & {
  tone?: CardTone;
};

const cardToneClassName: Record<CardTone, string> = {
  default: "border-border bg-card",
  muted: "border-border bg-muted",
  strong: "border-border bg-[color:var(--surface-panel-strong)]"
};

const interactiveCardPaddingClassName = {
  sm: "p-3",
  md: "p-4",
  lg: "p-5"
} as const;

type InteractiveCardButtonProps = ComponentProps<"button"> & {
  tone?: CardTone;
  padding?: keyof typeof interactiveCardPaddingClassName;
};

export function Card({ className, tone = "default", ...props }: CardProps) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-xl border text-card-foreground",
        cardToneClassName[tone],
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5 p-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentProps<"h3">) {
  return <h3 className={cn("text-base font-semibold tracking-tight", className)} {...props} />;
}

export function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p className={cn("max-w-3xl text-sm leading-6 text-muted-foreground", className)} {...props} />
  );
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("p-4 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex items-center p-4 pt-0", className)} {...props} />;
}

export function InteractiveCardButton({
  className,
  tone = "muted",
  padding = "md",
  type = "button",
  ...props
}: InteractiveCardButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "min-w-0 cursor-pointer rounded-lg border text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50",
        cardToneClassName[tone],
        interactiveCardPaddingClassName[padding],
        className
      )}
      {...props}
    />
  );
}