import { Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { FormFieldSchema, SelectOption } from "../types";

export interface CheckboxGroupControlProps {
  field: FormFieldSchema;
  value: any[];
  onChange: (val: any[]) => void;
  disabled?: boolean;
}

export function CheckboxGroupControl({ field, value = [], onChange, disabled }: CheckboxGroupControlProps) {
  const options: SelectOption[] = field.options || [];
  const currentValues: any[] = Array.isArray(value) ? value : [];

  const handleToggle = (optValue: any) => {
    if (disabled) return;
    if (currentValues.includes(optValue)) {
      onChange(currentValues.filter((v) => v !== optValue));
    } else {
      onChange([...currentValues, optValue]);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-2 rounded-xl border border-border/80 bg-muted/20">
      {options.map((opt) => {
        const isChecked = currentValues.includes(opt.value);
        const isOptDisabled = disabled || opt.disabled;

        return (
          <label
            key={String(opt.value)}
            onClick={() => !isOptDisabled && handleToggle(opt.value)}
            className={cn(
              "flex items-center gap-2.5 p-2 rounded-lg border text-xs transition-all cursor-pointer select-none",
              isChecked
                ? "bg-primary/10 border-primary/40 text-foreground font-semibold"
                : "border-border/60 bg-background/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
              isOptDisabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div
              className={cn(
                "size-4 rounded border flex items-center justify-center transition-all shrink-0",
                isChecked ? "bg-primary border-primary text-primary-foreground" : "border-border/80 bg-background"
              )}
            >
              {isChecked && <Check className="size-3 stroke-[3]" />}
            </div>
            <span className="truncate">{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
}
