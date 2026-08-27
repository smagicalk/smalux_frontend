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
  const align = field.align || "left";
  const size = field.size || "md";

  // 对齐类名
  const alignClass =
    align === "center"
      ? "justify-center"
      : align === "right"
      ? "justify-end"
      : align === "justify"
      ? "justify-between [&>button]:flex-1 [&>button]:justify-center"
      : "justify-start";

  // 按钮尺寸类名
  const buttonSizeClass =
    size === "sm"
      ? "px-2.5 py-1 text-[11px]"
      : size === "lg"
      ? "px-4 py-2 text-sm"
      : "px-3 py-1.5 text-xs";

  const baseH = size === "sm" ? 32 : size === "lg" ? 44 : 36;
  const computedHeight = field.customHeight || (field.heightUnit && field.heightUnit > 1 ? `${baseH * field.heightUnit + (field.heightUnit - 1) * 8}px` : undefined);

  return (
    <div
      style={computedHeight ? { minHeight: computedHeight } : undefined}
      className={cn(
        "flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-muted/40 border border-border/80",
        alignClass
      )}
    >
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
              "flex items-center gap-1.5 rounded-lg font-medium transition-all cursor-pointer select-none",
              buttonSizeClass,
              isSelected
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              isOptDisabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {Icon && <Icon className="size-3.5 shrink-0" />}
            <span className="truncate">{opt.label}</span>
            {opt.badge && (
              <span className={cn(
                "text-[9px] px-1 py-0.2 rounded font-mono shrink-0",
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
