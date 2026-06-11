import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type FieldProps = {
  label: string;
  className?: string;
  children: ReactNode;
};

export function Field({ label, className, children }: FieldProps) {
  return (
    <label className={cn("grid gap-2 text-sm", className)}>
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

type TextInputProps = ComponentProps<"input">;

export function TextInput({ className, ...props }: TextInputProps) {
  return (
    <input
      className={cn(
        "h-11 rounded-xl border border-input bg-white/70 px-3 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15 dark:bg-white/6",
        className
      )}
      {...props}
    />
  );
}

type SelectProps = ComponentProps<"select">;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "h-11 rounded-xl border border-input bg-white/70 px-3 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15 dark:bg-white/6",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

type TextareaProps = ComponentProps<"textarea">;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "min-h-32 resize-y rounded-[1.15rem] border border-input bg-white/70 p-3 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/15 dark:bg-white/6",
        className
      )}
      {...props}
    />
  );
}
