import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type FieldProps = {
  label: string;
  className?: string;
  children: ReactNode;
};

export function Field({ label, className, children }: FieldProps) {
  return (
    <label className={cn("grid gap-1.5 text-sm", className)}>
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
        "h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40",
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
        "h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40",
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
        "min-h-24 resize-y rounded-md border border-input bg-transparent p-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40",
        className
      )}
      {...props}
    />
  );
}