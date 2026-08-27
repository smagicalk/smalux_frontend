import { cn } from "@/shared/lib/utils";
import type { FormFieldSchema, SelectOption } from "../types";

export interface PillSelectControlProps {
  field: FormFieldSchema;
  value: any;
  onChange: (val: any) => void;
  disabled?: boolean;
}

export function PillSelectControl({ field, value, onChange, disabled }: PillSelectControlProps) {
  const options: SelectOption[] = field.options || [];

  return (
    <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-muted/40 border border-border/80">
      {options.map((opt) => {
        const isSelected = value === opt.value;
        const Icon = opt.icon;
        const isOptDisabled = disabled || opt.disabled;

        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => !isOptDisabled && onChange(opt.value)}
            disabled={isOptDisabled}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer select-none",
              isSelected
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              isOptDisabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {Icon && <Icon className="size-3.5 shrink-0" />}
            <span>{opt.label}</span>
            {opt.badge && (
              <span className={cn(
                "text-[9px] px-1 py-0.2 rounded font-mono",
                isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
