import { Circle, Disc } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { FormFieldSchema, SelectOption } from "../types";

export interface RadioGroupControlProps {
  field: FormFieldSchema;
  value: any;
  onChange: (val: any) => void;
  disabled?: boolean;
}

export function RadioGroupControl({ field, value, onChange, disabled }: RadioGroupControlProps) {
  const options: SelectOption[] = field.options || [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 rounded-xl border border-border/80 bg-muted/20">
      {options.map((opt) => {
        const isSelected = value === opt.value;
        const isOptDisabled = disabled || opt.disabled;

        return (
          <div
            key={String(opt.value)}
            onClick={() => !isOptDisabled && onChange(opt.value)}
            className={cn(
              "flex items-start gap-2.5 p-3 rounded-xl border transition-all cursor-pointer select-none",
              isSelected
                ? "bg-primary/10 border-primary/50 text-foreground ring-1 ring-primary/30"
                : "border-border/60 bg-background/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
              isOptDisabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="pt-0.5 shrink-0 text-primary">
              {isSelected ? (
                <Disc className="size-4 text-primary fill-primary/20" />
              ) : (
                <Circle className="size-4 text-muted-foreground/50" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-foreground truncate">{opt.label}</div>
              {opt.description && (
                <div className="text-[11px] text-muted-foreground pt-0.5 leading-snug">
                  {opt.description}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
