import { Minus, Plus } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { FormFieldSchema } from "../types";

export interface NumberControlProps {
  field: FormFieldSchema;
  value: number | undefined;
  onChange: (val: number | undefined) => void;
  disabled?: boolean;
  hasError?: boolean;
}

export function NumberControl({ field, value, onChange, disabled, hasError }: NumberControlProps) {
  const min = field.validation?.min;
  const max = field.validation?.max;
  const step = field.step || 1;
  const currentVal = typeof value === "number" ? value : 0;

  const handleStep = (delta: number) => {
    if (disabled) return;
    let next = currentVal + delta;
    if (min !== undefined && next < min) next = min;
    if (max !== undefined && next > max) next = max;
    onChange(next);
  };

  const handleInputChange = (raw: string) => {
    if (raw === "") {
      onChange(undefined);
      return;
    }
    const num = parseFloat(raw);
    if (!isNaN(num)) {
      onChange(num);
    }
  };

  return (
    <div className="relative flex items-center">
      {/* 减号步进按钮 */}
      <button
        type="button"
        onClick={() => handleStep(-step)}
        disabled={disabled || (min !== undefined && currentVal <= min)}
        className="h-9 px-2.5 rounded-l-xl border border-r-0 border-border/80 bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
      >
        <Minus className="size-3" />
      </button>

      {/* 数字输入框 */}
      <input
        type="number"
        value={value ?? ""}
        min={min}
        max={max}
        step={step}
        onChange={(e) => handleInputChange(e.target.value)}
        disabled={disabled}
        readOnly={field.readOnly}
        placeholder={field.placeholder || "0"}
        className={cn(
          "w-full h-9 border-y bg-muted/40 px-3 text-center text-xs font-mono outline-none transition-all",
          "placeholder:text-muted-foreground/50 text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
          "focus:border-primary focus:ring-2 focus:ring-primary/20",
          disabled && "opacity-60 cursor-not-allowed bg-muted/20",
          hasError ? "border-rose-500/80 bg-rose-500/5 focus:border-rose-500" : "border-border/80"
        )}
      />

      {/* 单位后缀标识（若配置） */}
      {field.unit && (
        <div className="h-9 px-2.5 bg-muted/30 border-y border-border/80 flex items-center text-[11px] text-muted-foreground/70 font-mono select-none">
          {field.unit}
        </div>
      )}

      {/* 加号步进按钮 */}
      <button
        type="button"
        onClick={() => handleStep(step)}
        disabled={disabled || (max !== undefined && currentVal >= max)}
        className="h-9 px-2.5 rounded-r-xl border border-l-0 border-border/80 bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
      >
        <Plus className="size-3" />
      </button>
    </div>
  );
}
