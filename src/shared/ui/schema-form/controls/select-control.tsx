import { ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { FormFieldSchema, SelectOption } from "../types";

export interface SelectControlProps {
  field: FormFieldSchema;
  value: any;
  onChange: (val: any) => void;
  disabled?: boolean;
  hasError?: boolean;
}

export function SelectControl({ field, value, onChange, disabled, hasError }: SelectControlProps) {
  const options: SelectOption[] = field.options || [];

  return (
    <div className="relative">
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          "w-full h-9 rounded-xl border bg-muted/40 px-3.5 pr-8 text-xs font-mono outline-none transition-all appearance-none cursor-pointer",
          "text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20",
          disabled && "opacity-60 cursor-not-allowed bg-muted/20",
          hasError ? "border-rose-500/80 bg-rose-500/5 focus:border-rose-500" : "border-border/80"
        )}
      >
        {field.placeholder && (
          <option value="" disabled>
            {field.placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={String(opt.value)} value={String(opt.value)} disabled={opt.disabled} className="bg-card text-foreground py-1">
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
        <ChevronDown className="size-3.5" />
      </div>
    </div>
  );
}
