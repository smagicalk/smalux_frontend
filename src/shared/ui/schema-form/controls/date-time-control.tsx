import { Calendar, Clock } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { FormFieldSchema } from "../types";

export interface DateTimeControlProps {
  field: FormFieldSchema;
  value: any;
  onChange: (val: any) => void;
  disabled?: boolean;
}

export function DateTimeControl({ field, value, onChange, disabled }: DateTimeControlProps) {
  const type = field.type; // "date" | "time" | "datetime"
  const htmlInputType = type === "date" ? "date" : type === "time" ? "time" : "datetime-local";
  const size = field.size || "md";

  const sizeClass =
    size === "sm"
      ? "h-8 text-xs px-2.5"
      : size === "lg"
      ? "h-11 text-sm px-3.5"
      : "h-9 text-xs px-3";

  return (
    <div className="relative flex items-center">
      <input
        type={htmlInputType}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={field.placeholder}
        className={cn(
          "w-full rounded-xl border border-border/80 bg-background font-mono text-foreground transition-all outline-none",
          "focus:border-primary focus:ring-2 focus:ring-primary/20",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          sizeClass
        )}
      />
      <div className="absolute right-3 pointer-events-none text-muted-foreground/60">
        {type === "time" ? <Clock className="size-4" /> : <Calendar className="size-4" />}
      </div>
    </div>
  );
}
