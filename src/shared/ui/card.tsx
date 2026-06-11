import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";

type CardTone = "default" | "muted" | "strong";

type CardProps = ComponentProps<"section"> & {
  tone?: CardTone;
};

const cardToneClassName: Record<CardTone, string> = {
  default:
    "border-white/60 bg-[color:var(--surface-panel)] shadow-[var(--shadow-soft)] dark:border-white/8",
  muted:
    "border-border/80 bg-[color:var(--surface-muted)] shadow-none dark:border-white/8",
  strong:
    "border-white/70 bg-[color:var(--surface-panel-strong)] shadow-[var(--shadow-panel)] dark:border-white/10"
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
        "min-w-0 rounded-[1.4rem] border text-card-foreground backdrop-blur-sm",
        cardToneClassName[tone],
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-2 p-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentProps<"h3">) {
  return <h3 className={cn("text-lg font-semibold tracking-[-0.03em]", className)} {...props} />;
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
        "min-w-0 cursor-pointer rounded-[1.15rem] border text-left transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 disabled:pointer-events-none disabled:opacity-50",
        cardToneClassName[tone],
        interactiveCardPaddingClassName[padding],
        className
      )}
      {...props}
    />
  );
}
